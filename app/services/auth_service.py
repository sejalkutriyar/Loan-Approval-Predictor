import logging
from typing import Optional, Dict, Any
from app.core.security import hash_password, verify_password
from app.core.database import get_sync_db
from app.schemas.auth_schema import UserRole, UserProfile

logger = logging.getLogger(__name__)

# Predefined in-memory fallback users for offline/testing resilience
DEFAULT_USERS: Dict[str, Dict[str, Any]] = {
    "sejal": {
        "username": "sejal",
        "hashed_password": hash_password("Sejal800"),
        "role": UserRole.OFFICER.value,
        "full_name": "Officer: Sejal Kumari",
        "email": "sejal@bank.internal",
    },
    "admin": {
        "username": "admin",
        "hashed_password": hash_password("Admin@123"),
        "role": UserRole.ADMIN.value,
        "full_name": "Chief Risk Officer (Admin)",
        "email": "admin@bank.internal",
    },
}


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Fetches user record from MongoDB, falling back to default seed users."""
    normalized = username.strip().lower()
    try:
        db = get_sync_db()
        users_col = db["users"]
        doc = users_col.find_one({"username": normalized})
        if doc:
            return doc
    except Exception as e:
        logger.warning(f"MongoDB lookup failed, using fallback in-memory store: {e}")

    # Fallback to in-memory store
    return DEFAULT_USERS.get(normalized)


def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Validates username and plaintext password. Returns user dict on success."""
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.get("hashed_password", "")):
        return None
    return user


def seed_default_users() -> int:
    """Seeds default officer and admin accounts into MongoDB Atlas 'users' collection."""
    try:
        db = get_sync_db()
        users_col = db["users"]
        count = 0
        for username, user_data in DEFAULT_USERS.items():
            existing = users_col.find_one({"username": username})
            if not existing:
                users_col.insert_one(user_data.copy())
                count += 1
            else:
                users_col.update_one(
                    {"username": username},
                    {"$set": {
                        "role": user_data["role"],
                        "full_name": user_data["full_name"],
                        "email": user_data["email"],
                    }}
                )
        return count
    except Exception as e:
        logger.error(f"Failed to seed users into MongoDB: {e}")
        return 0

