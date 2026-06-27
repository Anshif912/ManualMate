import os
import json
import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger("uxverse.database")
logging.basicConfig(level=logging.INFO)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "uxverse_ai"
FALLBACK_FILE = "fallback_db.json"

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.use_fallback = False
        self._init_db()

    def _init_db(self):
        try:
            logger.info(f"Connecting to MongoDB at {MONGO_URI}...")
            self.client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            # Trigger connection check
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            logger.info("Successfully connected to MongoDB.")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.warning(f"Failed to connect to MongoDB: {e}. Falling back to local JSON database.")
            self.use_fallback = True
            self._init_fallback_file()

    def _init_fallback_file(self):
        if not os.path.exists(FALLBACK_FILE):
            with open(FALLBACK_FILE, "w") as f:
                json.dump({"audits": [], "pages": [], "users": []}, f, indent=2)
            logger.info(f"Created fallback database file: {FALLBACK_FILE}")

    def _read_fallback(self) -> Dict[str, List[Dict[str, Any]]]:
        try:
            with open(FALLBACK_FILE, "r") as f:
                data = json.load(f)
                if "users" not in data:
                    data["users"] = []
                return data
        except Exception as e:
            logger.error(f"Error reading fallback database: {e}")
            return {"audits": [], "pages": [], "users": []}

    # --- User Operations ---
    def save_user(self, user: Dict[str, Any]) -> str:
        if not self.use_fallback:
            try:
                self.db.users.replace_one({"email": user["email"]}, user, upsert=True)
                return user["email"]
            except Exception as e:
                logger.error(f"MongoDB save_user failed: {e}. Writing to fallback.")
                
        data = self._read_fallback()
        exists = False
        for idx, item in enumerate(data["users"]):
            if item["email"] == user["email"]:
                data["users"][idx] = user
                exists = True
                break
        if not exists:
            data["users"].append(user)
        self._write_fallback(data)
        return user["email"]

    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        if not self.use_fallback:
            try:
                return self.db.users.find_one({"email": email}, {"_id": 0})
            except Exception as e:
                logger.error(f"MongoDB get_user failed: {e}. Reading from fallback.")
                
        data = self._read_fallback()
        for item in data["users"]:
            if item["email"] == email:
                return item
        return None

    def _write_fallback(self, data: Dict[str, List[Dict[str, Any]]]):
        try:
            with open(FALLBACK_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing fallback database: {e}")

    # --- Audit Operations ---
    def save_audit(self, audit: Dict[str, Any]) -> str:
        try:
            return self._save_audit_safe(audit)
        except Exception as e:
            logger.exception("Fatal database save_audit failed")
            return audit.get("id", "")

    def _save_audit_safe(self, audit: Dict[str, Any]) -> str:
        if not self.use_fallback:
            try:
                # Update if exists, otherwise insert
                self.db.audits.replace_one({"id": audit["id"]}, audit, upsert=True)
                return audit["id"]
            except Exception as e:
                logger.error(f"MongoDB save_audit failed: {e}. Writing to fallback.")
                
        # Fallback implementation
        data = self._read_fallback()
        exists = False
        for idx, item in enumerate(data["audits"]):
            if item["id"] == audit["id"]:
                data["audits"][idx] = audit
                exists = True
                break
        if not exists:
            data["audits"].append(audit)
        self._write_fallback(data)
        return audit["id"]

    def get_audit(self, audit_id: str) -> Optional[Dict[str, Any]]:
        try:
            if not self.use_fallback:
                try:
                    return self.db.audits.find_one({"id": audit_id}, {"_id": 0})
                except Exception as e:
                    logger.error(f"MongoDB get_audit failed: {e}. Reading from fallback.")
                    
            data = self._read_fallback()
            for item in data["audits"]:
                if item["id"] == audit_id:
                    return item
            return None
        except Exception as e:
            logger.exception("Database get_audit failed")
            return None

    def list_audits(self) -> List[Dict[str, Any]]:
        if not self.use_fallback:
            try:
                return list(self.db.audits.find({}, {"_id": 0}))
            except Exception as e:
                logger.error(f"MongoDB list_audits failed: {e}. Reading from fallback.")
                
        data = self._read_fallback()
        return data["audits"]

    # --- Page Operations ---
    def save_pages(self, pages: List[Dict[str, Any]]) -> List[str]:
        if not self.use_fallback:
            try:
                for page in pages:
                    self.db.pages.replace_one(
                        {"audit_id": page["audit_id"], "url": page["url"]},
                        page,
                        upsert=True
                    )
                return [p["url"] for p in pages]
            except Exception as e:
                logger.error(f"MongoDB save_pages failed: {e}. Writing to fallback.")

        # Fallback implementation
        data = self._read_fallback()
        for page in pages:
            exists = False
            for idx, item in enumerate(data["pages"]):
                if item["audit_id"] == page["audit_id"] and item["url"] == page["url"]:
                    data["pages"][idx] = page
                    exists = True
                    break
            if not exists:
                data["pages"].append(page)
        self._write_fallback(data)
        return [p["url"] for p in pages]

    def get_pages_for_audit(self, audit_id: str) -> List[Dict[str, Any]]:
        if not self.use_fallback:
            try:
                return list(self.db.pages.find({"audit_id": audit_id}, {"_id": 0}))
            except Exception as e:
                logger.error(f"MongoDB get_pages_for_audit failed: {e}. Reading from fallback.")

        data = self._read_fallback()
        return [p for p in data["pages"] if p["audit_id"] == audit_id]

# Singleton instance
db = Database()
