"""Runtime configuration loaded from the environment (and a local .env file).

Import order matters: this module fills os.environ from .env on first import, so
database.py and security.py see the values without a third-party dotenv package.
"""
import os
import secrets
import warnings
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent


def _load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file(ROOT / ".env")

DB_NAME = os.getenv("DB_NAME", "loan_approval_db")

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:5174,http://127.0.0.1:5174,"
    "http://localhost:3000"
)


def get_mongodb_uri() -> str:
    """Returns the MongoDB connection string, failing loudly when unset."""
    uri = os.getenv("MONGODB_URI", "").strip()
    if not uri:
        raise RuntimeError(
            "MONGODB_URI is not configured. Add it to .env (see .env.example)."
        )
    return uri


def get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


_ephemeral_jwt_secret = secrets.token_urlsafe(48)
_jwt_warning_emitted = False


def get_jwt_secret() -> str:
    """Returns JWT_SECRET from the environment or a random per-process fallback."""
    global _jwt_warning_emitted
    secret = os.getenv("JWT_SECRET", "").strip()
    if secret:
        return secret
    if not _jwt_warning_emitted:
        warnings.warn(
            "JWT_SECRET is not set. Using a random per-process secret, so existing "
            "sessions will be invalidated on restart. Set JWT_SECRET in .env.",
            RuntimeWarning,
            stacklevel=2,
        )
        _jwt_warning_emitted = True
    return _ephemeral_jwt_secret
