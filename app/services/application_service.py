import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.database import get_sync_db


def save_prediction_record(
    applicant_data: Dict[str, Any],
    prediction_result: Dict[str, Any],
    officer: str = "Officer: Sejal Kumari",
) -> str:
    """
    Persists an applicant submission and its evaluated prediction to MongoDB.
    Returns the unique application_id.
    """
    app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    db = get_sync_db()

    doc = {
        "_id": app_id,
        "application_id": app_id,
        "created_at": now_iso,
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

    try:
        db["applications"].insert_one(doc)
    except Exception as e:
        print(f"[warning] Failed to save application to MongoDB: {e}")

    return app_id


def get_recent_applications(limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
    """Fetches recent loan applications for the audit table."""
    db = get_sync_db()
    cursor = db["applications"].find({}).sort("created_at", -1).skip(skip).limit(limit)

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

