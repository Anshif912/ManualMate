import logging
from typing import List, Dict, Any, Optional
from .embedding_service import embedding_service
from .vector_store import vector_store
from ..services.cache_service import cache_service

logger = logging.getLogger("uxverse.coach.hybrid_retriever")

class HybridRetriever:
    def __init__(self, alpha: float = 0.7):
        self.alpha = alpha  # Weight of semantic score vs keyword score

    def retrieve(
        self, 
        query: str, 
        top_k: int = 5, 
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Combines Semantic search and Keyword BM25-like overlap search.
        Checks prompt retrieval cache first.
        """
        cache_key = f"{query}_{str(metadata_filter)}_{top_k}"
        cached = cache_service.get_retrieval(cache_key)
        if cached is not None:
            logger.info("Hybrid RAG cache hit.")
            return cached

        if not vector_store.documents:
            return []

        # 1. Semantic Search
        query_embedding = embedding_service.get_embedding(query)
        semantic_results = vector_store.similarity_search(query_embedding, top_k=len(vector_store.documents), metadata_filter=metadata_filter)
        semantic_scores = {r["id"]: r["score"] for r in semantic_results}

        # 2. Keyword Search (Jaccard token overlap scoring)
        query_tokens = set(query.lower().split())
        keyword_scores = {}
        
        for doc in vector_store.documents:
            # Filter metadata first
            if metadata_filter:
                match = True
                for k, v in metadata_filter.items():
                    if doc["metadata"].get(k) != v:
                        match = False
                        break
                if not match:
                    continue
                    
            doc_tokens = set(doc["text"].lower().split())
            intersection = query_tokens.intersection(doc_tokens)
            union = query_tokens.union(doc_tokens)
            jaccard = len(intersection) / len(union) if union else 0.0
            keyword_scores[doc["id"]] = jaccard

        # 3. Hybrid Merge (Reciprocal Rank Fusion or Alpha Weighted Score)
        hybrid_results = []
        for doc in vector_store.documents:
            doc_id = doc["id"]
            if doc_id not in keyword_scores:
                continue # Was filtered by metadata

            sem_score = semantic_scores.get(doc_id, 0.0)
            key_score = keyword_scores.get(doc_id, 0.0)
            
            # Map score to [0, 1] range roughly
            final_score = self.alpha * sem_score + (1.0 - self.alpha) * key_score
            
            hybrid_results.append({
                "id": doc_id,
                "text": doc["text"],
                "metadata": doc["metadata"],
                "score": float(final_score)
            })

        # Sort and return Top-K
        hybrid_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = hybrid_results[:top_k]
        
        cache_service.set_retrieval(cache_key, top_results)
        return top_results

# Singleton instance
hybrid_retriever = HybridRetriever()
