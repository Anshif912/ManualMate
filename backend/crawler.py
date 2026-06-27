"""
UXVerse AI — Playwright BFS Crawler (Advanced SEO & Canonical Deduplication)
Crawls unique user-accessible pages using Playwright browser navigation.
Respects canonical tags, ignores asset, framework, API, auth, and parameter variations.
"""
import asyncio
import base64
import logging
import os
import re
import time
import urllib.parse
from typing import Any, Callable, Dict, List, Optional, Set

import requests as req_lib
from bs4 import BeautifulSoup

logger = logging.getLogger("uxverse.crawler")

# --- Helpers ---

def normalize_url(url: str, base: str) -> Optional[str]:
    """
    Normalizes URLs by:
    - Resolving relative paths against the base URL.
    - Stripping trailing slashes (except root).
    - Removing fragments (#section).
    - Removing tracking parameters (utm_*).
    - Removing pagination parameters (?page=2).
    - Removing sorting/filter parameters (sort, filter, category, tag).
    - Removing infinite calendar date parameters.
    - Ordering remaining parameters alphabetically for consistent hashing.
    """
    try:
        full = urllib.parse.urljoin(base, url)
        p = urllib.parse.urlparse(full)
        
        # Clean path: strip trailing slashes (except root)
        path = p.path.rstrip("/") or "/"
        
        cleaned_query = ""
        if p.query:
            params = urllib.parse.parse_qsl(p.query)
            ignore_keys = {
                "page", "p", "sort", "orderby", "order", "filter", 
                "category", "cat", "tag", "date", "month", "year", "day"
            }
            cleaned_params = []
            for k, v in params:
                kl = k.lower()
                # Ignore utm_* and keys in ignore_keys
                if kl.startswith("utm_") or kl in ignore_keys:
                    continue
                cleaned_params.append((k, v))
            if cleaned_params:
                # Sort parameters for consistent URL uniqueness
                cleaned_params.sort(key=lambda x: x[0])
                cleaned_query = urllib.parse.urlencode(cleaned_params)

        netloc = p.netloc.lower()
        clean = urllib.parse.urlunparse((p.scheme, netloc, path, "", cleaned_query, ""))
        return clean
    except Exception:
        return None


def is_internal(url: str, base_netloc: str) -> bool:
    try:
        p = urllib.parse.urlparse(url)
        netloc = p.netloc.lower()
        base = base_netloc.lower()
        return netloc == base or netloc == "" or netloc.endswith("." + base)
    except Exception:
        return False


def should_ignore_url(url: str, start_url: str, base_netloc: str) -> bool:
    """
    Ignore criteria:
    - External domains.
    - Asset extensions (images, zip, pdf, css, js).
    - API paths (/api/*, /graphql, /rpc).
    - Framework paths (/_next/*, /static/*, /assets/*, /build/*, /dist/*).
    - Auth routes unless it is the start URL.
    - Infinite calendar / date patterns.
    """
    try:
        norm = normalize_url(url, start_url)
        if not norm:
            return True
            
        p = urllib.parse.urlparse(norm)
        
        # 1. External domains
        if not is_internal(norm, base_netloc):
            return True
            
        path = p.path or "/"
        path_lower = path.lower().rstrip("/")
        if not path_lower:
            path_lower = "/"
            
        # If this URL is exactly the start URL path, do not ignore it even if it contains auth keywords
        start_p = urllib.parse.urlparse(start_url)
        start_path_norm = start_p.path.lower().rstrip("/") or "/"
        if path_lower == start_path_norm:
            return False

        # 2. Asset extensions
        asset_exts = {
            ".png", ".jpg", ".jpeg", ".svg", ".gif", ".css", ".js", ".woff", ".woff2", ".ico", ".pdf", ".zip",
            ".doc", ".docx", ".xls", ".xlsx", ".tar", ".gz", ".exe", ".dmg", ".pkg", ".mp4", ".mp3", ".wav", ".ogg",
            ".webm", ".webp", ".map", ".xml", ".json", ".txt"
        }
        _, ext = os.path.splitext(path.lower())
        if ext in asset_exts:
            return True
            
        # 3. Ignore API routes
        if path_lower.startswith("/api") or "/api/" in path_lower or path_lower in ("/graphql", "/rpc"):
            return True
            
        # 4. Ignore Framework routes
        framework_prefixes = ("/_next", "/static", "/assets", "/build", "/dist")
        for pref in framework_prefixes:
            if path_lower.startswith(pref) or f"/{pref.lstrip('/')}/" in path_lower:
                return True
                
        # 5. Ignore Authentication routes (ignore unless requested via start_url)
        auth_routes = ("/login", "/logout", "/signin", "/signup", "/register", "/forgot-password", "/sign-out", "/log-out", "/delete-account")
        for auth in auth_routes:
            if path_lower.endswith(auth) or f"{auth}/" in path_lower:
                return True

        # 6. Ignore infinite calendar/date patterns in path
        calendar_patterns = [
            r"/\d{4}/\d{2}/\d{2}",  # /2026/06/27
            r"/\d{4}/\d{2}",        # /2026/06
            r"\d{4}-\d{2}-\d{2}",   # 2026-06-27
            r"\d{4}-\d{2}",         # 2026-06
            r"/calendar",           # /calendar
            r"/event/\d{4}",
        ]
        for pattern in calendar_patterns:
            if re.search(pattern, path_lower):
                return True

        return False
    except Exception:
        return True


def get_path(url: str) -> str:
    try:
        p = urllib.parse.urlparse(url)
        path = p.path or "/"
        return path
    except Exception:
        return "/"


def get_parent_path(path: str) -> str:
    if path in ("/", ""):
        return ""
    parts = path.rstrip("/").rsplit("/", 1)
    return parts[0] if parts[0] else "/"


def try_get_sitemap_urls(start_url: str, base_netloc: str) -> Set[str]:
    """Optionally fetch urls from sitemap.xml to assist discovery."""
    urls = set()
    try:
        parsed = urllib.parse.urlparse(start_url)
        sitemap_url = f"{parsed.scheme}://{parsed.netloc}/sitemap.xml"
        resp = req_lib.get(sitemap_url, timeout=5)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "xml")
            for loc in soup.find_all("loc"):
                url = loc.get_text(strip=True)
                if url and is_internal(url, base_netloc) and not should_ignore_url(url, start_url, base_netloc):
                    urls.add(url)
            logger.info(f"Discovered {len(urls)} URLs from optional sitemap.xml")
    except Exception as e:
        logger.debug(f"Optional sitemap parse failed/skipped: {e}")
    return urls


def deduplicate_pages(pages: List[Dict[str, Any]], base_netloc: str) -> List[Dict[str, Any]]:
    """Deduplicates pages using canonical URL comparison (respects link[rel=canonical])."""
    unique_pages = []
    seen_canonicals = set()
    for page in pages:
        canonical = page.get("canonical_url") or page.get("url")
        if not canonical:
            continue
        
        # Verify canonical URL is internal
        if not is_internal(canonical, base_netloc):
            logger.info(f"Canonical URL points to external domain: {canonical}. Skipping duplicate page: {page.get('url')}")
            continue

        if canonical not in seen_canonicals:
            seen_canonicals.add(canonical)
            unique_pages.append(page)
        else:
            logger.info(f"Removed duplicate page by canonical comparison: {page.get('url')} -> {canonical}")
            
    logger.info(f"Final unique canonical pages: {len(unique_pages)} (deduplicated from {len(pages)})")
    return unique_pages


def extract_dom_info(soup: BeautifulSoup) -> Dict[str, Any]:
    """Extract structured DOM information for agent analysis."""
    labels = {lbl.get("for"): lbl.get_text(strip=True) for lbl in soup.find_all("label") if lbl.get("for")}
    inputs = []
    for inp in soup.find_all(["input", "select", "textarea"])[:25]:
        inp_id = inp.get("id")
        inputs.append({
            "type": inp.get("type", "text"),
            "id": inp_id,
            "name": inp.get("name"),
            "label": labels.get(inp_id),
            "aria_label": inp.get("aria-label"),
            "placeholder": inp.get("placeholder"),
            "required": inp.has_attr("required"),
        })

    return {
        "images": [
            {"src": img.get("src", "")[:100], "alt": img.get("alt"), "has_alt": img.has_attr("alt")}
            for img in soup.find_all("img")[:30]
        ],
        "buttons": [
            {"text": btn.get_text(strip=True)[:60], "aria_label": btn.get("aria-label"), "type": btn.get("type")}
            for btn in soup.find_all("button")[:25]
        ],
        "inputs": inputs,
        "headings": [
            {"tag": h.name, "text": h.get_text(strip=True)[:120]}
            for h in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
        ],
        "links": len(soup.find_all("a")),
        "forms": len(soup.find_all("form")),
        "nav_elements": len(soup.find_all("nav")),
        "has_skip_link": bool(
            soup.find("a", href=re.compile(r"#main|#content|#skip", re.I))
            or soup.find("a", string=re.compile(r"skip", re.I))
        ),
        "has_lang_attr": bool(soup.find("html", lang=True)),
        "has_main_landmark": bool(soup.find("main") or soup.find(attrs={"role": "main"})),
        "html_lang": (soup.find("html") or {}).get("lang", "") if soup.find("html") else "",
        "duplicate_ids": _find_duplicate_ids(soup),
    }


def _find_duplicate_ids(soup: BeautifulSoup) -> List[str]:
    ids = [tag.get("id") for tag in soup.find_all(id=True)]
    seen: Set[str] = set()
    dupes: List[str] = []
    for id_val in ids:
        if id_val in seen:
            dupes.append(id_val)
        seen.add(id_val)
    return dupes[:5]


# ─── Playwright Crawler ───────────────────────────────────────────────────────

async def _playwright_crawl(
    start_url: str,
    max_pages: int,
    max_depth: int,
    progress_callback: Optional[Callable],
) -> List[Dict[str, Any]]:
    from playwright.async_api import async_playwright

    parsed = urllib.parse.urlparse(start_url)
    base_netloc = parsed.netloc
    
    # Optional sitemap integration to seed queue
    sitemap_links = try_get_sitemap_urls(start_url, base_netloc)
    
    visited: Set[str] = set()
    pages_data: List[Dict[str, Any]] = []

    # BFS queue: (url, depth, parent_path)
    queue: List[tuple] = [(start_url, 0, "")]
    for sl in sitemap_links:
        queue.append((sl, 1, ""))

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-extensions"],
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 UXVerseAI/1.0",
            ignore_https_errors=True,
        )

        try:
            while queue and len(pages_data) < max_pages:
                current_url, depth, parent_path = queue.pop(0)

                norm = normalize_url(current_url, start_url)
                if not norm or norm in visited:
                    continue
                if depth > max_depth:
                    continue
                if should_ignore_url(current_url, start_url, base_netloc):
                    continue

                visited.add(norm)
                path = get_path(norm)
                computed_parent = get_parent_path(path) if depth > 0 else ""

                # Pages Discovered represents all unique normalized URLs encountered + queued
                discovered_count = len(visited) + len(queue)
                if progress_callback:
                    await progress_callback(
                        current_page=norm,
                        discovered_count=discovered_count,
                        completed_count=len(pages_data),
                        agent="Explorer Agent — Crawling unique pages with Playwright",
                    )

                page = await context.new_page()
                html, title, screenshot_b64, dom_info, canonical_url = "", path, None, {}, None

                try:
                    response = await page.goto(norm, wait_until="domcontentloaded", timeout=15_000)
                    if response and response.status >= 400:
                        logger.info(f"Skip {norm} → HTTP {response.status}")
                        await page.close()
                        continue

                    await page.wait_for_timeout(600)

                    title = await page.title() or path
                    html = await page.content()

                    # Extract canonical tag
                    canonical_href = await page.evaluate(
                        "() => { const link = document.querySelector('link[rel=\"canonical\"]'); return link ? link.href : null; }"
                    )
                    if canonical_href:
                        canonical_url = normalize_url(canonical_href, norm)

                    # Screenshot
                    try:
                        ss_bytes = await page.screenshot(type="jpeg", quality=55, full_page=False)
                        screenshot_b64 = base64.b64encode(ss_bytes).decode("utf-8")
                    except Exception as e:
                        logger.debug(f"Screenshot failed {norm}: {e}")

                    # Extract links via DOM navigation (Playwright evaluates this)
                    hrefs: List[str] = await page.evaluate(
                        "() => Array.from(document.querySelectorAll('a[href]')).map(a=>a.href)"
                    )
                    for href in hrefs:
                        norm_link = normalize_url(href, norm)
                        if (
                            norm_link
                            and norm_link not in visited
                            and is_internal(norm_link, base_netloc)
                            and not should_ignore_url(norm_link, start_url, base_netloc)
                            and norm_link not in [q[0] for q in queue]
                        ):
                            queue.append((norm_link, depth + 1, path))

                except asyncio.TimeoutError:
                    logger.warning(f"Timeout: {norm}")
                except Exception as e:
                    logger.error(f"Page error {norm}: {e}")
                finally:
                    await page.close()

                if html:
                    soup = BeautifulSoup(html, "html.parser")
                    dom_info = extract_dom_info(soup)
                    title = title or soup.find("title", text=True) or path

                pages_data.append({
                    "url": norm,
                    "canonical_url": canonical_url or norm,
                    "path": path,
                    "parent_path": computed_parent,
                    "title": title,
                    "html": html,
                    "screenshot_b64": screenshot_b64,
                    "dom_info": dom_info,
                    "depth": depth,
                })

        finally:
            await context.close()
            await browser.close()

    # Apply canonical deduplication before returning unique pages
    return deduplicate_pages(pages_data, base_netloc)


# ─── Requests Fallback Crawler ────────────────────────────────────────────────

async def _requests_crawl(
    start_url: str,
    max_pages: int,
    max_depth: int,
    progress_callback: Optional[Callable],
) -> List[Dict[str, Any]]:
    parsed = urllib.parse.urlparse(start_url)
    base_netloc = parsed.netloc
    
    # Optional sitemap integration to seed queue
    sitemap_links = try_get_sitemap_urls(start_url, base_netloc)
    
    visited: Set[str] = set()
    pages_data: List[Dict[str, Any]] = []
    
    queue: List[tuple] = [(start_url, 0, "")]
    for sl in sitemap_links:
        queue.append((sl, 1, ""))

    session = req_lib.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) UXVerseAI/1.0"})

    while queue and len(pages_data) < max_pages:
        current_url, depth, parent_path = queue.pop(0)
        norm = normalize_url(current_url, start_url)
        if not norm or norm in visited:
            continue
        if depth > max_depth:
            continue
        if should_ignore_url(current_url, start_url, base_netloc):
            continue

        visited.add(norm)
        path = get_path(norm)
        computed_parent = get_parent_path(path) if depth > 0 else ""

        discovered_count = len(visited) + len(queue)
        if progress_callback:
            await progress_callback(
                current_page=norm,
                discovered_count=discovered_count,
                completed_count=len(pages_data),
                agent="Explorer Agent — Crawling unique pages (requests mode)",
            )

        html, title, dom_info, canonical_url = "", path, {}, None
        try:
            resp = session.get(norm, timeout=10, allow_redirects=True)
            if resp.status_code >= 400:
                continue
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")
            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else path
            dom_info = extract_dom_info(soup)

            # Extract canonical tag
            canonical_tag = soup.find("link", rel="canonical")
            canonical_href = canonical_tag.get("href") if canonical_tag else None
            if canonical_href:
                canonical_url = normalize_url(canonical_href, norm)

            for a in soup.find_all("a", href=True):
                nl = normalize_url(a["href"], norm)
                if (
                    nl 
                    and nl not in visited 
                    and is_internal(nl, base_netloc) 
                    and not should_ignore_url(nl, start_url, base_netloc)
                ):
                    if nl not in [q[0] for q in queue]:
                        queue.append((nl, depth + 1, path))

            time.sleep(0.25)  # polite delay

        except Exception as e:
            logger.error(f"requests crawl error {norm}: {e}")

        pages_data.append({
            "url": norm,
            "canonical_url": canonical_url or norm,
            "path": path,
            "parent_path": computed_parent,
            "title": title,
            "html": html,
            "screenshot_b64": None,
            "dom_info": dom_info,
            "depth": depth,
        })

    return deduplicate_pages(pages_data, base_netloc)


# ─── Public API ───────────────────────────────────────────────────────────────

async def crawl_async(
    start_url: str,
    max_pages: int = 15,
    max_depth: int = 3,
    progress_callback: Optional[Callable] = None,
) -> List[Dict[str, Any]]:
    """Crawl start_url using Playwright; fall back to requests if unavailable."""
    try:
        import playwright  # noqa
        pages = await _playwright_crawl(start_url, max_pages, max_depth, progress_callback)
        if not pages:
            raise RuntimeError("Playwright returned 0 pages")
        return pages
    except Exception as e:
        logger.warning(f"Playwright unavailable ({e}), falling back to requests")
        return await _requests_crawl(start_url, max_pages, max_depth, progress_callback)


def crawl_sync(
    start_url: str,
    max_pages: int = 15,
    progress_callback: Optional[Callable] = None,
) -> List[Dict[str, Any]]:
    """Synchronous wrapper for crawl_async."""
    async def _run():
        return await crawl_async(start_url, max_pages=max_pages, progress_callback=progress_callback)

    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(_run())
    finally:
        loop.close()
