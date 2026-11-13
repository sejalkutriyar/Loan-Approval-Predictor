from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

from app.core.config import DB_NAME, get_mongodb_uri

_async_client = None
_async_uri = None
_sync_client = None
_sync_uri = None


def get_async_db():
    """Returns async Motor database instance."""
    global _async_client, _async_uri
    uri = get_mongodb_uri()
    if _async_client is None or uri != _async_uri:
        _async_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        _async_uri = uri
    return _async_client[DB_NAME]


def get_sync_db():
    """Returns sync PyMongo database instance (for synchronous tasks or tests)."""
    global _sync_client, _sync_uri
    uri = get_mongodb_uri()
    if _sync_client is None or uri != _sync_uri:
        _sync_client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _sync_uri = uri
    return _sync_client[DB_NAME]


# Collections:
# - applications: raw applicant feature dicts
# - predictions: decision, calibrated prob, uncertainty, reason codes
# - recourse_logs: requested and applied DiCE counterfactuals
# - audit_logs: administrative/officer audit trail
