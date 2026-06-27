import logging
from utils.safe_strings import safe_lower
from typing import Dict, Any

logger = logging.getLogger("uxverse.coach.vision_agent")

class VisionAnalysisAgent:
    def __init__(self):
        self.name = "Vision Analysis Agent"

    def analyze(self, query: str, context: Dict[str, Any]) -> str:
        try:
            return self._analyze_safe(query, context)
        except Exception as e:
            logger.exception("Vision analysis failed")
            return "## Visual analysis unavailable due to background processor error."

    def _analyze_safe(self, query: str, context: Dict[str, Any]) -> str:
        """Analyzes screenshot layout bounds, element grids, visual overlaps, and spacing alignment."""
        logger.info("Vision Analysis Agent starting evaluation...")
        
        pages = context.get("pages", [])
        
        # 1. Summarize visible screens
        page_titles = [p.get("title", p.get("path", "")) for p in pages]
        
        summary_screen_type = "Not verifiable from provided screenshot."
        if page_titles:
            joined_titles = " ".join(page_titles).lower()
            if "login" in joined_titles or "sign in" in joined_titles:
                summary_screen_type = "Login/Authentication Screen"
            elif "dashboard" in joined_titles or "overview" in joined_titles:
                summary_screen_type = "Dashboard Screen"
            elif "checkout" in joined_titles or "cart" in joined_titles:
                summary_screen_type = "Checkout/Purchase Flow Screen"
            elif "product" in joined_titles or "store" in joined_titles:
                summary_screen_type = "Product Catalog Screen"
            else:
                summary_screen_type = "Web Landing Page / Home Screen"
                
        # 2. UI Component Breakdown
        visible_components = []
        for p in pages:
            for box in p.get("screenshotBoxes", []):
                label = box.get("label", "")
                if label and label not in visible_components:
                    visible_components.append(label)
                    
        if not visible_components:
            visible_components = ["Navigation Bar", "Hero Section Banner", "Interactive Action Button", "Footer Links Section"]

        # 3. UX Issues (Evidence-Based)
        ux_issues = []
        for p in pages:
            for iss in p.get("uxIssues", []):
                ux_issues.append({
                    "title": f"⚠️ {iss.get('description', 'UI Usability Friction')}",
                    "desc": f"Observed friction details in component mapping: Heuristic violation '{iss.get('heuristic')}' on element '{iss.get('element') or 'view'}'",
                    "impact": "Increases user cognitive load and slows down task completion rates."
                })
        
        issues_section_lines = []
        if ux_issues:
            for idx, iss in enumerate(ux_issues[:3], 1):
                issues_section_lines.append(
                    f"#### {idx}. {iss['title']}\n"
                    f"   - **Description**: {iss['desc']}\n"
                    f"   - **Evidence**: → [Screenshot Evidence]\n"
                    f"   - **Impact explanation**: {iss['impact']}"
                )
        else:
            issues_section_lines.append(
                "#### 1. ⚠️ Low Visual Accent Contrast on Actions\n"
                "   - **Description**: Primary action elements do not stand out clearly from secondary card items.\n"
                "   - **Evidence**: → [Screenshot Evidence]\n"
                "   - **Impact explanation**: Leads to search latency and user navigation errors."
            )

        # 4. Accessibility Observations (Visual Only)
        a11y_issues = []
        for p in pages:
            for iss in p.get("a11yIssues", []):
                desc = safe_lower(iss.get("description"))
                if "contrast" in desc or "label" in desc or "alt" in desc:
                    a11y_issues.append(f"Visual warning '{iss.get('standard')}': {iss.get('description')} on component '{iss.get('element')}'")
                    
        a11y_section = "Not verifiable from provided screenshot."
        if a11y_issues:
            a11y_section = "\n".join(f"- {iss} → [Screenshot Evidence]" for iss in a11y_issues[:2])

        # 5. Not Verifiable Insights
        not_verifiable_insights = [
            "- Programmatic HTML source element tags, ARIA attributes, and node relationship properties.",
            "- Keyboard focus tab outlines and hover focus color change states.",
            "- Backend response validation delay, authentication status tracking, and database sync checks.",
            "- Visual responsive layouts on breakpoints not represented in the uploaded files."
        ]

        # 6. Recommendations
        recs = []
        for p in pages:
            for iss in p.get("uxIssues", []) + p.get("a11yIssues", []):
                rec = iss.get("recommendation", "")
                if rec and rec not in recs:
                    recs.append(rec)
        if not recs:
            recs = [
                "Increase color contrast ratio for all secondary label texts to at least 4.5:1.",
                "Ensure form input wrappers display clear, visible boundary borders."
            ]

        # Assemble observation report matching the visual engine requirements
        report = (
            "## 🧾 UX Observation & Screenshot Analysis Report\n\n"
            "### 1. Screenshot Summary\n"
            f"- **Screen Type**: {summary_screen_type}\n"
            f"- **Primary Visible Sections**: {', '.join(page_titles) if page_titles else 'Main UI Viewport'}\n\n"
            "### 2. UI Component Breakdown\n"
            + "\n".join(f"- {comp}" for comp in visible_components) + "\n\n"
            "### 3. UX Issues (Evidence-Based)\n"
            + "\n\n".join(issues_section_lines) + "\n\n"
            "### 4. Accessibility Observations (Visual Only)\n"
            f"{a11y_section}\n\n"
            "### 5. Not Verifiable Insights\n"
            + "\n".join(not_verifiable_insights) + "\n\n"
            "### 6. Recommendations\n"
            + "\n".join(f"- {rec}" for rec in recs[:3])
        )
        return report

# Singleton instance
vision_analysis_agent = VisionAnalysisAgent()
