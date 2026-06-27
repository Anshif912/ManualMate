import logging
from typing import List, Union
from ..services.cache_service import cache_service

logger = logging.getLogger("uxverse.coach.embedding")

class EmbeddingService:
    def __init__(self):
        self.model = None
        self.use_fallback = False
        self._init_model()

    def _init_model(self):
        try:
            logger.info("Attempting to load sentence-transformers model...")
            from sentence_transformers import SentenceTransformer
            # Using a fast, lightweight 120MB model
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not import or load sentence-transformers: {e}. Falling back to TF-IDF vector embeddings.")
            self.use_fallback = True

    def get_embedding(self, text: str) -> List[float]:
        """Generates embedding for a single text chunk, utilizing cache."""
        cached = cache_service.get_embedding(text)
        if cached is not None:
            return cached

        if self.use_fallback:
            embedding = self._compute_tfidf_vector(text)
        else:
            try:
                embedding = self.model.encode(text, convert_to_numpy=True).tolist()
            except Exception as e:
                logger.error(f"SentenceTransformer encoding failed: {e}. Using TF-IDF fallback.")
                embedding = self._compute_tfidf_vector(text)

        cache_service.set_embedding(text, embedding)
        return embedding

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self.get_embedding(t) for t in texts]

    def _compute_tfidf_vector(self, text: str) -> List[float]:
        """
        Lightweight fallback embedding generator that creates a normalized frequency vector.
        Acts as a pseudo-embedding space of 384 dimensions (matching MiniLM).
        """
        import hashlib
        words = text.lower().split()
        vector = [0.0] * 384
        if not words:
            return vector
            
        for w in words:
            # Hash word to a index in [0, 383] to simulate a vocabulary index
            idx = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16) % 384
            vector[idx] += 1.0
            
        # Normalize vector
        magnitude = sum(x*x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
            
        return vector

# Singleton instance
embedding_service = EmbeddingService()
