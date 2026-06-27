import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("uxverse.coach.memory")

class ConversationMemory:
    def __init__(self):
        # Session state details
        self.current_url: Optional[str] = None
        self.current_audit_id: Optional[str] = None
        self.current_page_path: Optional[str] = None
        self.current_tab: Optional[str] = None
        self.selected_component: Optional[str] = None
        
        # Recent chat history: [{"sender": "user"|"coach", "text": str}]
        self.history: List[Dict[str, str]] = []

    def set_context(self, url: Optional[str] = None, audit_id: Optional[str] = None, page_path: Optional[str] = None, tab: Optional[str] = None, component: Optional[str] = None):
        """Updates the session's active context elements."""
        if url:
            self.current_url = url
        if audit_id:
            self.current_audit_id = audit_id
        if page_path:
            self.current_page_path = page_path
        if tab:
            self.current_tab = tab
        if component:
            self.selected_component = component
        logger.info(f"Memory context updated. Url={self.current_url}, Page={self.current_page_path}, Tab={self.current_tab}")

    def add_interaction(self, question: str, answer: str):
        self.history.append({"sender": "user", "text": question})
        self.history.append({"sender": "coach", "text": answer})
        
        # Keep only the last 10 interactions to manage context length
        if len(self.history) > 20:
            self.history = self.history[-20:]

    def get_recent_history_str(self) -> str:
        """Formats recent chat history as a dialogue exchange string."""
        if not self.history:
            return "No previous conversation history."
            
        lines = []
        for chat in self.history[-6:]:  # include last 3 exchanges (6 lines)
            sender = "User" if chat["sender"] == "user" else "Assistant"
            lines.append(f"{sender}: {chat['text']}")
        return "\n".join(lines)

    def clear(self):
        self.current_url = None
        self.current_audit_id = None
        self.current_page_path = None
        self.current_tab = None
        self.selected_component = None
        self.history.clear()
        logger.info("Conversation memory cleared.")

# Singleton instance
conversation_memory = ConversationMemory()
