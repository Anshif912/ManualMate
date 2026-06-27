import random
from typing import List, Dict, Any
import logging

logger = logging.getLogger("uxverse.auditor")

class UXAuditor:
    def __init__(self):
        pass

    def run_accessibility_audit(self, html_content: str, path: str) -> List[Dict[str, Any]]:
        """
        Runs rules simulating an axe-core WCAG 2.2 audit.
        Combines DOM inspection (e.g. searching for missing alt attributes) 
        and path-specific accessibility issues.
        """
        issues = []
        
        # Rule 1: Images without alt text
        if "img" in html_content and 'alt=' not in html_content:
            issues.append({
                "id": "wcag-img-alt",
                "standard": "WCAG 2.2 A - 1.1.1 Non-text Content",
                "severity": "Critical",
                "element": "<img>",
                "description": "Image element is missing an alt attribute, making it invisible to screen readers.",
                "recommendation": "Add a descriptive alt attribute (e.g., alt='Company Logo') or an empty alt='' if decorative."
            })

        # Rule 2: Color Contrast (Simulated or path specific)
        if path == "/checkout" or path == "/products" or path == "/":
            issues.append({
                "id": "wcag-contrast",
                "standard": "WCAG 2.2 AA - 1.4.3 Contrast (Minimum)",
                "severity": "Warning",
                "element": "button.btn-primary, .text-muted",
                "description": "Text color contrast ratio is 3.1:1, which is below the required minimum of 4.5:1.",
                "recommendation": "Darken the button text color or lighten its background to increase contrast to at least 4.5:1."
            })

        # Rule 3: Form inputs missing labels
        if "input" in html_content and 'label' not in html_content:
            issues.append({
                "id": "wcag-input-label",
                "standard": "WCAG 2.2 A - 1.3.1 Info and Relationships",
                "severity": "Critical",
                "element": "<input>",
                "description": "Form input field does not have a corresponding <label> element or aria-label attribute.",
                "recommendation": "Associate each input with a <label> using the 'for' attribute, or add 'aria-label'."
            })

        # Rule 4: Keyboard navigation focus outline
        issues.append({
            "id": "wcag-keyboard-focus",
            "standard": "WCAG 2.2 AA - 2.4.7 Focus Visible",
            "severity": "Warning",
            "element": "a:focus, button:focus",
            "description": "Interactive elements have outline: none or outline: 0 in CSS, hiding keyboard focus indicator.",
            "recommendation": "Ensure focus rings are visible on keyboard tab focus by using standard outline rules (e.g. outline: 2px solid #3b82f6)."
        })

        # Path specific accessibility issues
        if path == "/checkout":
            issues.append({
                "id": "wcag-autocomplete",
                "standard": "WCAG 2.2 AA - 1.3.5 Identify Input Purpose",
                "severity": "Minor",
                "element": "input#cc-number",
                "description": "Credit card and address input fields are missing autocomplete attributes.",
                "recommendation": "Add autocomplete='cc-number' and autocomplete='shipping street-address' to help users autofill fields."
            })
        elif path == "/login":
            issues.append({
                "id": "wcag-login-error",
                "standard": "WCAG 2.2 A - 3.3.1 Error Identification",
                "severity": "Critical",
                "element": ".error-container",
                "description": "Login error notifications are not announced automatically by screen readers.",
                "recommendation": "Add role='alert' or aria-live='assertive' to the error message container."
            })

        return issues

    def run_ux_audit(self, html_content: str, path: str) -> List[Dict[str, Any]]:
        """
        Applies Nielsen's 10 Usability Heuristics to evaluate the page UX.
        """
        issues = []
        
        # Let's map issues to Nielsen Heuristics
        heuristics_map = {
            1: "Visibility of system status",
            2: "Match between system and the real world",
            3: "User control and freedom",
            4: "Consistency and standards",
            5: "Error prevention",
            6: "Recognition rather than recall",
            7: "Flexibility and efficiency of use",
            8: "Aesthetic and minimalist design",
            9: "Help users recognize, diagnose, and recover from errors",
            10: "Help and documentation"
        }

        # Path specific UX issues
        if path == "/":
            issues.append({
                "id": "ux-hero-cta",
                "heuristic": f"Heuristic #8: {heuristics_map[8]}",
                "severity": "Warning",
                "description": "The primary Call to Action (CTA) button is surrounded by too much visual clutter in the hero section.",
                "recommendation": "Increase spacing around the CTA button, reduce secondary text elements, and use contrasting background styles."
            })
            issues.append({
                "id": "ux-menu-overload",
                "heuristic": f"Heuristic #7: {heuristics_map[7]}",
                "severity": "Minor",
                "description": "Mega-menu contains 24 categories without collapse features, overloading novice users.",
                "recommendation": "Group navigation items into 5-7 core sections and implement a progressive disclosure menu."
            })
        elif path == "/checkout":
            issues.append({
                "id": "ux-checkout-freedom",
                "heuristic": f"Heuristic #3: {heuristics_map[3]}",
                "severity": "Critical",
                "description": "No guest checkout option is available, forcing users to register before purchase.",
                "recommendation": "Introduce a 'Checkout as Guest' path to prevent cart abandonment and user frustration."
            })
            issues.append({
                "id": "ux-checkout-steps",
                "heuristic": f"Heuristic #1: {heuristics_map[1]}",
                "severity": "Warning",
                "description": "The checkout progress bar does not clearly state which steps are completed, current, or remaining.",
                "recommendation": "Use active highlight colors and text status indicators (e.g., 'Step 2 of 4: Shipping') to represent current state."
            })
        elif path == "/products":
            issues.append({
                "id": "ux-product-filters",
                "heuristic": f"Heuristic #5: {heuristics_map[5]}",
                "severity": "Warning",
                "description": "Applying filters automatically reloads the entire page, clearing previous scroll history.",
                "recommendation": "Implement AJAX-based product list updates and maintain filter parameters in URL search query states."
            })
        elif path == "/login":
            issues.append({
                "id": "ux-login-capslock",
                "heuristic": f"Heuristic #9: {heuristics_map[9]}",
                "severity": "Minor",
                "description": "Caps Lock indicator is missing from the password input, leading to error confusion.",
                "recommendation": "Detect when Caps Lock is active and render a small absolute-positioned warning banner inside the password field."
            })
        else:
            # Default generic issues
            issues.append({
                "id": f"ux-generic-aesthetic-{path.replace('/', '')}",
                "heuristic": f"Heuristic #8: {heuristics_map[8]}",
                "severity": "Minor",
                "description": "Page typography uses multiple font weights and line heights inconsistently.",
                "recommendation": "Apply a standardized typographic scale (e.g., body size of 16px with line-height of 1.5)."
            })

        return issues

    def simulate_personas(self, path: str, ux_score: int, a11y_score: int) -> List[Dict[str, Any]]:
        """
        Simulates the response of 5 default user personas for a page.
        """
        personas = [
            {
                "name": "First-time Visitor",
                "role": "Novice User",
                "score": max(20, min(100, ux_score - 5)),
                "satisfaction": "High" if ux_score > 80 else ("Medium" if ux_score > 60 else "Low"),
                "friction": "Struggles with discovering navigation categories" if path == "/" else "Confused by checkout account creation prompts.",
                "recommendation": "Provide tooltips, interactive onboarding tours, or a prominent search input."
            },
            {
                "name": "Elderly User",
                "role": "Assistive-dependent User",
                "score": max(20, min(100, a11y_score - 15)),
                "satisfaction": "High" if a11y_score > 85 else ("Medium" if a11y_score > 70 else "Low"),
                "friction": "Small font scales and lack of clear click target spacing make interaction difficult.",
                "recommendation": "Increase line height, use minimum target sizes of 48x48px, and enable layout-responsive font resizing."
            },
            {
                "name": "Power User",
                "role": "Expert User",
                "score": max(20, min(100, ux_score + 10)),
                "satisfaction": "High" if ux_score > 70 else "Medium",
                "friction": "Annoyed by slow page transitions and lack of hotkey shortcuts (e.g., Esc to close modal).",
                "recommendation": "Introduce keyboard navigation bindings, autocomplete fields, and pagination selectors."
            },
            {
                "name": "Visually Impaired User",
                "role": "Screen Reader User",
                "score": max(15, min(100, a11y_score - 20)),
                "satisfaction": "High" if a11y_score > 90 else ("Medium" if a11y_score > 75 else "Low"),
                "friction": "Stumbles upon unlabeled form controls and image links missing alt tags." if path == "/checkout" else "Cannot parse structure due to heading hierarchical jumps.",
                "recommendation": "Enforce strict semantic order (h1, h2, h3) and supply detailed descriptive labels to all dynamic icons."
            },
            {
                "name": "Frequent Customer",
                "role": "Loyal User",
                "score": max(20, min(100, ux_score + 5)),
                "satisfaction": "High" if ux_score > 75 else "Medium",
                "friction": "Forced to re-enter billing and shipping details on repeated visits.",
                "recommendation": "Integrate secure client-side storage profiles or automatic profile data recall."
            }
        ]
        return personas

    def calculate_business_impact(self, ux_issues: list, a11y_issues: list) -> Dict[str, Any]:
        """
        Aggregates business metrics influenced by identified issues.
        """
        crit_count = sum(1 for i in ux_issues + a11y_issues if i["severity"] == "Critical")
        warn_count = sum(1 for i in ux_issues + a11y_issues if i["severity"] == "Warning")
        
        conversion_lift = 0.5 + (crit_count * 1.5) + (warn_count * 0.5)
        revenue_impact = conversion_lift * 850.0  # Simulated currency lift multiplier
        csat_impact = max(5, min(30, (crit_count * 5) + (warn_count * 2)))

        return {
            "conversion_lift_percentage": round(conversion_lift, 2),
            "estimated_monthly_revenue_lift": round(revenue_impact, 2),
            "csat_lift_percentage": round(csat_impact, 1),
            "development_effort": "High" if crit_count > 3 else ("Medium" if crit_count > 0 or warn_count > 2 else "Low")
        }

    def generate_before_after(self, path: str) -> Dict[str, Any]:
        """
        Generates split screen comparisons (Visual layout style classes, HTML structure, CSS changes).
        """
        comparison = {
            "before": {
                "html": "",
                "css": "",
                "visual": ""
            },
            "after": {
                "html": "",
                "css": "",
                "visual": ""
            }
        }
        
        if path == "/checkout":
            comparison["before"]["html"] = "<!-- Before: Rigid registration requirement -->\n<div class=\"checkout-auth-container\">\n  <h2>Please sign in or register to buy</h2>\n  <form id=\"register-form\">\n    <input type=\"email\" placeholder=\"Email\" required />\n    <input type=\"password\" placeholder=\"Password\" required />\n    <button type=\"submit\" class=\"btn-reg\">Register and Continue</button>\n  </form>\n</div>"
            comparison["before"]["css"] = "/* Before Checkout CSS */\n.checkout-auth-container {\n  padding: 20px;\n  background: #fff;\n}\n.btn-reg {\n  background: red;\n  color: #fff;\n  border: none;\n  padding: 10px 15px;\n}"
            comparison["before"]["visual"] = "Registration page with required password setup and bright red, small font buttons."
            
            comparison["after"]["html"] = "<!-- After: Guest checkout options -->\n<div class=\"checkout-auth-container flex gap-6\">\n  <div class=\"auth-box flex-1\">\n    <h2>Existing Customers</h2>\n    <input type=\"email\" placeholder=\"Email\" class=\"input-styled\" />\n    <button class=\"btn-primary\">Sign In</button>\n  </div>\n  <div class=\"guest-box flex-1 border-l pl-6\">\n    <h2>New Customers</h2>\n    <p>Checkout faster without creating an account.</p>\n    <button class=\"btn-secondary\" aria-label=\"Checkout as Guest\">Proceed as Guest</button>\n  </div>\n</div>"
            comparison["after"]["css"] = "/* After Checkout CSS */\n.checkout-auth-container {\n  display: flex;\n  gap: 24px;\n  padding: 32px;\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(12px);\n  border-radius: 12px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}\n.btn-primary, .btn-secondary {\n  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);\n  color: #fff;\n  padding: 12px 24px;\n  border-radius: 8px;\n  min-height: 48px; /* Accessible tap size */\n}"
            comparison["after"]["visual"] = "Split container allowing quick sign in on the left or guest checkout on the right, decorated with glassmorphism panels and responsive blue-to-purple gradient buttons."
        
        elif path == "/products":
            comparison["before"]["html"] = "<!-- Before: Image with no accessibility annotations -->\n<div class=\"product-card\">\n  <img src=\"/assets/audit.jpg\" />\n  <h3>AI Auditor Pro</h3>\n  <button onclick=\"applyFilter()\">Filter Results</button>\n</div>"
            comparison["before"]["css"] = "/* Product Card CSS */\n.product-card img {\n  width: 100%;\n}\nbutton:focus {\n  outline: none;\n}"
            comparison["before"]["visual"] = "No-outlines click button, and basic image layout."
            
            comparison["after"]["html"] = "<!-- After: WCAG compliant elements -->\n<div class=\"product-card card-glass\">\n  <img src=\"/assets/audit.jpg\" alt=\"Screenshot of AI auditor dashboard page showing accessibility scores\" />\n  <h3>AI Auditor Pro</h3>\n  <button class=\"btn-primary focus-ring\" aria-label=\"Filter search results\">Filter Results</button>\n</div>"
            comparison["after"]["css"] = "/* After: Compliant CSS */\n.card-glass {\n  background: rgba(15, 23, 42, 0.4);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 16px;\n}\n.focus-ring:focus-visible {\n  outline: 3px solid #10b981; /* Neon green keyboard outline */\n  outline-offset: 2px;\n}"
            comparison["after"]["visual"] = "Modern slate layout highlighting focus outline rings around filter controls."
            
        else:
            comparison["before"]["html"] = "<!-- Before layout -->\n<div>\n  <h1>Welcome</h1>\n  <p>Our company offers solutions.</p>\n</div>"
            comparison["before"]["css"] = "h1 { font-size: 14px; }"
            comparison["before"]["visual"] = "Inconsistent, tiny header text layout."
            
            comparison["after"]["html"] = "<!-- After layout -->\n<section class=\"hero-section\">\n  <h1 class=\"text-2xl font-bold\">Welcome to UXVerse</h1>\n  <p class=\"text-base leading-relaxed\">Our company offers solutions.</p>\n</section>"
            comparison["after"]["css"] = ".hero-section { padding: 4rem 2rem; }\n.text-2xl { font-size: 1.5rem; line-height: 2rem; }"
            comparison["after"]["visual"] = "Bold headers, increased line height, and spacing."

        return comparison

    def generate_screenshot_bounding_boxes(self, path: str) -> List[Dict[str, Any]]:
        """
        Returns bounding box overlays mapping locations of detected audit issues.
        These are plotted on the user screen relative to a mockup viewport (1200x800).
        """
        boxes = []
        if path == "/":
            boxes = [
                {
                    "issue_id": "ux-hero-cta",
                    "severity": "Warning",
                    "label": "Hero CTA Visual Clutter",
                    "x": 450, "y": 280, "width": 300, "height": 60
                },
                {
                    "issue_id": "wcag-img-alt",
                    "severity": "Critical",
                    "label": "Hero Image: Missing Alt",
                    "x": 800, "y": 150, "width": 350, "height": 280
                }
            ]
        elif path == "/checkout":
            boxes = [
                {
                    "issue_id": "ux-checkout-freedom",
                    "severity": "Critical",
                    "label": "Missing Guest Checkout",
                    "x": 200, "y": 120, "width": 800, "height": 200
                },
                {
                    "issue_id": "wcag-contrast",
                    "severity": "Warning",
                    "label": "Low Contrast Form Buttons",
                    "x": 520, "y": 620, "width": 160, "height": 48
                }
            ]
        elif path == "/products":
            boxes = [
                {
                    "issue_id": "ux-product-filters",
                    "severity": "Warning",
                    "label": "Page Reload Filter Form",
                    "x": 20, "y": 150, "width": 260, "height": 400
                },
                {
                    "issue_id": "wcag-keyboard-focus",
                    "severity": "Warning",
                    "label": "Invisible Keyboard Focus",
                    "x": 800, "y": 200, "width": 150, "height": 40
                }
            ]
        else:
            boxes = [
                {
                    "issue_id": "ux-generic-aesthetic",
                    "severity": "Minor",
                    "label": "Typography scale mismatch",
                    "x": 50, "y": 80, "width": 600, "height": 40
                }
            ]
        return boxes
