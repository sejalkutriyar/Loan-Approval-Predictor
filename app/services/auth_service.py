import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from pymongo.errors import DuplicateKeyError

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


class UsernameTakenError(Exception):
    """Raised when a sign-up username collides with an existing account."""


class RegistrationUnavailableError(Exception):
    """Raised when the user store cannot be reached during sign-up."""


def create_user(
    username: str,
    full_name: str,
    email: str,
    password: str,
) -> Dict[str, Any]:
    """Creates and persists a new OFFICER account, returning the stored document."""
    normalized = username.strip().lower()

    if normalized in DEFAULT_USERS:
        raise UsernameTakenError(normalized)

    document = {
        "username": normalized,
        "hashed_password": hash_password(password),
        "role": UserRole.OFFICER.value,
        "full_name": full_name.strip(),
        "email": email.strip().lower(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        users_col = get_sync_db()["users"]
        if users_col.find_one({"username": normalized}):
            raise UsernameTakenError(normalized)
        users_col.insert_one(document)
    except UsernameTakenError:
        raise
    except DuplicateKeyError as exc:
        raise UsernameTakenError(normalized) from exc
    except Exception as exc:
        logger.error(f"User registration failed: {exc}")
        raise RegistrationUnavailableError("Could not create the account.") from exc

    return document


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

