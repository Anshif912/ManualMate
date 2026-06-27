import logging
from typing import Dict, Any, List
from ..retrieval.hybrid_retriever import hybrid_retriever
from ..retrieval.reranker import reranker

logger = logging.getLogger("uxverse.coach.knowledge_agent")

class KnowledgeAgent:
    def __init__(self):
        self.name = "Knowledge Agent"

    def analyze(self, query: str, context: Dict[str, Any]) -> str:
        """Retrieves and filters database findings, historical audits, and WCAG rules using Hybrid RAG + Reranking."""
        logger.info("Knowledge Agent starting context search...")
        
        # 1. Search vector database for query matches
        retrieved_docs = hybrid_retriever.retrieve(query, top_k=5)
        
        # 2. Rerank findings to supply the highest quality chunks
        reranked_docs = reranker.rerank(query, retrieved_docs)
        
        findings_lines = []
        if reranked_docs:
            findings_lines.append("### Grounded Semantic Findings from Knowledge Base:")
            for idx, doc in enumerate(reranked_docs[:3], 1):
                score_str = f" (relevance score: {doc.get('score', 0.0):.2f})"
                findings_lines.append(
                    f"{idx}. **Document ID: {doc['id']}**{score_str}\n"
                    f"   - Match: {doc['text']}\n"
                    f"   - Context category: {doc['metadata'].get('category', 'general')}"
                )
        else:
            # Fallback compile from local context dictionary passed down
            url = context.get("url", "audited site")
            findings_lines.append(
                f"No database indexed vectors matched the query directly.\n"
                f"Falling back to basic context check for {url}:\n"
                f"  - UX Score: {context.get('uxScore', 'N/A')}/100\n"
                f"  - Accessibility Score: {context.get('a11yScore', 'N/A')}/100\n"
                f"  - Critical Violations: {context.get('criticalCount', 0)}"
            )

        findings = (
            "**Semantic RAG Context Retrieval & Reranked findings**:\n" +
            "\n".join(findings_lines)
        )
        return findings

# Singleton instance
knowledge_agent = KnowledgeAgent()
