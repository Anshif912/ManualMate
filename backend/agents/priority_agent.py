"""
Priority Agent — Selects the Top 3 highest-ROI improvements across all pages.
Ranks by: severity weight × business impact × accessibility level × dev effort.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uxverse.priority_agent")

SEVERITY_WEIGHT = {"Critical": 10, "Warning": 5, "Minor": 2}
EFFORT_MULTIPLIER = {"Low": 1.5, "Medium": 1.0, "High": 0.6}


class PriorityAgent:
    """Selects and ranks the top 3 most impactful issues across all audited pages."""

    def select_top_improvements(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Collect all issues from all pages, score them, and return top 3.
        Each result contains: issue + page context + score + recommendation.
        """
        scored_issues = []

        for page in pages:
            page_path = page.get("path", "/")
            page_url  = page.get("url", "")
            page_title = page.get("title", page_path)
            biz = page.get("businessImpact", {})
            effort = biz.get("development_effort", "Medium")
            revenue = biz.get("estimated_monthly_revenue_lift", 0)

            all_issues = page.get("uxIssues", []) + page.get("a11yIssues", [])

            for issue in all_issues:
                severity = issue.get("severity", "Minor")
                sev_weight = SEVERITY_WEIGHT.get(severity, 2)
                effort_mult = EFFORT_MULTIPLIER.get(effort, 1.0)

                # WCAG Level A issues get highest priority
                standard = issue.get("standard", "")
                wcag_bonus = 2.0 if " A —" in standard else (1.5 if " AA —" in standard else 1.0)

                # Revenue-backed pages get higher scores
                revenue_bonus = 1 + min(revenue / 5000, 1.5)

                score = sev_weight * effort_mult * wcag_bonus * revenue_bonus

                scored_issues.append({
                    "score": score,
                    "issue": issue,
                    "page_path": page_path,
                    "page_url": page_url,
                    "page_title": page_title,
                    "development_effort": effort,
                    "revenue_impact": revenue,
                })

        # Sort descending by score, deduplicate by similar issue type
        scored_issues.sort(key=lambda x: -x["score"])

        # Deduplicate: pick top unique issue types
        seen_types = set()
        top_3 = []
        for item in scored_issues:
            issue_key = item["issue"].get("standard") or item["issue"].get("heuristic") or item["issue"].get("id","")
            if issue_key not in seen_types:
                seen_types.add(issue_key)
                top_3.append(item)
            if len(top_3) >= 3:
                break

        # Format for frontend
        results = []
        for rank, item in enumerate(top_3, 1):
            issue = item["issue"]
            results.append({
                "rank": rank,
                "issue_id": issue.get("id", f"priority-{rank}"),
                "title": self._issue_title(issue),
                "severity": issue.get("severity", "Warning"),
                "standard": issue.get("standard"),
                "heuristic": issue.get("heuristic"),
                "element": issue.get("element"),
                "description": issue.get("description", ""),
                "recommendation": issue.get("recommendation", ""),
                "page_path": item["page_path"],
                "page_url": item["page_url"],
                "page_title": item["page_title"],
                "development_effort": item["development_effort"],
                "estimated_revenue_lift": item["revenue_impact"],
                "priority_score": round(item["score"], 1),
            })

        return results

    def _issue_title(self, issue: Dict[str, Any]) -> str:
        standard = issue.get("standard", "")
        heuristic = issue.get("heuristic", "")
        description = issue.get("description", "")

        if standard:
            # e.g. "WCAG 2.2 A — 1.1.1 Non-text Content" → "1.1.1 Non-text Content"
            parts = standard.split("—")
            if len(parts) > 1:
                return parts[-1].strip()
            return standard

        if heuristic:
            # e.g. "Heuristic #8: Aesthetic and minimalist design" → "Aesthetic and Minimalist Design"
            parts = heuristic.split(":")
            if len(parts) > 1:
                return parts[-1].strip().title()
            return heuristic

        # Fall back to first sentence of description
        return description.split(".")[0][:60] if description else "UX Improvement"
