import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://seju020322_db_user:Sejal800@cluster0.bzjj50b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
)
DB_NAME = os.getenv("DB_NAME", "loan_approval_db")

_async_client = None
_sync_client = None


def get_async_db():
    """Returns async Motor database instance."""
    global _async_client
    if _async_client is None:
        _async_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _async_client[DB_NAME]


def get_sync_db():
    """Returns sync PyMongo database instance (for synchronous tasks or tests)."""
    global _sync_client
    if _sync_client is None:
        _sync_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _sync_client[DB_NAME]


# Collections:
# - applications: raw applicant feature dicts
# - predictions: decision, calibrated prob, uncertainty, reason codes
# - recourse_logs: requested and applied DiCE counterfactuals
# - audit_logs: administrative/officer audit trail

