"""
Persona Agent — Generates persona-specific UX scores and recommendations
based on real issues detected by the UX and A11y agents.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uxverse.persona_agent")


class PersonaAgent:
    """
    Evaluates how 5 user personas experience the page based on detected issues.
    Each persona has different sensitivity to specific issue types.
    """

    PERSONAS = [
        {
            "name": "First-time Visitor",
            "role": "New user exploring the site",
            "issue_weights": {
                "h1-visibility":   2.0,   # unclear status hurts first-timers
                "h4-consistency":  1.8,   # inconsistency is confusing
                "h6-recognition":  1.8,   # needs clear labels/hints
                "h8-minimalist":   1.5,   # cluttered design overwhelms
                "h10-help":        1.5,   # needs help docs
                "wcag-2.4.2":      1.2,   # page title helps orient
                "default":         1.0,
            },
            "friction_templates": {
                "high": "Cluttered navigation and unclear CTAs make it very difficult to understand the site purpose or take a first action.",
                "medium": "Some inconsistency in the interface creates minor confusion, but the main flow is discoverable.",
                "low": "Clear structure and visible CTAs make this page very easy for new visitors to understand and engage with.",
            },
            "recs": {
                "high": "Simplify the hero section to one clear primary CTA. Add an onboarding tooltip or guided tour for new users. Ensure the page title immediately communicates value.",
                "medium": "Add contextual hints for form fields and improve CTA hierarchy. Consider a welcome modal for first-time visitors.",
                "low": "Maintain clarity with a consistent design system. Consider A/B testing the hero CTA copy for higher conversion.",
            },
        },
        {
            "name": "Elderly User",
            "role": "Senior user, 65+ years old",
            "issue_weights": {
                "wcag-1.4":        2.5,   # contrast is critical
                "h8-minimalist":   2.0,   # cognitive overload
                "h6-recognition":  2.0,   # needs clear labels
                "h5-error":        1.8,   # error prevention
                "wcag-2.4.7":      2.0,   # focus visible
                "wcag-1.3.1":      1.5,   # form labels
                "default":         1.2,
            },
            "friction_templates": {
                "high": "Poor contrast, small touch targets, and complex navigation make this page very difficult for elderly users.",
                "medium": "Some contrast and navigation issues may slow down elderly users, but core tasks are accomplishable.",
                "low": "Clear typography and simple layout make this page accessible and comfortable for elderly users.",
            },
            "recs": {
                "high": "Increase font size to minimum 16px, improve color contrast to 4.5:1 ratio, simplify navigation to 5 items max, and increase button touch targets to 44×44px.",
                "medium": "Review color contrast ratios and ensure all interactive elements are at least 44×44px. Add more white space between elements.",
                "low": "Maintain current accessibility practices. Consider adding a font-size toggle for users who need larger text.",
            },
        },
        {
            "name": "Power User",
            "role": "Expert user seeking efficiency",
            "issue_weights": {
                "h7-efficiency":   2.5,   # efficiency matters most
                "h1-visibility":   1.5,   # needs status feedback
                "h3-control":      1.8,   # needs control
                "h4-consistency":  1.5,   # consistency aids efficiency
                "default":         0.8,   # most issues affect less
            },
            "friction_templates": {
                "high": "Lack of search, keyboard shortcuts, and breadcrumbs makes task completion slow and frustrating for power users.",
                "medium": "Core efficiency features are missing in some areas but the main workflow is functional.",
                "low": "Efficient navigation and clear structure allow power users to complete tasks quickly.",
            },
            "recs": {
                "high": "Add keyboard shortcuts for common actions (e.g., Ctrl+K for search). Implement breadcrumbs. Add a search bar. Provide 'quick action' shortcuts in menus.",
                "medium": "Add persistent breadcrumb navigation and improve search functionality. Consider adding keyboard navigation hints.",
                "low": "Enhance power-user features with keyboard shortcuts and advanced filtering options.",
            },
        },
        {
            "name": "Visually Impaired User",
            "role": "Screen reader and assistive technology user",
            "issue_weights": {
                "wcag-1.1.1":      3.0,   # alt text is critical
                "wcag-1.3.1":      2.5,   # form labels
                "wcag-3.1.1":      2.0,   # language
                "wcag-2.4.1":      2.0,   # skip links
                "wcag-2.4.2":      1.5,   # page title
                "wcag-4.1.2":      2.0,   # ARIA
                "wcag-4.1.1":      1.5,   # duplicate IDs
                "wcag-2.4.7":      2.0,   # focus visible
                "wcag-2.4.4":      1.5,   # link purpose
                "default":         1.5,
            },
            "friction_templates": {
                "high": "Missing alt text, unlabeled form inputs, and no skip navigation make this page very difficult to use with a screen reader.",
                "medium": "Some accessibility gaps exist but core content is reachable. Focus management and ARIA improvements needed.",
                "low": "Good accessibility practices make this page usable with screen readers. Minor improvements can be made.",
            },
            "recs": {
                "high": "Urgently add alt attributes to all images, associate labels with all form inputs, and add a skip navigation link. Test with NVDA or VoiceOver immediately.",
                "medium": "Audit all interactive elements for accessible names. Ensure focus order is logical. Test complete user flows with a screen reader.",
                "low": "Conduct regular screen reader testing. Consider adding 'aria-live' regions for dynamic content updates.",
            },
        },
        {
            "name": "Frequent Customer",
            "role": "Returning user completing regular tasks",
            "issue_weights": {
                "h4-consistency":  2.0,   # consistency across visits
                "h3-control":      1.8,   # control and undo
                "h9-error":        1.5,   # error recovery
                "h7-efficiency":   1.8,   # returning users value speed
                "wcag-4.1.1":      1.2,   # stability
                "default":         0.9,
            },
            "friction_templates": {
                "high": "Inconsistent navigation and lack of efficient shortcuts make repeat tasks cumbersome for returning users.",
                "medium": "Some inconsistencies slow down repeat tasks but core functionality works reliably.",
                "low": "Consistent interface and efficient navigation help returning users complete tasks quickly and confidently.",
            },
            "recs": {
                "high": "Standardize navigation across all pages. Add 'remember me' for forms. Provide quick-access shortcuts to frequently used sections.",
                "medium": "Ensure navigation consistency across all pages. Add breadcrumbs to help returning users track their location.",
                "low": "Consider adding personalization features for returning users, such as saved preferences and quick-access shortcuts.",
            },
        },
    ]

    def analyze(
        self,
        ux_issues: List[Dict[str, Any]],
        a11y_issues: List[Dict[str, Any]],
        ux_score: int,
        a11y_score: int,
    ) -> List[Dict[str, Any]]:
        all_issues = ux_issues + a11y_issues
        results = []

        for persona_cfg in self.PERSONAS:
            score = self._compute_score(all_issues, ux_score, a11y_score, persona_cfg)
            satisfaction = "High" if score >= 78 else ("Medium" if score >= 60 else "Low")
            sat_key = satisfaction.lower()
            results.append({
                "name": persona_cfg["name"],
                "role": persona_cfg["role"],
                "score": score,
                "satisfaction": satisfaction,
                "friction": persona_cfg["friction_templates"][sat_key],
                "recommendation": persona_cfg["recs"][sat_key],
            })

        return results

    def _compute_score(
        self,
        issues: List[Dict[str, Any]],
        ux_score: int,
        a11y_score: int,
        persona_cfg: Dict,
    ) -> int:
        base = (ux_score * 0.5 + a11y_score * 0.5)
        penalty = 0.0
        weights = persona_cfg["issue_weights"]
        default_weight = weights.get("default", 1.0)

        for issue in issues:
            severity = issue.get("severity", "Minor")
            sev_penalty = {"Critical": 6.0, "Warning": 3.0, "Minor": 1.0}.get(severity, 1.0)

            # Find best matching weight key
            weight = default_weight
            issue_id = issue.get("id", "").lower()
            issue_standard = issue.get("standard", "").lower()
            issue_heuristic = issue.get("heuristic", "").lower()

            for key, w in weights.items():
                if key in issue_id or key in issue_standard or key in issue_heuristic:
                    weight = w
                    break

            penalty += sev_penalty * weight

        # Scale penalty: more weight → lower score for this persona
        max_penalty = 100.0
        adjusted = base - min(penalty * 0.6, max_penalty * 0.4)
        return max(30, min(99, int(adjusted)))
