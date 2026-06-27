"""
UX Agent — Evaluates pages against Nielsen's 10 Usability Heuristics using real DOM analysis.
Returns structured issue records with heuristic references and actionable recommendations.
"""
import re
import uuid
import logging
from typing import List, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger("uxverse.ux_agent")


class UXAgent:
    """Evaluates a page's HTML against Nielsen's 10 Usability Heuristics."""

    HEURISTICS = {
        "H1": "Heuristic #1: Visibility of System Status",
        "H2": "Heuristic #2: Match Between System and the Real World",
        "H3": "Heuristic #3: User Control and Freedom",
        "H4": "Heuristic #4: Consistency and Standards",
        "H5": "Heuristic #5: Error Prevention",
        "H6": "Heuristic #6: Recognition Rather Than Recall",
        "H7": "Heuristic #7: Flexibility and Efficiency of Use",
        "H8": "Heuristic #8: Aesthetic and Minimalist Design",
        "H9": "Heuristic #9: Help Users Recognize, Diagnose, and Recover From Errors",
        "H10": "Heuristic #10: Help and Documentation",
    }

    def analyze(self, html: str, dom_info: Dict[str, Any], url: str) -> List[Dict[str, Any]]:
        issues = []
        if not html:
            return issues

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception as e:
            logger.error(f"HTML parse error for {url}: {e}")
            return issues

        issues += self._check_system_status(soup)
        issues += self._check_real_world_match(soup)
        issues += self._check_user_control(soup)
        issues += self._check_consistency(soup)
        issues += self._check_error_prevention(soup)
        issues += self._check_recognition_over_recall(soup)
        issues += self._check_efficiency(soup, url)
        issues += self._check_minimalist_design(soup)
        issues += self._check_error_recovery(soup)
        issues += self._check_help_documentation(soup)

        return issues

    # ── H1: Visibility of System Status ──────────────────────────────────────
    def _check_system_status(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Check for forms without any loading indicator pattern
        forms = soup.find_all("form")
        for form in forms:
            buttons = form.find_all(["button", "input"], attrs={"type": ["submit", "button"]})
            has_spinner = bool(form.find(class_=re.compile(r"spin|load|progress", re.I)))
            has_disabled_state = any(btn.get("data-loading") or btn.get("data-state") for btn in buttons)
            if buttons and not has_spinner and not has_disabled_state:
                issues.append({
                    "id": f"ux-h1-form-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H1"],
                    "element": "<form>",
                    "description": "Form submission button shows no loading state indicator. Users receive no feedback that their action is being processed.",
                    "recommendation": (
                        "Add a visual loading state to form submit buttons: disable the button and show a spinner icon on click. "
                        "Example: <button disabled aria-busy=\"true\"><span class=\"spinner\"></span> Submitting...</button>"
                    ),
                })
                break

        # Check for progress indicators in multi-step processes
        step_pattern = re.compile(r"step|wizard|checkout|onboard", re.I)
        step_divs = soup.find_all(class_=step_pattern)
        if step_divs:
            progress_bar = soup.find(["progress", "[role=progressbar]"]) or soup.find(class_=re.compile(r"progress|stepper", re.I))
            if not progress_bar:
                issues.append({
                    "id": f"ux-h1-progress-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H1"],
                    "element": "<div class='step/checkout'>",
                    "description": "Multi-step process detected but no progress indicator (progress bar or step counter) is visible.",
                    "recommendation": "Add a step indicator showing current progress: Step 2 of 4, or a progress bar with aria-valuenow/aria-valuemax attributes.",
                })
        return issues

    # ── H2: Match Between System and Real World ───────────────────────────────
    def _check_real_world_match(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        tech_jargon = [
            ("404", "Error 404"), ("500", "Internal Server Error"), ("null", "null value"),
            ("undefined", "undefined"), ("NaN", "NaN"), ("exception", "exception thrown"),
            ("stacktrace", "stacktrace"), ("query", "database query"), ("api", "API endpoint"),
        ]
        body_text = soup.get_text(" ", strip=True).lower()
        found_jargon = [term for term, _ in tech_jargon if f" {term} " in f" {body_text} "]
        if found_jargon:
            issues.append({
                "id": f"ux-h2-jargon-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H2"],
                "element": "<body>",
                "description": f"Technical jargon detected in page content: '{', '.join(found_jargon[:3])}'. Users unfamiliar with technical terminology may be confused.",
                "recommendation": "Replace technical error messages and labels with plain, user-friendly language. Example: 'Page not found' instead of '404'.",
            })
        return issues

    # ── H3: User Control and Freedom ──────────────────────────────────────────
    def _check_user_control(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Check for modals/dialogs without close buttons
        modals = soup.find_all(attrs={"role": "dialog"})
        modals += soup.find_all(class_=re.compile(r"modal|dialog|overlay|popup", re.I))
        for modal in modals:
            close_btn = modal.find(class_=re.compile(r"close|dismiss|cancel", re.I))
            close_aria = modal.find(attrs={"aria-label": re.compile(r"close|dismiss", re.I)})
            if not close_btn and not close_aria:
                issues.append({
                    "id": f"ux-h3-modal-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H3"],
                    "element": '<div role="dialog">',
                    "description": "Modal or dialog detected without a clearly visible close/dismiss button. Users feel trapped with no escape route.",
                    "recommendation": 'Add a clearly visible close button: <button aria-label="Close dialog" class="close-btn">&times;</button> and support the Escape key.',
                })
                break

        # Check for destructive actions without confirmation
        destructive = soup.find_all(string=re.compile(r"\bdelete\b|\bremove\b|\bcancel\b|\bdiscard\b", re.I))
        if destructive:
            confirm_pattern = soup.find(attrs={"data-confirm": True}) or soup.find(onclick=re.compile(r"confirm", re.I))
            if not confirm_pattern:
                issues.append({
                    "id": f"ux-h3-confirm-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H3"],
                    "element": '<button>Delete/Remove</button>',
                    "description": "Destructive action (Delete/Remove) found with no confirmation dialog pattern detected. Users may accidentally trigger irreversible actions.",
                    "recommendation": "Add a confirmation step for destructive actions: show a modal asking 'Are you sure?' before executing delete/remove operations.",
                })
        return issues

    # ── H4: Consistency and Standards ─────────────────────────────────────────
    def _check_consistency(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        h1_tags = soup.find_all("h1")
        if len(h1_tags) > 1:
            issues.append({
                "id": f"ux-h4-multih1-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "heuristic": self.HEURISTICS["H4"],
                "element": f"<h1> × {len(h1_tags)}",
                "description": f"Page has {len(h1_tags)} H1 headings. Standard convention is one H1 per page representing the main topic.",
                "recommendation": "Use exactly one <h1> per page. Demote secondary titles to <h2> or use a visually styled <p> element.",
            })

        # Multiple nav elements without distinction
        nav_elements = soup.find_all("nav")
        unlabeled_navs = [nav for nav in nav_elements if not nav.get("aria-label") and not nav.get("aria-labelledby")]
        if len(unlabeled_navs) > 1:
            issues.append({
                "id": f"ux-h4-nav-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H4"],
                "element": f"<nav> × {len(unlabeled_navs)}",
                "description": f"Page has {len(unlabeled_navs)} unlabeled <nav> elements. Users and screen readers cannot distinguish between primary, secondary, and footer navigation.",
                "recommendation": 'Add aria-label to each nav element: <nav aria-label="Primary navigation">, <nav aria-label="Footer links">',
            })

        # Mixed CTA styles (both <a> and <button> used for primary actions)
        btns = [b.get_text(strip=True).lower() for b in soup.find_all("button")]
        links_as_ctas = [a.get_text(strip=True).lower() for a in soup.find_all("a") if a.get("class") and "btn" in " ".join(a.get("class", []))]
        if btns and links_as_ctas:
            issues.append({
                "id": f"ux-h4-cta-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H4"],
                "element": "<button> and <a class='btn'>",
                "description": "Page mixes <button> elements and <a> links styled as buttons for primary CTAs. This creates inconsistent interaction patterns.",
                "recommendation": "Use <button> for actions (submitting, triggering behavior) and <a href> for navigation. Avoid styling <a> tags as buttons for non-navigation actions.",
            })
        return issues

    # ── H5: Error Prevention ──────────────────────────────────────────────────
    def _check_error_prevention(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Password fields without confirmation
        password_fields = soup.find_all("input", attrs={"type": "password"})
        if len(password_fields) == 1:
            form = password_fields[0].find_parent("form")
            if form and any(kw in (form.get_text("", strip=True).lower()) for kw in ("register", "sign up", "create account", "new password", "reset")):
                issues.append({
                    "id": f"ux-h5-pwd-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H5"],
                    "element": '<input type="password">',
                    "description": "Registration or password reset form has only one password field. Users cannot verify their password before submitting.",
                    "recommendation": 'Add a "Confirm Password" field and validate that both values match before enabling form submission.',
                })

        # Forms without input constraints
        for form in soup.find_all("form"):
            text_inputs = form.find_all("input", attrs={"type": ["text", "email", "tel", "url"]})
            unconstrained = [inp for inp in text_inputs if not inp.get("pattern") and not inp.get("minlength") and not inp.get("maxlength")]
            if len(unconstrained) >= 2:
                issues.append({
                    "id": f"ux-h5-constraint-{uuid.uuid4().hex[:6]}",
                    "severity": "Minor",
                    "heuristic": self.HEURISTICS["H5"],
                    "element": "<form>",
                    "description": "Form has multiple text inputs without input constraints (pattern, minlength, or maxlength). Users may submit invalid data without guidance.",
                    "recommendation": "Add input constraints: <input type=\"email\" pattern=\"[^@]+@[^@]+\"> and use the minlength/maxlength attributes to define valid input ranges.",
                })
                break
        return issues

    # ── H6: Recognition Rather Than Recall ────────────────────────────────────
    def _check_recognition_over_recall(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Icon-only buttons
        for btn in soup.find_all("button"):
            text = btn.get_text(strip=True)
            aria_label = btn.get("aria-label") or btn.get("title")
            has_icon = bool(btn.find(["svg", "i", "img"]))
            if has_icon and not text and not aria_label:
                issues.append({
                    "id": f"ux-h6-icon-btn-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H6"],
                    "element": str(btn)[:60],
                    "description": "Icon-only button detected with no text label or tooltip. Users must recall the meaning of the icon from memory.",
                    "recommendation": 'Add a visible label or tooltip: <button aria-label="Add to cart"><svg>...</svg> Add to Cart</button>',
                })
                break

        # Inputs without placeholder or visible label hint
        for inp in soup.find_all("input", attrs={"type": ["text", "email", "search"]}):
            has_label = bool(inp.get("aria-label") or inp.get("placeholder") or inp.get("title"))
            inp_id = inp.get("id")
            has_for_label = bool(inp_id and soup.find("label", attrs={"for": inp_id}))
            if not has_label and not has_for_label:
                issues.append({
                    "id": f"ux-h6-input-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H6"],
                    "element": f'<input type="{inp.get("type","text")}">',
                    "description": "Text input has no visible label, placeholder, or tooltip. Users must recall what information is expected from context alone.",
                    "recommendation": "Add a label and/or placeholder text: <input type=\"text\" placeholder=\"Enter your email address\" aria-label=\"Email\">",
                })
                break
        return issues

    # ── H7: Flexibility and Efficiency of Use ─────────────────────────────────
    def _check_efficiency(self, soup: BeautifulSoup, url: str) -> List[Dict]:
        issues = []
        # No search functionality
        search_input = soup.find("input", attrs={"type": "search"})
        search_by_name = soup.find("input", attrs={"name": re.compile(r"search|query|q\b", re.I)})
        search_role = soup.find(attrs={"role": "search"})
        nav_links = len(soup.find_all("nav a"))

        if not search_input and not search_by_name and not search_role and nav_links > 5:
            issues.append({
                "id": f"ux-h7-search-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H7"],
                "element": "<nav>",
                "description": "Site has substantial navigation but no search functionality detected. Expert users prefer to search rather than browse menus.",
                "recommendation": 'Add a search bar in the header: <form role="search"><input type="search" placeholder="Search..." aria-label="Site search"></form>',
            })

        # No breadcrumbs on deep pages
        parsed_path = url.rstrip("/")
        depth = len(parsed_path.split("/")) - 1
        breadcrumb = soup.find(attrs={"aria-label": re.compile(r"breadcrumb", re.I)})
        breadcrumb_nav = soup.find(class_=re.compile(r"breadcrumb", re.I))
        if depth >= 2 and not breadcrumb and not breadcrumb_nav:
            issues.append({
                "id": f"ux-h7-breadcrumb-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H7"],
                "element": "<body>",
                "description": "Deep page (2+ levels) detected without breadcrumb navigation. Users cannot easily understand their location in the site hierarchy.",
                "recommendation": 'Add breadcrumb navigation: <nav aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li>Current Page</li></ol></nav>',
            })
        return issues

    # ── H8: Aesthetic and Minimalist Design ───────────────────────────────────
    def _check_minimalist_design(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Too many CTAs
        cta_pattern = re.compile(r"\b(buy|order|subscribe|sign up|register|get started|try|download|shop)\b", re.I)
        cta_buttons = [btn for btn in soup.find_all(["button", "a"]) if cta_pattern.search(btn.get_text(strip=True))]
        if len(cta_buttons) > 6:
            issues.append({
                "id": f"ux-h8-cta-{uuid.uuid4().hex[:6]}",
                "severity": "Warning",
                "heuristic": self.HEURISTICS["H8"],
                "element": "<body>",
                "description": f"Page has {len(cta_buttons)} call-to-action elements. Too many competing CTAs create decision paralysis and dilute primary conversion goals.",
                "recommendation": "Reduce to 1–2 primary CTAs above the fold. Rank actions by importance: primary (filled button), secondary (outline button), tertiary (text link).",
            })

        # Excessive navigation links
        nav = soup.find("nav")
        if nav:
            nav_links = nav.find_all("a")
            if len(nav_links) > 10:
                issues.append({
                    "id": f"ux-h8-nav-{uuid.uuid4().hex[:6]}",
                    "severity": "Minor",
                    "heuristic": self.HEURISTICS["H8"],
                    "element": f"<nav> ({len(nav_links)} links)",
                    "description": f"Primary navigation has {len(nav_links)} links, exceeding the cognitive load limit of 7±2 items.",
                    "recommendation": "Group navigation items into logical categories. Use dropdown menus or mega-menus to organize secondary pages under fewer top-level items.",
                })

        # Content density check
        paragraphs = soup.find_all("p")
        total_text = " ".join(p.get_text() for p in paragraphs)
        avg_len = len(total_text) / max(1, len(paragraphs))
        if avg_len > 250:
            issues.append({
                "id": f"ux-h8-content-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H8"],
                "element": "<p>",
                "description": "Paragraphs are very long (average >250 characters). Dense text blocks reduce readability and increase cognitive load.",
                "recommendation": "Break long paragraphs into shorter ones (3–5 sentences max). Use bullet points and subheadings to improve scannability.",
            })
        return issues

    # ── H9: Help Recover from Errors ─────────────────────────────────────────
    def _check_error_recovery(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        # Check for 404-like content
        text = soup.get_text(" ", strip=True).lower()
        if "404" in text or "page not found" in text or "not found" in text:
            home_link = soup.find("a", href="/") or soup.find("a", string=re.compile(r"home|back", re.I))
            if not home_link:
                issues.append({
                    "id": f"ux-h9-404-{uuid.uuid4().hex[:6]}",
                    "severity": "Warning",
                    "heuristic": self.HEURISTICS["H9"],
                    "element": "<body>",
                    "description": "Error page (404/not found) detected without a clear path back to valid content. Users are stuck in an error state.",
                    "recommendation": "Add a prominent 'Go to Homepage' button and a search bar to 404 pages, helping users find what they were looking for.",
                })

        # No error messages in forms
        for form in soup.find_all("form"):
            error_elements = form.find_all(class_=re.compile(r"error|invalid|alert|warning", re.I))
            error_aria = form.find_all(attrs={"aria-invalid": True})
            error_role = form.find_all(attrs={"role": "alert"})
            inputs = form.find_all(["input", "select", "textarea"])
            if inputs and not error_elements and not error_aria and not error_role:
                issues.append({
                    "id": f"ux-h9-form-err-{uuid.uuid4().hex[:6]}",
                    "severity": "Minor",
                    "heuristic": self.HEURISTICS["H9"],
                    "element": "<form>",
                    "description": "Form has no error state patterns (error CSS classes, aria-invalid, or role='alert'). Users receive no inline feedback when submitting invalid data.",
                    "recommendation": "Add inline error messages: <span class=\"error\" role=\"alert\">Please enter a valid email address</span> and mark invalid fields with aria-invalid=\"true\".",
                })
                break
        return issues

    # ── H10: Help and Documentation ───────────────────────────────────────────
    def _check_help_documentation(self, soup: BeautifulSoup) -> List[Dict]:
        issues = []
        help_pattern = re.compile(r"\bhelp\b|\bfaq\b|\bsupport\b|\bdocumentation\b|\bguide\b", re.I)
        footer = soup.find("footer")
        nav = soup.find("nav")
        help_link = soup.find("a", string=help_pattern)
        help_link_aria = soup.find("a", attrs={"aria-label": help_pattern})

        page_text = soup.get_text().lower()
        is_complex = any(kw in page_text for kw in ["checkout", "register", "configure", "settings", "payment", "subscription"])

        if is_complex and not help_link and not help_link_aria:
            issues.append({
                "id": f"ux-h10-help-{uuid.uuid4().hex[:6]}",
                "severity": "Minor",
                "heuristic": self.HEURISTICS["H10"],
                "element": "<body>",
                "description": "Complex interaction page (checkout/registration/configuration) detected without any help or FAQ link. Users may abandon when confused.",
                "recommendation": "Add a help link, tooltip, or chat widget near complex interactions. A FAQ section or '?' icon with contextual help can reduce form abandonment.",
            })
        return issues
