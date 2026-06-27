"""
Improvement Agent — Generates real Before/After HTML and CSS code for the most
common WCAG and Nielsen issue types found on each page.
Extracts the actual problematic HTML snippet and generates the fixed version.
"""
import re
import logging
from typing import Dict, Any, List
from bs4 import BeautifulSoup

logger = logging.getLogger("uxverse.improvement_agent")


class ImprovementAgent:
    """Generates before/after HTML and CSS pairs from real DOM issues."""

    def generate(self, html: str, ux_issues: List[Dict], a11y_issues: List[Dict]) -> Dict[str, Any]:
        """
        Select the most severe issue and generate a real before/after comparison.
        Falls back to a template-based example if no specific snippet can be extracted.
        """
        all_issues = sorted(
            a11y_issues + ux_issues,
            key=lambda x: {"Critical": 0, "Warning": 1, "Minor": 2}.get(x.get("severity","Minor"), 2)
        )

        soup = BeautifulSoup(html, "html.parser") if html else None

        for issue in all_issues:
            issue_id = issue.get("id", "")
            result = None

            if "1.1.1" in issue_id or "wcag-1.1.1" in issue_id:
                result = self._fix_missing_alt(soup)
            elif "1.3.1" in issue_id or "wcag-1.3.1" in issue_id:
                result = self._fix_missing_label(soup)
            elif "2.4.1" in issue_id or "wcag-2.4.1" in issue_id:
                result = self._fix_skip_link(soup)
            elif "2.4.7" in issue_id or "wcag-2.4.7" in issue_id:
                result = self._fix_focus_indicator()
            elif "3.1.1" in issue_id or "wcag-3.1.1" in issue_id:
                result = self._fix_lang_attr(soup)
            elif "4.1.2-btn" in issue_id:
                result = self._fix_button_label(soup)
            elif "h4-multih1" in issue_id or "ux-h4-multih1" in issue_id:
                result = self._fix_multiple_h1(soup)
            elif "h8-cta" in issue_id or "ux-h8-cta" in issue_id:
                result = self._fix_cta_hierarchy(soup)
            elif "h7-search" in issue_id or "ux-h7-search" in issue_id:
                result = self._fix_add_search()
            elif "h5-pwd" in issue_id or "ux-h5-pwd" in issue_id:
                result = self._fix_password_confirm(soup)

            if result:
                return result

        # Generic improvement based on worst severity
        if all_issues:
            return self._generic_improvement(all_issues[0])

        return self._default_improvement()

    # ── Fix: Missing Alt Text ─────────────────────────────────────────────────
    def _fix_missing_alt(self, soup) -> Dict:
        if soup:
            img = soup.find("img", alt=False)
            if img:
                before_html = str(img)[:200]
                after_html = before_html.replace("<img ", '<img alt="Descriptive text about the image content" ')
                if "alt=" not in after_html:
                    after_html = before_html.rstrip(">") + ' alt="Descriptive text about the image content">'
                return {
                    "before": {
                        "html": before_html,
                        "css": "/* No accessible alt text */\nimg { display: block; }",
                        "visual": "The image renders visually but is completely invisible to screen readers. Users relying on assistive technology receive no information about this image.",
                    },
                    "after": {
                        "html": after_html,
                        "css": "/* Alt text makes image accessible */\nimg { display: block; }\nimg:focus { outline: 2px solid #3b82f6; }",
                        "visual": "The image now has descriptive alt text. Screen readers will announce the image content, making it accessible to visually impaired users.",
                    },
                }
        return self._template_fix_alt()

    def _template_fix_alt(self) -> Dict:
        return {
            "before": {
                "html": '<!-- WCAG 1.1.1 Violation -->\n<img src="/images/hero-banner.jpg" class="hero-image">',
                "css": ".hero-image {\n  width: 100%;\n  height: 400px;\n  object-fit: cover;\n}",
                "visual": "Image renders visually but screen readers skip it entirely, providing zero context to visually impaired users.",
            },
            "after": {
                "html": '<!-- WCAG 1.1.1 Compliant -->\n<img\n  src="/images/hero-banner.jpg"\n  alt="Team of professionals collaborating on a digital project in a modern office"\n  class="hero-image"\n>',
                "css": ".hero-image {\n  width: 100%;\n  height: 400px;\n  object-fit: cover;\n}\n.hero-image:focus {\n  outline: 3px solid #3b82f6;\n  outline-offset: 2px;\n}",
                "visual": "Image is now fully accessible. Screen readers announce: 'Team of professionals collaborating on a digital project in a modern office'. WCAG 1.1.1 Level A compliant.",
            },
        }

    # ── Fix: Missing Form Label ───────────────────────────────────────────────
    def _fix_missing_label(self, soup) -> Dict:
        if soup:
            for inp in soup.find_all("input"):
                if inp.get("type", "text") in ("hidden", "submit", "button"):
                    continue
                inp_id = inp.get("id")
                if not inp_id:
                    continue
                parent_label = inp.find_parent("label")
                label_for = soup.find("label", attrs={"for": inp_id})
                if not parent_label and not label_for:
                    inp_type = inp.get("type", "text")
                    inp_name = inp.get("name") or inp.get("placeholder") or "Field"
                    before_html = str(inp)[:200]
                    after_html = (
                        f'<div class="form-group">\n'
                        f'  <label for="{inp_id}">{inp_name.capitalize()}</label>\n'
                        f'  {before_html}\n'
                        f'</div>'
                    )
                    return {
                        "before": {
                            "html": before_html,
                            "css": "input { padding: 8px; border: 1px solid #ccc; }",
                            "visual": f"The {inp_type} input field has no associated label. Screen readers announce it as 'unlabeled {inp_type} field'.",
                        },
                        "after": {
                            "html": after_html,
                            "css": ".form-group { display: flex; flex-direction: column; gap: 4px; }\nlabel { font-size: 14px; font-weight: 600; color: #374151; }\ninput { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; }\ninput:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }",
                            "visual": "Input is now labeled. Screen readers announce 'Email, edit text field'. WCAG 1.3.1 Level A compliant.",
                        },
                    }
        return {
            "before": {
                "html": '<!-- WCAG 1.3.1 Violation -->\n<input type="email" id="email" placeholder="Enter email">',
                "css": "input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; }",
                "visual": "Email input has no label. Screen readers skip to the placeholder text which disappears on typing, leaving users confused.",
            },
            "after": {
                "html": '<!-- WCAG 1.3.1 Compliant -->\n<div class="form-group">\n  <label for="email">Email Address</label>\n  <input\n    type="email"\n    id="email"\n    name="email"\n    placeholder="you@example.com"\n    autocomplete="email"\n    required\n    aria-describedby="email-hint"\n  >\n  <span id="email-hint" class="hint">We\'ll never share your email.</span>\n</div>',
                "css": ".form-group { display: flex; flex-direction: column; gap: 6px; }\nlabel { font-weight: 600; font-size: 14px; color: #111827; }\ninput { padding: 12px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 15px; }\ninput:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }\n.hint { font-size: 12px; color: #6b7280; }",
                "visual": "Email field now has a persistent label 'Email Address', a helpful hint, autocomplete support, and a visible focus ring. WCAG 1.3.1 + 1.3.5 compliant.",
            },
        }

    # ── Fix: Skip Navigation Link ─────────────────────────────────────────────
    def _fix_skip_link(self, soup) -> Dict:
        return {
            "before": {
                "html": '<!-- WCAG 2.4.1 Violation -->\n<header>\n  <nav>\n    <a href="/">Home</a>\n    <a href="/products">Products</a>\n    <a href="/about">About</a>\n    <a href="/blog">Blog</a>\n    <a href="/contact">Contact</a>\n  </nav>\n</header>\n<main id="main-content">\n  <!-- Page content -->\n</main>',
                "css": "/* No skip link - keyboard users must tab through all 5 nav items on every page */\nnav a { margin-right: 16px; color: #374151; }",
                "visual": "Keyboard users must press Tab 5+ times through navigation links before reaching the main content on every page load. This is exhausting and violates WCAG 2.4.1.",
            },
            "after": {
                "html": '<!-- WCAG 2.4.1 Compliant -->\n<a href="#main-content" class="skip-link">Skip to main content</a>\n<header>\n  <nav aria-label="Primary navigation">\n    <a href="/">Home</a>\n    <a href="/products">Products</a>\n    <a href="/about">About</a>\n    <a href="/blog">Blog</a>\n    <a href="/contact">Contact</a>\n  </nav>\n</header>\n<main id="main-content" tabindex="-1">\n  <!-- Page content -->\n</main>',
                "css": ".skip-link {\n  position: absolute;\n  top: -100%;\n  left: 0;\n  background: #1d4ed8;\n  color: white;\n  padding: 12px 24px;\n  font-weight: 600;\n  font-size: 14px;\n  text-decoration: none;\n  border-radius: 0 0 8px 0;\n  z-index: 9999;\n  transition: top 0.2s ease;\n}\n.skip-link:focus {\n  top: 0;\n}",
                "visual": "Skip link appears on keyboard focus, allowing users to jump directly to main content with one Tab press. WCAG 2.4.1 Level A compliant.",
            },
        }

    # ── Fix: Focus Indicator ─────────────────────────────────────────────────
    def _fix_focus_indicator(self) -> Dict:
        return {
            "before": {
                "html": '<button class="btn-primary">Get Started</button>',
                "css": "/* WCAG 2.4.7 Violation */\n* {\n  outline: none; /* Removes ALL focus indicators */\n}\n.btn-primary {\n  background: #3b82f6;\n  color: white;\n  padding: 12px 24px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n}",
                "visual": "When keyboard users focus this button, there is no visible indicator. They cannot tell which element is active, making keyboard navigation impossible.",
            },
            "after": {
                "html": '<button class="btn-primary">Get Started</button>',
                "css": "/* WCAG 2.4.7 Compliant */\n/* Remove outline only for mouse users */\n*:focus:not(:focus-visible) {\n  outline: none;\n}\n/* Visible focus for keyboard users */\n*:focus-visible {\n  outline: 3px solid #3b82f6;\n  outline-offset: 3px;\n  border-radius: 4px;\n}\n.btn-primary {\n  background: #3b82f6;\n  color: white;\n  padding: 12px 24px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.btn-primary:hover {\n  background: #2563eb;\n}",
                "visual": "Keyboard users see a clear blue focus ring around the button when it is focused. Mouse users see no outline. WCAG 2.4.7 Level AA compliant.",
            },
        }

    # ── Fix: HTML lang attribute ──────────────────────────────────────────────
    def _fix_lang_attr(self, soup) -> Dict:
        html_tag = "<html>" if not soup else str(soup.find("html"))[:60] if soup.find("html") else "<html>"
        return {
            "before": {
                "html": f'<!-- WCAG 3.1.1 Violation -->\n{html_tag}\n  <head>...</head>\n  <body>...</body>\n</html>',
                "css": "/* No CSS change needed */",
                "visual": "Screen readers cannot detect the page language. They default to the system language setting, which may mispronounce words if users speak a different language.",
            },
            "after": {
                "html": '<!-- WCAG 3.1.1 Compliant -->\n<html lang="en">\n  <head>...</head>\n  <body>...</body>\n</html>\n\n<!-- For multilingual sections, use lang inline: -->\n<p lang="fr">Bonjour le monde</p>',
                "css": "/* No CSS change needed - this is an HTML attribute fix */",
                "visual": "Screen readers detect lang='en' and use the correct English pronunciation engine. WCAG 3.1.1 Level A compliant. Takes 2 seconds to fix.",
            },
        }

    # ── Fix: Button Label ─────────────────────────────────────────────────────
    def _fix_button_label(self, soup) -> Dict:
        if soup:
            for btn in soup.find_all("button"):
                if not btn.get_text(strip=True) and not btn.get("aria-label"):
                    before = str(btn)[:150]
                    inner_html = btn.decode_contents()
                    after = f'<button aria-label="Close" title="Close">\n  {inner_html}\n</button>'
                    return {
                        "before": {
                            "html": before,
                            "css": "button { background: none; border: none; cursor: pointer; }",
                            "visual": "Screen reader announces 'button' with no context. Users don't know what the button does.",
                        },
                        "after": {
                            "html": after,
                            "css": "button { background: none; border: none; cursor: pointer; }\nbutton:focus-visible { outline: 3px solid #3b82f6; outline-offset: 2px; border-radius: 4px; }",
                            "visual": "Screen reader announces 'Close, button'. Users know exactly what the button does. WCAG 4.1.2 Level A compliant.",
                        },
                    }
        return self._default_improvement()

    # ── Fix: Multiple H1 ─────────────────────────────────────────────────────
    def _fix_multiple_h1(self, soup) -> Dict:
        if soup:
            h1s = soup.find_all("h1")
            if len(h1s) >= 2:
                before_html = "\n".join(str(h) for h in h1s[:3])
                after_html = str(h1s[0]) + "\n" + "\n".join(
                    str(h).replace("<h1", "<h2").replace("</h1>", "</h2>") for h in h1s[1:3]
                )
                return {
                    "before": {
                        "html": f"<!-- {len(h1s)} H1 tags found (Nielsen H4 Violation) -->\n{before_html}",
                        "css": "h1 { font-size: 2rem; font-weight: 800; }",
                        "visual": f"Page has {len(h1s)} H1 tags. Screen readers and SEO bots cannot determine the primary topic. Document outline is broken.",
                    },
                    "after": {
                        "html": f"<!-- Fixed: One H1, rest demoted to H2 -->\n{after_html}",
                        "css": "h1 { font-size: 2rem; font-weight: 800; }\nh2 { font-size: 1.5rem; font-weight: 700; }",
                        "visual": "Page now has exactly one H1 defining the primary topic. Secondary headings are H2. Document outline is clean. Nielsen H4 + WCAG 1.3.6 compliant.",
                    },
                }
        return self._default_improvement()

    # ── Fix: CTA Hierarchy ────────────────────────────────────────────────────
    def _fix_cta_hierarchy(self, soup) -> Dict:
        return {
            "before": {
                "html": '<!-- Too many CTAs (Nielsen H8 Violation) -->\n<section class="hero">\n  <button class="btn-primary">Buy Now</button>\n  <button class="btn-primary">Subscribe</button>\n  <button class="btn-primary">Learn More</button>\n  <button class="btn-primary">Watch Demo</button>\n  <button class="btn-primary">Download Free</button>\n  <button class="btn-primary">Get Quote</button>\n</section>',
                "css": ".btn-primary { background: #3b82f6; color: white; padding: 12px 20px; border: none; border-radius: 6px; margin: 4px; cursor: pointer; }",
                "visual": "6 equally-weighted CTAs compete for attention. Users experience decision paralysis. Average conversion rate drops 20-40% with 5+ competing CTAs.",
            },
            "after": {
                "html": '<!-- Clear CTA hierarchy (Nielsen H8 Compliant) -->\n<section class="hero">\n  <!-- ONE primary action -->\n  <button class="btn-primary">Get Started Free</button>\n  <!-- ONE secondary action -->\n  <button class="btn-secondary">Watch Demo</button>\n  <!-- Tertiary actions in a less prominent location -->\n  <div class="secondary-actions">\n    <a href="/pricing">See Pricing</a> · <a href="/contact">Contact Sales</a>\n  </div>\n</section>',
                "css": ".btn-primary { background: #1d4ed8; color: white; padding: 14px 28px; border: none; border-radius: 8px; font-weight: 700; font-size: 16px; cursor: pointer; }\n.btn-secondary { background: transparent; color: #1d4ed8; padding: 13px 27px; border: 2px solid #1d4ed8; border-radius: 8px; font-weight: 600; cursor: pointer; margin-left: 12px; }\n.secondary-actions { margin-top: 16px; color: #6b7280; font-size: 14px; }",
                "visual": "Clear visual hierarchy: one dominant primary CTA drives the main conversion action. Secondary CTA uses outline style. Tertiary actions are text links. Conversion typically improves 15-25%.",
            },
        }

    # ── Fix: Add Search ───────────────────────────────────────────────────────
    def _fix_add_search(self) -> Dict:
        return {
            "before": {
                "html": '<!-- No search (Nielsen H7 Violation) -->\n<nav>\n  <a href="/">Home</a>\n  <a href="/products">Products</a>\n  <a href="/about">About</a>\n  <a href="/blog">Blog</a>\n  <a href="/contact">Contact</a>\n  <a href="/faq">FAQ</a>\n  <a href="/pricing">Pricing</a>\n</nav>',
                "css": "nav { display: flex; gap: 24px; align-items: center; }",
                "visual": "Users can only browse by clicking through menu items. Power users and users looking for specific content must scan all pages manually.",
            },
            "after": {
                "html": '<!-- With search (Nielsen H7 Compliant) -->\n<nav>\n  <a href="/">Home</a>\n  <a href="/products">Products</a>\n  <a href="/about">About</a>\n  <a href="/blog">Blog</a>\n  <a href="/contact">Contact</a>\n\n  <!-- Search bar -->\n  <form role="search" class="search-form" action="/search">\n    <label for="site-search" class="sr-only">Search site</label>\n    <input\n      type="search"\n      id="site-search"\n      name="q"\n      placeholder="Search..."\n      aria-label="Search site"\n    >\n    <button type="submit" aria-label="Submit search">\n      <svg><!-- search icon --></svg>\n    </button>\n  </form>\n</nav>',
                "css": "nav { display: flex; gap: 24px; align-items: center; }\n.search-form { display: flex; align-items: center; border: 1.5px solid #d1d5db; border-radius: 8px; overflow: hidden; }\n.search-form input { border: none; padding: 8px 12px; outline: none; font-size: 14px; min-width: 180px; }\n.search-form button { background: none; border: none; padding: 8px 10px; cursor: pointer; color: #6b7280; }\n.search-form:focus-within { border-color: #3b82f6; }\n.sr-only { position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0); }",
                "visual": "Users can now type to find any page instantly. Keyboard shortcut (/) can trigger focus. Keyboard + screen reader accessible. Nielsen H7 fully satisfied.",
            },
        }

    # ── Fix: Password Confirm ─────────────────────────────────────────────────
    def _fix_password_confirm(self, soup) -> Dict:
        return {
            "before": {
                "html": '<!-- Nielsen H5 Violation: No password confirmation -->\n<form>\n  <label for="pwd">Password</label>\n  <input type="password" id="pwd" name="password">\n  <button type="submit">Create Account</button>\n</form>',
                "css": "input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }\nbutton { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px; }",
                "visual": "Users can submit a mistyped password without any confirmation. Resetting a forgotten password is the only recovery path.",
            },
            "after": {
                "html": '<!-- Nielsen H5 Compliant: Password confirmation -->\n<form>\n  <div class="form-group">\n    <label for="pwd">Password</label>\n    <input\n      type="password" id="pwd" name="password"\n      minlength="8"\n      aria-describedby="pwd-requirements"\n    >\n    <span id="pwd-requirements" class="hint">\n      Minimum 8 characters, include a number and a symbol.\n    </span>\n  </div>\n  <div class="form-group">\n    <label for="pwd-confirm">Confirm Password</label>\n    <input\n      type="password" id="pwd-confirm" name="password_confirm"\n      aria-describedby="pwd-match-msg"\n    >\n    <span id="pwd-match-msg" class="hint" role="status"></span>\n  </div>\n  <button type="submit" id="submit-btn" disabled>Create Account</button>\n</form>',
                "css": ".form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }\nlabel { font-weight: 600; font-size: 14px; }\ninput { padding: 12px; border: 1.5px solid #d1d5db; border-radius: 8px; }\ninput.valid { border-color: #10b981; }\ninput.invalid { border-color: #ef4444; }\n.hint { font-size: 12px; color: #6b7280; }\nbutton:disabled { opacity: 0.5; cursor: not-allowed; }",
                "visual": "Form now requires matching password confirmation. Requirements are shown upfront. Submit button is disabled until both fields match. Error prevention at its best. Nielsen H5 compliant.",
            },
        }

    # ── Generic / Default ─────────────────────────────────────────────────────
    def _generic_improvement(self, issue: Dict) -> Dict:
        severity = issue.get("severity", "Warning")
        standard = issue.get("standard") or issue.get("heuristic", "")
        description = issue.get("description", "")
        recommendation = issue.get("recommendation", "")
        element = issue.get("element", "<element>")

        return {
            "before": {
                "html": f"<!-- Issue: {standard} -->\n{element}\n<!-- Problem: {description[:120]} -->",
                "css": "/* Current state - see issue description for details */",
                "visual": description,
            },
            "after": {
                "html": f"<!-- Fixed: {standard} -->\n{element}\n<!-- Apply recommendation below -->\n<!-- {recommendation[:200]} -->",
                "css": "/* Apply the recommended changes per WCAG/Nielsen guidelines */\n:focus-visible { outline: 3px solid #3b82f6; outline-offset: 2px; }",
                "visual": f"After applying this fix: {recommendation}",
            },
        }

    def _default_improvement(self) -> Dict:
        return {
            "before": {
                "html": "<!-- No specific HTML snippet extracted for this page -->\n<!-- Run a full audit to see page-specific improvements -->",
                "css": "/* Audit this page to find specific CSS improvements */",
                "visual": "Run the full audit to see page-specific before/after comparisons.",
            },
            "after": {
                "html": "<!-- General best practice template -->\n<main id='main-content'>\n  <h1>Clear Page Title</h1>\n  <!-- Single primary CTA -->\n  <button class='btn-primary' aria-label='Start your free trial'>Start Free Trial</button>\n</main>",
                "css": "/* Accessible focus styles */\n:focus-visible {\n  outline: 3px solid #3b82f6;\n  outline-offset: 2px;\n}\n/* Skip link */\n.skip-link {\n  position: absolute;\n  top: -100%;\n}\n.skip-link:focus {\n  top: 0;\n}",
                "visual": "Apply these improvements for better accessibility and UX.",
            },
        }
