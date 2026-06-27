"""
A11y Agent — Evaluates WCAG 2.2 accessibility compliance from real HTML DOM.
Produces structured issue records with WCAG criterion references.
"""
import re
import uuid
import logging
from utils.safe_strings import safe_lower, safe_strip
from typing import List, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger("uxverse.a11y_agent")


class A11yAgent:
    """Evaluates a page's HTML against WCAG 2.2 A/AA/AAA criteria."""

    def analyze(self, html: str, dom_info: Dict[str, Any], url: str) -> List[Dict[str, Any]]:
        issues = []
        if not html:
            return issues

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception as e:
            logger.error(f"HTML parse error for {url}: {e}")
            return issues

        issues += self._check_images(soup)
        issues += self._check_form_labels(soup)
        issues += self._check_page_title(soup)
        issues += self._check_html_lang(soup)
        issues += self._check_duplicate_ids(soup)
        issues += self._check_skip_link(soup)
        issues += self._check_button_labels(soup)
        issues += self._check_link_purpose(soup)
        issues += self._check_heading_structure(soup)
        issues += self._check_keyboard_traps(soup)
        issues += self._check_input_purpose(soup)
        issues += self._check_focus_indicators(soup)
        issues += self._check_aria_validity(soup)
        issues += self._check_tables(soup)
        issues += self._check_error_identification(soup)

        return issues

    # ── 1.1.1 Non-text Content ────────────────────────────────────────────────
    def _check_images(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if not img.has_attr("alt"):
                issues.append({
                    "id": f"wcag-1.1.1-{uuid.uuid4().hex[:6]}",
                    "severity": "Critical",
                    "standard": "WCAG 2.2 A — 1.1.1 Non-text Content",
                    "element": f'<img src="{src[:60]}">',
                    "description": f"Image element is missing an alt attribute. Screen readers cannot convey its meaning.",
                    "recommendation": (
                        "Add a descriptive alt attribute: <img alt=\"Description of image\">. "
                        "For decorative images use alt=\"\"."
                    ),
                })
            elif safe_lower(safe_strip(img.get("alt"))) in ("image", "photo", "picture", "img", "logo"):
                issues.append({
                    "id": f"wcag-1.1.1-generic-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "standard": "WCAG 2.2 A — 1.1.1 Non-text Content",
                    "element": f'<img alt="{img.get("alt")}">',
                    "description": f"Image alt text is generic ('{img.get('alt')}'). Screen readers will read this but it provides no meaningful context.",
                    "recommendation": "Replace generic alt text with a specific, descriptive alternative that conveys the image's purpose.",
                })
        return issues

    # ── 1.3.1 Info and Relationships (Form Labels) ────────────────────────────
    def _check_form_labels(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        label_fors = {lbl.get("for") for lbl in soup.find_all("label") if lbl.get("for")}

        for inp in soup.find_all(["input", "select", "textarea"]):
            inp_type = safe_lower(inp.get("type", "text"))
            if inp_type in ("hidden", "submit", "button", "reset", "image"):
                continue

            inp_id = inp.get("id")
            has_label = (inp_id and inp_id in label_fors)
            has_aria_label = bool(inp.get("aria-label") or inp.get("aria-labelledby"))
            in_label = bool(inp.find_parent("label"))

            if not has_label and not has_aria_label and not in_label:
                elem_str = f"<{inp.name} type=\"{inp_type}\"" + (f" name=\"{inp.get('name')}\"" if inp.get("name") else "") + ">"
                issues.append({
                    "id": f"wcag-1.3.1-{uuid.uuid4().hex[:6]}",
                    "severity": "Critical",
                    "standard": "WCAG 2.2 A — 1.3.1 Info and Relationships",
                    "element": elem_str,
                    "description": f"Form input element has no associated label. Users relying on screen readers cannot identify its purpose.",
                    "recommendation": (
                        "Add a <label for=\"input-id\"> element or use aria-label=\"Field name\" "
                        "on the input element directly."
                    ),
                })
        return issues

    # ── 2.4.2 Page Titled ────────────────────────────────────────────────────
    def _check_page_title(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        title_tag = soup.find("title")
        if not title_tag or not title_tag.get_text(strip=True):
            issues.append({
                "id": f"wcag-2.4.2-{uuid.uuid4().hex[:6]}",
                "severity": "Critical",
                "standard": "WCAG 2.2 A — 2.4.2 Page Titled",
                "element": "<title>",
                "description": "Page is missing a descriptive <title> element. Screen readers announce the title when a page loads.",
                "recommendation": "Add a descriptive <title> tag: <title>Page Name | Site Name</title>",
            })
        elif len(title_tag.get_text(strip=True)) < 5:
            issues.append({
                "id": f"wcag-2.4.2-short-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "standard": "WCAG 2.2 A — 2.4.2 Page Titled",
                "element": f"<title>{title_tag.get_text(strip=True)}</title>",
                "description": "Page title is too short to be descriptive for screen reader users.",
                "recommendation": "Use a descriptive title of at least 10 characters: <title>Page Name | Site Name</title>",
            })
        return issues

    # ── 3.1.1 Language of Page ────────────────────────────────────────────────
    def _check_html_lang(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        html_tag = soup.find("html")
        if html_tag and not html_tag.get("lang"):
            issues.append({
                "id": f"wcag-3.1.1-{uuid.uuid4().hex[:6]}",
                "severity": "Critical",
                "standard": "WCAG 2.2 A — 3.1.1 Language of Page",
                "element": "<html>",
                "description": "The <html> element is missing a lang attribute. Screen readers need this to use the correct pronunciation engine.",
                "recommendation": 'Add a lang attribute: <html lang="en"> (or appropriate language code).',
            })
        return issues

    # ── 4.1.1 Parsing — Duplicate IDs ─────────────────────────────────────────
    def _check_duplicate_ids(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        ids = [tag.get("id") for tag in soup.find_all(id=True)]
        seen, dupes = set(), set()
        for id_val in ids:
            if id_val in seen:
                dupes.add(id_val)
            seen.add(id_val)

        for dupe_id in list(dupes)[:5]:  # cap at 5 to avoid noise
            issues.append({
                "id": f"wcag-4.1.1-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "standard": "WCAG 2.2 A — 4.1.1 Parsing",
                "element": f'id="{dupe_id}"',
                "description": f'Duplicate ID "{dupe_id}" found on multiple elements. ARIA and label associations may break.',
                "recommendation": f"Make all id attributes unique. Rename duplicate id=\"{dupe_id}\" occurrences.",
            })
        return issues

    # ── 2.4.1 Bypass Blocks ──────────────────────────────────────────────────
    def _check_skip_link(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        skip_pattern = re.compile(r"skip|jump to|main content", re.IGNORECASE)
        skip_links = soup.find_all("a", string=skip_pattern)
        skip_links += soup.find_all("a", href=re.compile(r"#main|#content|#skip", re.IGNORECASE))

        if not skip_links and soup.find(["nav", "header"]):
            issues.append({
                "id": f"wcag-2.4.1-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "standard": "WCAG 2.2 A — 2.4.1 Bypass Blocks",
                "element": "<body>",
                "description": "No skip navigation link detected. Keyboard users must tab through the entire navigation menu on every page.",
                "recommendation": (
                    'Add a skip link as the first focusable element: '
                    '<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>'
                ),
            })
        return issues

    # ── 4.1.2 Name, Role, Value — Buttons ────────────────────────────────────
    def _check_button_labels(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        for btn in soup.find_all("button"):
            text = btn.get_text(strip=True)
            aria_label = btn.get("aria-label") or btn.get("aria-labelledby")
            title = btn.get("title")
            if not text and not aria_label and not title:
                issues.append({
                    "id": f"wcag-4.1.2-btn-{uuid.uuid4().hex[:6]}",
                    "severity": "Critical",
                    "standard": "WCAG 2.2 A — 4.1.2 Name, Role, Value",
                    "element": str(btn)[:80],
                    "description": "Button element has no accessible name (no text, no aria-label, no title). Screen readers will announce it as an unlabelled button.",
                    "recommendation": "Add descriptive text inside the button or use aria-label: <button aria-label=\"Close dialog\">",
                })
        return issues

    # ── 2.4.4 Link Purpose ───────────────────────────────────────────────────
    def _check_link_purpose(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        vague_texts = {"click here", "here", "read more", "more", "link", "this", "learn more"}
        for a in soup.find_all("a", href=True):
            text = a.get_text(strip=True).lower()
            aria_label = a.get("aria-label", "")
            if text in vague_texts and not aria_label:
                issues.append({
                    "id": f"wcag-2.4.4-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "standard": "WCAG 2.2 A — 2.4.4 Link Purpose (In Context)",
                    "element": f'<a href="{a.get("href", "")[:50]}">{text}</a>',
                    "description": f'Link text "{text}" is ambiguous. Screen reader users cannot determine its destination out of context.',
                    "recommendation": 'Replace with descriptive text or add aria-label: <a href="..." aria-label="Read more about our pricing">Read more</a>',
                })
        return issues

    # ── 1.3.6 Identify Purpose — Heading Structure ───────────────────────────
    def _check_heading_structure(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        h1_tags = soup.find_all("h1")

        if len(h1_tags) == 0:
            issues.append({
                "id": f"wcag-1.3.6-noh1-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "standard": "WCAG 2.2 AA — 1.3.6 Identify Purpose",
                "element": "<body>",
                "description": "Page has no <h1> heading. Screen readers use headings to navigate document structure.",
                "recommendation": "Add exactly one <h1> element that describes the page's main topic or purpose.",
            })
        elif len(h1_tags) > 1:
            issues.append({
                "id": f"wcag-1.3.6-multih1-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "standard": "WCAG 2.2 AA — 1.3.6 Identify Purpose",
                "element": "<h1>",
                "description": f"Page has {len(h1_tags)} <h1> elements. Multiple H1 tags confuse screen readers and break document outline.",
                "recommendation": "Use exactly one <h1> per page. Reorganize secondary headings as <h2> or <h3>.",
            })

        # Check for heading level skips (e.g. h1 → h3)
        heading_levels = [int(h.name[1]) for h in soup.find_all(["h1","h2","h3","h4","h5","h6"])]
        for i in range(1, len(heading_levels)):
            if heading_levels[i] - heading_levels[i-1] > 1:
                issues.append({
                    "id": f"wcag-1.3.6-skip-{uuid.uuid4().hex[:6]}",
                    "severity": "Minor",
                    "standard": "WCAG 2.2 AA — 1.3.6 Identify Purpose",
                    "element": f"<h{heading_levels[i-1]}> → <h{heading_levels[i]}>",
                    "description": f"Heading level jumps from H{heading_levels[i-1]} to H{heading_levels[i]}, skipping level(s). This breaks the document outline for assistive technologies.",
                    "recommendation": f"Add intermediate heading level(s) between H{heading_levels[i-1]} and H{heading_levels[i]}.",
                })
                break  # report only once per page
        return issues

    # ── 2.1.1 Keyboard ────────────────────────────────────────────────────────
    def _check_keyboard_traps(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Detect tabindex=-1 on interactive elements
        for elem in soup.find_all(["button", "a", "input", "select", "textarea"]):
            if elem.get("tabindex") == "-1" and not elem.get("aria-hidden"):
                issues.append({
                    "id": f"wcag-2.1.1-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "standard": "WCAG 2.2 A — 2.1.1 Keyboard",
                    "element": str(elem)[:80],
                    "description": f"Interactive <{elem.name}> element has tabindex=\"-1\", removing it from keyboard focus order without hiding it from accessibility tree.",
                    "recommendation": "Remove tabindex=-1 from interactive elements, or add aria-hidden=\"true\" if the element should be invisible to assistive technology.",
                })
                break  # once per page is enough
        return issues

    # ── 1.3.5 Identify Input Purpose ─────────────────────────────────────────
    def _check_input_purpose(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        auto_fields = {
            "email": "email", "username": "username",
            "password": "current-password", "phone": "tel",
            "firstname": "given-name", "lastname": "family-name",
            "name": "name", "address": "street-address",
        }
        for inp in soup.find_all("input"):
            inp_name = safe_lower(inp.get("name") or inp.get("id") or "")
            inp_type = safe_lower(inp.get("type", "text"))
            for field_kw, ac_value in auto_fields.items():
                if field_kw in inp_name and not inp.get("autocomplete") and inp_type not in ("hidden", "submit"):
                    issues.append({
                        "id": f"wcag-1.3.5-{uuid.uuid4().hex[:6]}",
                        "severity": "Minor",
                        "standard": "WCAG 2.2 AA — 1.3.5 Identify Input Purpose",
                        "element": f'<input name="{inp.get("name","")}" type="{inp_type}">',
                        "description": f"Input field appears to collect {field_kw} data but lacks an autocomplete attribute. Users with cognitive disabilities may struggle to complete the form.",
                        "recommendation": f'Add autocomplete="{ac_value}" to help browsers autofill this field.',
                    })
                    break
        return issues

    # ── 2.4.7 Focus Visible ───────────────────────────────────────────────────
    def _check_focus_indicators(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        style_tags = soup.find_all("style")
        css_text = " ".join(s.get_text() for s in style_tags)
        if "outline: none" in css_text or "outline:none" in css_text or "outline: 0" in css_text:
            issues.append({
                "id": f"wcag-2.4.7-{uuid.uuid4().hex[:6]}",
                "severity": "Critical",
                "standard": "WCAG 2.2 AA — 2.4.7 Focus Visible",
                "element": "<style>",
                "description": "CSS contains 'outline: none' or 'outline: 0' which removes visible focus indicators. Keyboard users cannot track which element has focus.",
                "recommendation": "Remove outline: none from global CSS. Replace with a custom focus style: :focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }",
            })
        return issues

    # ── 4.1.2 ARIA Validity ───────────────────────────────────────────────────
    def _check_aria_validity(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        valid_roles = {"button","link","checkbox","radio","textbox","combobox","listbox",
                       "menuitem","menuitemcheckbox","menuitemradio","option","tab","tabpanel",
                       "dialog","alertdialog","alert","status","tooltip","progressbar",
                       "slider","spinbutton","searchbox","switch","treeitem","gridcell",
                       "columnheader","rowheader","row","grid","treegrid","banner",
                       "complementary","contentinfo","form","main","navigation","region",
                       "search","application","document","feed","figure","group",
                       "heading","img","list","listitem","math","none","note","presentation",
                       "separator","table","term","definition","article","cell"}

        for elem in soup.find_all(attrs={"role": True}):
            role = elem.get("role", "").strip()
            if role and role not in valid_roles:
                issues.append({
                    "id": f"wcag-4.1.2-aria-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "standard": "WCAG 2.2 A — 4.1.2 Name, Role, Value",
                    "element": f'<{elem.name} role="{role}">',
                    "description": f'Invalid ARIA role="{role}" detected. Assistive technologies will not recognize this role.',
                    "recommendation": f'Replace role="{role}" with a valid WAI-ARIA role. See https://www.w3.org/TR/wai-aria-1.2/#role_definitions',
                })
        return issues

    # ── 1.3.1 Tables without headers ─────────────────────────────────────────
    def _check_tables(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        for table in soup.find_all("table"):
            headers = table.find_all("th")
            role = table.get("role", "")
            if not headers and role not in ("presentation", "none"):
                issues.append({
                    "id": f"wcag-1.3.1-tbl-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "standard": "WCAG 2.2 A — 1.3.1 Info and Relationships",
                    "element": "<table>",
                    "description": "Data table has no <th> header cells. Screen readers cannot associate data cells with their headers.",
                    "recommendation": "Add <th scope=\"col\"> for column headers and <th scope=\"row\"> for row headers. Or add role=\"presentation\" if it's a layout table.",
                })
        return issues

    # ── 3.3.1 Error Identification ────────────────────────────────────────────
    def _check_error_identification(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        for form in soup.find_all("form"):
            required_inputs = form.find_all(["input","select","textarea"], attrs={"required": True})
            required_aria = form.find_all(["input","select","textarea"], attrs={"aria-required": "true"})
            all_inputs = form.find_all(["input","select","textarea"])

            if all_inputs and not required_inputs and not required_aria:
                issues.append({
                    "id": f"wcag-3.3.1-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "standard": "WCAG 2.2 A — 3.3.1 Error Identification",
                    "element": "<form>",
                    "description": "Form has input fields but none are marked as required. Users cannot distinguish mandatory from optional fields.",
                    "recommendation": 'Add the required attribute or aria-required="true" to mandatory fields, and provide visible indicators (e.g., asterisk with legend).',
                })
                break
        return issues
