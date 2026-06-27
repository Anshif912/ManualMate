import logging
from typing import List

logger = logging.getLogger("uxverse.coach.intent_classifier")

class IntentClassifier:
    def __init__(self):
        # Maps keywords to their classified intents
        self._intent_keywords = {
            "Accessibility": ["accessibility", "a11y", "contrast", "color", "alt", "image", "keyboard", "focus", "outline", "aria", "screen reader"],
            "UX Review": ["ux", "heuristics", "usability", "cognitive", "journey", "flow", "friction", "design"],
            "Code Generation": ["tailwind", "css", "html", "react", "jsx", "code", "component", "refactor", "snippet"],
            "Screenshot Analysis": ["screenshot", "layout", "visual", "spacing", "overlap", "cta", "position", "margin", "padding"],
            "WCAG Explanation": ["wcag", "guideline", "standard", "criterion", "1.1.1", "1.3.1", "1.4.3", "2.4.7"],
            "Heuristic Explanation": ["nielsen", "heuristic", "prevention", "control", "freedom", "consistency"],
            "Dashboard Question": ["dashboard", "tab", "score", "metric", "crawl", "history"],
            "Audit Question": ["audit", "finding", "issue", "violation", "recommendation", "critical", "warning", "fix"]
        }

    def classify_intent(self, query: str) -> str:
        """Classifies the user's query intent to optimize agent activation."""
        msg = query.lower()
        intent_matches = {}

        for intent, keywords in self._intent_keywords.items():
            matches = sum(1 for kw in keywords if kw in msg)
            if matches > 0:
                intent_matches[intent] = matches

        if not intent_matches:
            logger.info("No specific intent keywords matched. Defaulting to general 'UX Review'.")
            return "UX Review"

        # Return the intent with the highest keyword count match
        classified = max(intent_matches, key=intent_matches.get)
        logger.info(f"Classified query intent as: '{classified}'")
        return classified

    def get_required_agents(self, intent: str) -> List[str]:
        """Determines which agent names should participate in answering this intent."""
        # Standard maps:
        if intent in ["Accessibility", "WCAG Explanation"]:
            return ["accessibility_agent", "knowledge_agent"]
        elif intent in ["Code Generation"]:
            return ["frontend_agent", "knowledge_agent"]
        elif intent in ["Screenshot Analysis"]:
            return ["vision_agent", "knowledge_agent"]
        elif intent in ["UX Review", "Heuristic Explanation"]:
            return ["ux_agent", "knowledge_agent"]
        elif intent in ["Dashboard Question", "Audit Question"]:
            return ["knowledge_agent", "ux_agent", "accessibility_agent"]
        else:
            return ["ux_agent", "accessibility_agent", "knowledge_agent"]

# Singleton instance
intent_classifier = IntentClassifier()
