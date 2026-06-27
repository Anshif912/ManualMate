import os
import logging
import requests as req
from typing import Optional, Dict, Any

logger = logging.getLogger("uxverse.coach.slm")

class SLMService:
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.primary_model = os.getenv("OLLAMA_PRIMARY_MODEL", "qwen2.5:7b")
        self.secondary_model = os.getenv("OLLAMA_SECONDARY_MODEL", "llama3.2")
        
        # Cloud fallback toggle (disabled by default)
        self.cloud_fallback_enabled = os.getenv("CLOUD_FALLBACK_ENABLED", "false").lower() == "true"
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")

    async def query_model(self, model: str, prompt: str, timeout: int = 6) -> Optional[str]:
        """Queries local Ollama for the specified model."""
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.55,
                "num_predict": 750
            }
        }
        
        try:
            logger.info(f"Ollama request dispatched to model '{model}' with timeout {timeout}s.")
            resp = req.post(self.ollama_url, json=payload, timeout=timeout)
            if resp.status_code == 200:
                response_text = resp.json().get("response", "").strip()
                if response_text:
                    return response_text
            else:
                logger.warning(f"Ollama returned status code: {resp.status_code}")
        except req.exceptions.RequestException as e:
            logger.warning(f"Failed to query Ollama model '{model}': {e}")
        except Exception as e:
            logger.error(f"Unexpected error in query_model: {e}")
        return None

    async def query_cloud_fallback(self, prompt: str) -> Optional[str]:
        """Optional Cloud Fallback (disabled by default)."""
        if not self.cloud_fallback_enabled:
            logger.info("Cloud fallback is disabled by configuration.")
            return None

        if not self.gemini_api_key:
            logger.warning("Cloud fallback enabled but GEMINI_API_KEY is not set.")
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 800
            }
        }
        
        try:
            logger.info("Dispatching fallback request to Gemini Cloud API...")
            resp = req.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                candidates = resp.json().get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            else:
                logger.warning(f"Gemini API returned status code: {resp.status_code}")
        except Exception as e:
            logger.error(f"Gemini Cloud fallback query failed: {e}")
        return None

# Singleton instance
slm_service = SLMService()
