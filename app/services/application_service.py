import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.database import get_sync_db


def _new_application_id() -> str:
    return f"APP-{uuid.uuid4().hex[:8].upper()}"


def _build_document(
    app_id: str,
    applicant_data: Dict[str, Any],
    prediction_result: Dict[str, Any],
    officer: str,
    created_at: str,
) -> Dict[str, Any]:
    return {
        "_id": app_id,
        "application_id": app_id,
        "created_at": created_at,
        "officer": officer,
        "applicant": applicant_data,
        "prediction": {
            "decision": prediction_result.get("decision"),
            "default_probability": prediction_result.get("default_probability"),
            "confidence_score": prediction_result.get("confidence_score"),
            "uncertainty_score": prediction_result.get("uncertainty_score"),
            "reason_codes": prediction_result.get("reason_codes", []),
            "model_version": prediction_result.get("model_version", "ANN-v1"),
        },
    }


def save_prediction_record(
    applicant_data: Dict[str, Any],
    prediction_result: Dict[str, Any],
    officer: str = "Officer: Sejal Kumari",
) -> Optional[str]:
    """
    Persists an applicant submission and its evaluated prediction to MongoDB.
    Returns the unique application_id, or None when the write failed.
    """
    app_id = _new_application_id()
    created_at = datetime.now(timezone.utc).isoformat()
    doc = _build_document(app_id, applicant_data, prediction_result, officer, created_at)

    try:
        get_sync_db()["applications"].insert_one(doc)
        return app_id
    except Exception as e:
        print(f"[warning] Failed to save application {app_id} to MongoDB: {e}")
        return None


def save_prediction_records(
    items: List[tuple],
    officer: str = "Officer: Sejal Kumari",
) -> List[Optional[str]]:
    """
    Persists a batch of (applicant_data, prediction_result) pairs in one round-trip.
    Returns application IDs aligned with the input; every entry is None if the write failed.
    """
    if not items:
        return []

    created_at = datetime.now(timezone.utc).isoformat()
    app_ids = [_new_application_id() for _ in items]
    docs = [
        _build_document(app_id, applicant_data, prediction_result, officer, created_at)
        for app_id, (applicant_data, prediction_result) in zip(app_ids, items)
    ]

    try:
        get_sync_db()["applications"].insert_many(docs, ordered=False)
        return app_ids
    except Exception as e:
        print(f"[warning] Failed to save {len(docs)} applications to MongoDB: {e}")
        return [None] * len(app_ids)


def get_recent_applications(
    limit: int = 50,
    skip: int = 0,
    officer: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetches recent loan applications for the audit table, optionally filtered by officer."""
    db = get_sync_db()
    query = {"officer": officer} if officer else {}
    cursor = db["applications"].find(query).sort("created_at", -1).skip(skip).limit(limit)

    records = []
    for doc in cursor:
        records.append({
            "id": doc.get("application_id", str(doc.get("_id"))),
            "created_at": doc.get("created_at"),
            "officer": doc.get("officer", "Officer: Sejal Kumari"),
            "applicant": doc.get("applicant", {}),
            "decision": doc.get("prediction", {}).get("decision"),
            "default_probability": doc.get("prediction", {}).get("default_probability"),
            "confidence_score": doc.get("prediction", {}).get("confidence_score"),
            "uncertainty_score": doc.get("prediction", {}).get("uncertainty_score"),
        })
    return records


def get_application_by_id(app_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single loan application by its ID."""
    db = get_sync_db()
    doc = db["applications"].find_one({"_id": app_id})
    if not doc:
        return None
    return {
        "id": doc.get("application_id", str(doc.get("_id"))),
        "created_at": doc.get("created_at"),
        "officer": doc.get("officer"),
        "applicant": doc.get("applicant"),
        "prediction": doc.get("prediction"),
    }
