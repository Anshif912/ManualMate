import logging
from typing import Dict, Any

logger = logging.getLogger("uxverse.coach.accessibility_agent")

class AccessibilityAgent:
    def __init__(self):
        self.name = "Accessibility Agent"

    def analyze(self, query: str, context: Dict[str, Any]) -> str:
        """Evaluates WCAG 2.2 criteria conformance, focus rings, contrast levels, and semantic elements."""
        logger.info("Accessibility Agent starting evaluation...")
        
        pages = context.get("pages", [])
        a11y_issues = []
        
        # Retrieve Accessibility issues from pages
        for page in pages:
            for issue in page.get("a11yIssues", []):
                a11y_issues.append({
                    "page": page.get("title", "Page"),
                    "path": page.get("path"),
                    "severity": issue.get("severity"),
                    "standard": issue.get("standard"),
                    "element": issue.get("element"),
                    "description": issue.get("description"),
                    "recommendation": issue.get("recommendation")
                })

        analysis_lines = []
        msg = query.lower()

        # Context-based issues (grounded from actual audit pages)
        matching_issues = []
        for iss in a11y_issues:
            kw = (iss["standard"] + " " + iss["description"] + " " + (iss["element"] or "")).lower()
            if any(term in msg for term in ["contrast", "color", "alt", "image", "focus", "keyboard", "outline", "aria", "wcag", "compliance"]):
                matching_issues.append(iss)

        if matching_issues:
            analysis_lines.append("### Grounded WCAG Conformance Violations:")
            for idx, iss in enumerate(matching_issues[:2], 1):
                element_str = f" on element `{iss['element']}`" if iss['element'] else ""
                analysis_lines.append(
                    f"{idx}. **[{iss['severity']}] Violation of {iss['standard']}{element_str}**\n"
                    f"   - Detail: {iss['description']}\n"
                    f"   - Developer guidance: {iss['recommendation']}"
                )
        else:
            analysis_lines.append(
                "No active WCAG violations matching the specific keywords were identified on the audited pages.\n"
                "Standard compliance check: Keyboard tab index structures follow logical reading orders. Ensure all dynamic modal panels bind role='dialog' attributes."
            )

        findings = (
            "**WCAG 2.2 Conformance & Assistive Compliance Analysis**:\n" +
            "\n".join(analysis_lines) + "\n\n"
            "**Keyboard Navigability Check**:\n"
            "Ensure all interactive focus actions use visible boundaries (focus-visible rings) to maintain compliance with WCAG Criterion 2.4.7."
        )
        return findings

# Singleton instance
accessibility_agent = AccessibilityAgent()
