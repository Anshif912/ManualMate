import re
import logging
from typing import Dict, Any

logger = logging.getLogger("uxverse.coach.response_formatter")

class ResponseFormatter:
    def format_raw_response(self, text: str) -> str:
        """Cleans and standardizes spacing, line breaks, and list bullets for the final response."""
        if not text:
            return ""

        # Normalize line endings
        formatted = text.replace("\r\n", "\n")
        
        # Ensure header titles are bolded properly in markdown
        headers = [
            "✅ Overview", "💡 Key Findings", "⚠️ Highest Priority Improvements", 
            "🚀 Expected User Impact", "📈 Business Impact", "🎯 Recommended Next Step", 
            "🎯 Need More Help?", "Confidence Score"
        ]
        
        for header in headers:
            # Look for "Header:" or "Header - " and format as "**Header**:"
            pattern = re.compile(rf"(?:^|\n)(?:\*\*|)?{re.escape(header)}(?:\*\*|)?\s*[:-]\s*", re.IGNORECASE)
            formatted = pattern.sub(f"\n\n**{header}**:\n", formatted)

        # Remove double consecutive blank lines
        formatted = re.sub(r"\n{3,}", "\n\n", formatted).strip()
        return formatted

# Singleton instance
response_formatter = ResponseFormatter()
