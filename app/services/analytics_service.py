from typing import Any, Dict, List

from app.core.database import get_sync_db
from app.services.calibration_service import platt_calibrator
from app.services.inference_service import APPROVE_MAX, REJECT_MIN, UNCERTAINTY_MAX

# ---------------------------------------------------------------------------
# Offline evaluation snapshot.
#
# Captured from notebooks/training_pipeline.ipynb (validation split, n=61,503,
# single-pass checkpoint evaluation at the 0.50 threshold). These are the only
# stored evaluation numbers in the project; nothing here is recomputed from
# live traffic, because the API never sees ground-truth defaults.
# ---------------------------------------------------------------------------
_N_RECORDS = 61_503
_TRUE_NEGATIVES = 36_518
_FALSE_POSITIVES = 20_020
_FALSE_NEGATIVES = 1_473
_TRUE_POSITIVES = 3_492
_ROC_AUC = 0.7406
_DEFAULTS = _TRUE_POSITIVES + _FALSE_NEGATIVES
_REPAID = _TRUE_NEGATIVES + _FALSE_POSITIVES

# Cumulative calibration table from the validation set (implementation.md §2).
_CALIBRATION_TABLE: List[Dict[str, float]] = [
    {"max_probability": 0.05, "share_of_applicants": 0.478, "actual_default_rate": 0.0319},
    {"max_probability": 0.08, "share_of_applicants": 0.645, "actual_default_rate": 0.0392},
    {"max_probability": 0.10, "share_of_applicants": 0.719, "actual_default_rate": 0.0443},
    {"max_probability": 0.15, "share_of_applicants": 0.848, "actual_default_rate": 0.0561},
    {"max_probability": 0.20, "share_of_applicants": 0.920, "actual_default_rate": 0.0645},
    {"max_probability": 0.25, "share_of_applicants": 0.962, "actual_default_rate": 0.0711},
    {"max_probability": 0.30, "share_of_applicants": 0.985, "actual_default_rate": 0.0761},
]

_CV_ANN = {
    "roc_auc": 0.7391,
    "roc_auc_std": 0.0049,
    "f1_score": 0.2538,
    "f1_std": 0.0036,
    "recall": 0.674,
    "precision": 0.156,
}

_CV_TAB_TRANSFORMER = {
    "roc_auc": 0.7409,
    "roc_auc_std": 0.0050,
    "f1_score": 0.2591,
    "f1_std": 0.0043,
    "recall": 0.657,
    "precision": 0.161,
}


def _threshold_metrics() -> Dict[str, float]:
    precision = _TRUE_POSITIVES / (_TRUE_POSITIVES + _FALSE_POSITIVES)
    recall = _TRUE_POSITIVES / (_TRUE_POSITIVES + _FALSE_NEGATIVES)
    return {
        "roc_auc": _ROC_AUC,
        "accuracy": (_TRUE_POSITIVES + _TRUE_NEGATIVES) / _N_RECORDS,
        "precision": precision,
        "recall": recall,
        "f1_score": 2 * precision * recall / (precision + recall),
    }


def get_operational_summary() -> Dict[str, Any]:
    """
    Aggregates live application traffic in a single MongoDB round-trip.
    Returns an empty (but valid) summary when the database is unreachable so the
    dashboard can still render the offline model evaluation.
    """
    empty: Dict[str, Any] = {
        "total_applications": 0,
        "approved": 0,
        "needs_review": 0,
        "rejected": 0,
        "unclassified": 0,
        "approval_rate": 0.0,
        "average_default_probability": None,
        "average_uncertainty": None,
        "latest_application_at": None,
        "database_available": False,
    }

    try:
        facet = list(
            get_sync_db()["applications"].aggregate(
                [
                    {
                        "$facet": {
                            "by_decision": [
                                {"$group": {"_id": "$prediction.decision", "n": {"$sum": 1}}}
                            ],
                            "averages": [
                                {
                                    "$group": {
                                        "_id": None,
                                        "avg_p": {"$avg": "$prediction.default_probability"},
                                        "avg_u": {"$avg": "$prediction.uncertainty_score"},
                                    }
                                }
                            ],
                            "latest": [
                                {"$sort": {"created_at": -1}},
                                {"$limit": 1},
                                {"$project": {"_id": 0, "created_at": 1}},
                            ],
                        }
                    }
                ]
            )
        )
    except Exception as exc:
        print(f"[warning] Admin analytics could not read MongoDB: {exc}")
        return empty

    if not facet:
        return empty

    data = facet[0]
    counts = {"Approved": 0, "Needs Manual Review": 0, "Rejected": 0}
    total = 0
    unclassified = 0
    for row in data.get("by_decision", []):
        n = int(row.get("n", 0))
        total += n
        decision = row.get("_id")
        if decision in counts:
            counts[decision] += n
        else:
            unclassified += n

    averages = (data.get("averages") or [{}])[0]
    latest = (data.get("latest") or [{}])[0].get("created_at")

    avg_p = averages.get("avg_p")
    avg_u = averages.get("avg_u")

    return {
        "total_applications": total,
        "approved": counts["Approved"],
        "needs_review": counts["Needs Manual Review"],
        "rejected": counts["Rejected"],
        "unclassified": unclassified,
        "approval_rate": counts["Approved"] / total if total else 0.0,
        "average_default_probability": round(float(avg_p), 6) if avg_p is not None else None,
        "average_uncertainty": round(float(avg_u), 6) if avg_u is not None else None,
        "latest_application_at": latest if isinstance(latest, str) else None,
        "database_available": True,
    }


def build_admin_metrics() -> Dict[str, Any]:
    """Assembles the payload consumed by the admin analytics dashboard."""
    return {
        "model_version": "ANN-v1",
        "decision_policy": {
            "approve_max": APPROVE_MAX,
            "reject_min": REJECT_MIN,
            "uncertainty_max": UNCERTAINTY_MAX,
        },
        "evaluation": {
            "dataset": "Home Credit Default Risk — application_train",
            "split": "validation (20%)",
            "threshold": 0.50,
            "n_records": _N_RECORDS,
            "metrics": _threshold_metrics(),
            "confusion_matrix": {
                "true_positives": _TRUE_POSITIVES,
                "false_positives": _FALSE_POSITIVES,
                "true_negatives": _TRUE_NEGATIVES,
                "false_negatives": _FALSE_NEGATIVES,
            },
            "class_balance": {
                "repaid": _REPAID,
                "defaults": _DEFAULTS,
                "default_rate": _DEFAULTS / _N_RECORDS,
            },
            "calibration": {
                "method": "Platt scaling — logistic regression on MC-Dropout mean probabilities",
                "coefficient": float(platt_calibrator.coef_[0][0]),
                "intercept": float(platt_calibrator.intercept_[0]),
                "brier_score": None,
                "brier_note": (
                    "Not available: a Brier score needs held-out labels, which are not "
                    "bundled with the application. The calibration table and fitted "
                    "Platt parameters below are the stored validation evidence."
                ),
                "table": _CALIBRATION_TABLE,
            },
            "cross_validation": {
                "folds": 5,
                "ann": _CV_ANN,
                "tab_transformer": _CV_TAB_TRANSFORMER,
            },
        },
        "operational": get_operational_summary(),
    }
