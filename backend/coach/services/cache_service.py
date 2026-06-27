import time
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("uxverse.coach.cache")

class CacheService:
    def __init__(self):
        # In-memory dictionaries for different cache scopes
        self._embedding_cache: Dict[str, Any] = {}
        self._prompt_cache: Dict[str, Any] = {}
        self._retrieval_cache: Dict[str, Any] = {}
        self._vector_cache: Dict[str, Any] = {}
        
        # Cache statistics for observability
        self.hits = 0
        self.misses = 0

    def get_embedding(self, text: str) -> Optional[Any]:
        if text in self._embedding_cache:
            self.hits += 1
            return self._embedding_cache[text]
        self.misses += 1
        return None

    def set_embedding(self, text: str, embedding: Any):
        self._embedding_cache[text] = embedding

    def get_prompt(self, key: str) -> Optional[str]:
        if key in self._prompt_cache:
            self.hits += 1
            return self._prompt_cache[key]
        self.misses += 1
        return None

    def set_prompt(self, key: str, prompt: str):
        self._prompt_cache[key] = prompt

    def get_retrieval(self, query: str) -> Optional[Any]:
        if query in self._retrieval_cache:
            self.hits += 1
            return self._retrieval_cache[query]
        self.misses += 1
        return None

    def set_retrieval(self, query: str, results: Any):
        self._retrieval_cache[query] = results

    def get_vector(self, key: str) -> Optional[Any]:
        if key in self._vector_cache:
            self.hits += 1
            return self._vector_cache[key]
        self.misses += 1
        return None

    def set_vector(self, key: str, value: Any):
        self._vector_cache[key] = value

    def clear_all(self):
        self._embedding_cache.clear()
        self._prompt_cache.clear()
        self._retrieval_cache.clear()
        self._vector_cache.clear()
        self.hits = 0
        self.misses = 0
        logger.info("Coach cache cleared successfully.")

    def get_metrics(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0.0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": round(hit_rate, 2),
            "embedding_cache_size": len(self._embedding_cache),
            "prompt_cache_size": len(self._prompt_cache),
            "retrieval_cache_size": len(self._retrieval_cache),
            "vector_cache_size": len(self._vector_cache)
        }

# Singleton instance
cache_service = CacheService()
