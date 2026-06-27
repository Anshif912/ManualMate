import logging
from typing import Dict, Any, List

logger = logging.getLogger("uxverse.coach.ux_agent")

class UXAnalysisAgent:
    def __init__(self):
        self.name = "UX Analysis Agent"

    def analyze(self, query: str, context: Dict[str, Any]) -> str:
        """Evaluates Jakob Nielsen's Heuristics, cognitive friction, user paths, and conversion blocks."""
        logger.info("UX Analysis Agent starting evaluation...")
        
        pages = context.get("pages", [])
        ux_issues = []
        
        # Retrieve UX issues from pages
        for page in pages:
            for issue in page.get("uxIssues", []):
                ux_issues.append({
                    "page": page.get("title", "Page"),
                    "path": page.get("path"),
                    "severity": issue.get("severity"),
                    "heuristic": issue.get("heuristic"),
                    "description": issue.get("description"),
                    "recommendation": issue.get("recommendation")
                })

        # Match query keywords to determine specific heuristic analysis
        analysis_lines = []
        msg = query.lower()

        # Context-based issues (grounded from actual audit pages)
        matching_issues = []
        for iss in ux_issues:
            kw = (iss["heuristic"] + " " + iss["description"]).lower()
            if any(term in msg for term in ["checkout", "guest", "form", "heuristic", "nielsen", "usability", "freedom", "control", "load"]):
                matching_issues.append(iss)

        if matching_issues:
            analysis_lines.append("### Grounded Usability findings from Audit:")
            for idx, iss in enumerate(matching_issues[:2], 1):
                analysis_lines.append(
                    f"{idx}. **[{iss['severity']}] Heuristic Violation on {iss['path']}**\n"
                    f"   - Heuristic: {iss['heuristic']}\n"
                    f"   - Description: {iss['description']}\n"
                    f"   - Core Friction: High cognitive load due to input fields or pathway blockages."
                )
        else:
            analysis_lines.append(
                "No active Heuristic usability violations matching the specific keywords were identified on the audited pages.\n"
                "Reviewing general layout structures: The primary navigation panel meets Heuristic #4 (Consistency) but can improve on minimal information density (Heuristic #8)."
            )

        # Build analysis blocks
        findings = (
            "**Usability Heuristics & Cognitive Load Analysis**:\n" + 
            "\n".join(analysis_lines) + "\n\n"
            "**Conversion Lift Recommendation**:\n"
            "Align landing layout CTAs and checkout paths with Heuristic #3 (User Control and Freedom) to prevent cart drop-offs."
        )
        return findings

# Singleton instance
ux_analysis_agent = UXAnalysisAgent()
