import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("uxverse.coach.vector_store")

class VectorStore:
    def __init__(self):
        # List of document records: {"id": str, "text": str, "metadata": dict, "embedding": List[float]}
        self.documents: List[Dict[str, Any]] = []

    def clear(self):
        self.documents.clear()
        logger.info("Vector store index cleared.")

    def add_documents(self, docs: List[Dict[str, Any]]):
        """Adds documents. doc must contain 'text', 'metadata', and 'embedding'."""
        for doc in docs:
            doc_id = doc.get("id") or f"doc-{len(self.documents)}"
            record = {
                "id": doc_id,
                "text": doc["text"],
                "metadata": doc.get("metadata") or {},
                "embedding": doc["embedding"]
            }
            self.documents.append(record)
        logger.info(f"Added {len(docs)} documents to local vector store. Total index size: {len(self.documents)}")

    def similarity_search(
        self, 
        query_embedding: List[float], 
        top_k: int = 5, 
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Peresents semantic similarity search using cosine dot product matching."""
        if not self.documents:
            return []

        scored_docs = []
        for doc in self.documents:
            # Apply metadata filtering if specified
            if metadata_filter:
                match = True
                for k, v in metadata_filter.items():
                    if doc["metadata"].get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            # Compute Cosine Dot Product (since embeddings are L2 normalized)
            score = self._dot_product(query_embedding, doc["embedding"])
            scored_docs.append((score, doc))

        # Sort by similarity score descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        # Format output
        results = []
        for score, doc in scored_docs[:top_k]:
            results.append({
                "id": doc["id"],
                "text": doc["text"],
                "metadata": doc["metadata"],
                "score": float(score)
            })
            
        return results

    def _dot_product(self, vec_a: List[float], vec_b: List[float]) -> float:
        if len(vec_a) != len(vec_b):
            return 0.0
        return sum(a * b for a, b in zip(vec_a, vec_b))

# Singleton instance
vector_store = VectorStore()
