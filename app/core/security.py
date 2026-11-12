import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-loan-approval-jwt-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours


def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Encodes a payload dictionary into a signed JWT."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token signature and expiration."""
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])

