"""
Business Impact Agent — Computes real revenue, conversion, and CSAT impact
from the detected UX and A11y issues.
"""
import logging
from utils.safe_strings import safe_lower
import math
from typing import List, Dict, Any

logger = logging.getLogger("uxverse.business_agent")

# Rough industry benchmarks for impact estimation
SEVERITY_REVENUE_IMPACT = {
    "Critical": 800,   # per critical issue: ~$800/month revenue loss
    "Warning":  250,
    "Minor":     60,
}

SEVERITY_CONVERSION_IMPACT = {
    "Critical": 1.8,  # % conversion lift per resolved critical issue
    "Warning":  0.6,
    "Minor":    0.15,
}

SEVERITY_CSAT_IMPACT = {
    "Critical": 2.5,
    "Warning":  1.0,
    "Minor":    0.3,
}

# Issue category multipliers (some issues have outsized business impact)
CATEGORY_MULTIPLIERS = {
    "checkout":     2.5,
    "cart":         2.2,
    "payment":      2.4,
    "form":         1.8,
    "login":        1.5,
    "signup":       1.6,
    "pricing":      1.7,
    "cta":          1.8,
    "search":       1.3,
    "navigation":   1.2,
    "default":      1.0,
}


class BusinessAgent:
    """Calculates business impact metrics from detected UX and accessibility issues."""

    def analyze(
        self,
        ux_issues: List[Dict[str, Any]],
        a11y_issues: List[Dict[str, Any]],
        page_path: str,
    ) -> Dict[str, Any]:
        try:
            return self._analyze_safe(ux_issues, a11y_issues, page_path)
        except Exception as e:
            logger.exception("Business analysis failed")
            return {
                "conversion_lift_percentage": 0.0,
                "estimated_monthly_revenue_lift": 0,
                "csat_lift_percentage": 0.0,
                "development_effort": "Low",
            }

    def _analyze_safe(
        self,
        ux_issues: List[Dict[str, Any]],
        a11y_issues: List[Dict[str, Any]],
        page_path: str,
    ) -> Dict[str, Any]:
        all_issues = ux_issues + a11y_issues
        page_multiplier = self._get_page_multiplier(page_path)

        revenue_lift = 0.0
        conversion_lift = 0.0
        csat_lift = 0.0

        for issue in all_issues:
            sev = issue.get("severity", "Minor")
            revenue_lift   += SEVERITY_REVENUE_IMPACT.get(sev, 60) * page_multiplier
            conversion_lift += SEVERITY_CONVERSION_IMPACT.get(sev, 0.15) * page_multiplier
            csat_lift       += SEVERITY_CSAT_IMPACT.get(sev, 0.3) * page_multiplier

        # Apply diminishing returns for high issue counts
        revenue_lift   = revenue_lift * (1 / (1 + math.log10(max(1, len(all_issues)) * 0.2)))
        conversion_lift = min(25.0, conversion_lift)
        csat_lift       = min(20.0, csat_lift)

        # Determine dev effort
        critical_count = sum(1 for i in all_issues if i.get("severity") == "Critical")
        warning_count  = sum(1 for i in all_issues if i.get("severity") == "Warning")

        if critical_count >= 3:
            effort = "High"
        elif critical_count >= 1 or warning_count >= 3:
            effort = "Medium"
        else:
            effort = "Low"

        return {
            "conversion_lift_percentage":     round(conversion_lift, 1),
            "estimated_monthly_revenue_lift": round(revenue_lift),
            "csat_lift_percentage":           round(csat_lift, 1),
            "development_effort":             effort,
        }

    def _get_page_multiplier(self, path: str) -> float:
        path_lower = safe_lower(path)
        for keyword, multiplier in CATEGORY_MULTIPLIERS.items():
            if keyword in path_lower:
                return multiplier
        # Home page gets higher weight
        if path in ("/", ""):
            return 1.6
        return CATEGORY_MULTIPLIERS["default"]
