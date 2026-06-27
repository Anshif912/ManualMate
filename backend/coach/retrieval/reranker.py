import logging
from utils.safe_strings import safe_lower
from typing import List, Dict, Any

logger = logging.getLogger("uxverse.coach.reranker")

class Reranker:
    def __init__(self):
        self.cross_encoder = None
        self.use_fallback = True
        self._init_reranker()

    def _init_reranker(self):
        # We use a custom, fast overlap and density score reranking logic by default
        # to ensure it executes in sub-milliseconds without native C-libraries on Windows
        logger.info("Initialized lightweight lexical reranker.")

    def rerank(self, query: str, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Reranks documents. Compares query density, sentence overlaps, and metadata weight.
        Returns reranked list of documents.
        """
        if not docs:
            return []

        query_terms = [q.strip() for q in query.lower().split() if len(q.strip()) > 2]
        if not query_terms:
            return docs

        reranked = []
        for doc in docs:
            text = doc["text"].lower()
            metadata = doc.get("metadata", {})
            
            # Base score from hybrid retriever
            score = doc.get("score", 0.5)

            # 1. Exact phrase matches (High boost)
            if query.lower() in text:
                score += 0.3

            # 2. Term frequency density (term matches relative to document size)
            term_matches = sum(1 for term in query_terms if term in text)
            if term_matches > 0:
                density = term_matches / len(query_terms)
                score += density * 0.2

            # 3. Critical metadata weight boost
            severity = safe_lower(metadata.get("severity"))
            if severity == "critical":
                score += 0.15
            elif severity == "warning":
                score += 0.05

            reranked.append({**doc, "score": score})

        # Sort descending by re-evaluated score
        reranked.sort(key=lambda x: x["score"], reverse=True)
        logger.info(f"Reranked {len(docs)} documents. Top score: {reranked[0]['score'] if reranked else 0.0}")
        
        return reranked

# Singleton instance
reranker = Reranker()
