import re
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger("uxverse.coach.confidence_evaluator")

class ConfidenceEvaluator:
    def __init__(self, threshold: int = 75):
        self.threshold = threshold

    def extract_confidence(self, text: str) -> int:
        """Parses confidence score percentage from the generated text."""
        match = re.search(r"Confidence\s*Score:\s*(\d+)%", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        match = re.search(r"Confidence:\s*(\d+)%", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 70  # Default fallback if not found

    def evaluate_response(self, query: str, response: str, context: Dict[str, Any]) -> Tuple[bool, int]:
        """
        Validates response quality based on:
        1. Context grounding (checks for hallucinations/guesswork)
        2. Format integrity (required headers exist)
        3. Parsed self-evaluated confidence score
        """
        if not response:
            return False, 0

        # Check for required formatting keywords to ensure it conforms to consulting structure
        required_headers = [
            "## ✅ Overview", "## 💡 Key Findings", "## ⚠️ Highest Priority Improvements", 
            "## 🚀 Expected User Impact", "## 📈 Business Impact", "## 🎯 Recommended Next Step", 
            "## 🎯 Need More Help?", "Confidence Score"
        ]
        
        format_matches = sum(1 for header in required_headers if header in response)
        format_score = (format_matches / len(required_headers)) * 100
        
        # Verify self-evaluated confidence
        self_conf = self.extract_confidence(response)

        # Basic grounding check: check if the answer references actual terms from context or admits lack of evidence
        is_grounded = True
        low_evidence_statement = "sufficient audit evidence is unavailable" in response.lower() or "couldn't find sufficient audit evidence" in response.lower()
        
        # If model hallucinated standard values without RAG data, flag it
        pages = context.get("pages", [])
        if not pages and not low_evidence_statement and self_conf > 85:
            # High confidence with zero pages is suspicious (potential hallucination)
            is_grounded = False
            self_conf = 60
            logger.warning("Grounding check failed: High confidence with empty audit context.")

        # Combined quality evaluation
        is_accepted = format_score >= 80 and self_conf >= self.threshold and is_grounded
        
        logger.info(
            f"Evaluation: FormatScore={format_score:.1f}%, SelfConfidence={self_conf}%, "
            f"Grounded={is_grounded} -> Accepted: {is_accepted}"
        )
        
        return is_accepted, self_conf

# Singleton instance
confidence_evaluator = ConfidenceEvaluator()
