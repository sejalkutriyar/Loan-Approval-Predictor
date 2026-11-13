import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.main import app
from app.schemas.auth_schema import UserProfile, UserRole
from app.services import analytics_service

client = TestClient(app)

ADMIN = UserProfile(
    username="admin",
    role=UserRole.ADMIN,
    full_name="Administrator",
    email="admin@bank.internal",
)

OPERATIONAL = {
    "total_applications": 12,
    "approved": 5,
    "needs_review": 4,
    "rejected": 3,
    "unclassified": 0,
    "approval_rate": 5 / 12,
    "average_default_probability": 0.1417,
    "average_uncertainty": 0.0321,
    "latest_application_at": "2026-11-12T09:30:00+00:00",
    "database_available": True,
}


@pytest.fixture
def admin_response(monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: ADMIN
    monkeypatch.setattr(analytics_service, "get_operational_summary", lambda: dict(OPERATIONAL))
    return client.get("/api/v1/admin/metrics")


def test_admin_metrics_requires_admin_role():
    """The default test identity is an OFFICER, so the endpoint must return 403."""
    response = client.get("/api/v1/admin/metrics")
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_admin_metrics_returns_evaluation_and_operations(admin_response):
    assert admin_response.status_code == 200
    body = admin_response.json()

    evaluation = body["evaluation"]
    assert evaluation["split"].startswith("validation")
    assert evaluation["n_records"] == 61503
    assert evaluation["threshold"] == 0.5
    assert evaluation["metrics"]["roc_auc"] == pytest.approx(0.7406)
    assert body["operational"] == OPERATIONAL


def test_confusion_matrix_derived_metrics_are_consistent(admin_response):
    """Precision, recall and F1 must agree with the reported confusion matrix."""
    evaluation = admin_response.json()["evaluation"]
    cm = evaluation["confusion_matrix"]
    metrics = evaluation["metrics"]

    tp = cm["true_positives"]
    fp = cm["false_positives"]
    fn = cm["false_negatives"]
    tn = cm["true_negatives"]

    precision = tp / (tp + fp)
    recall = tp / (tp + fn)

    assert metrics["precision"] == pytest.approx(precision, abs=1e-6)
    assert metrics["recall"] == pytest.approx(recall, abs=1e-6)
    assert metrics["f1_score"] == pytest.approx(2 * precision * recall / (precision + recall), abs=1e-6)
    assert metrics["accuracy"] == pytest.approx((tp + tn) / evaluation["n_records"], abs=1e-6)
    assert cm == {
        "true_positives": 3492,
        "false_positives": 20020,
        "true_negatives": 36518,
        "false_negatives": 1473,
    }


def test_calibration_uses_fitted_platt_parameters(admin_response):
    calibration = admin_response.json()["evaluation"]["calibration"]

    assert len(calibration["table"]) == 7
    assert calibration["coefficient"] > 0
    assert calibration["intercept"] < 0
    # No held-out labels are shipped, so the API must not invent a Brier score.
    assert calibration["brier_score"] is None
    assert "not available" in calibration["brier_note"].lower()


def test_decision_policy_matches_inference_thresholds(admin_response):
    from app.services.inference_service import APPROVE_MAX, REJECT_MIN, UNCERTAINTY_MAX

    policy = admin_response.json()["decision_policy"]
    assert policy == {
        "approve_max": APPROVE_MAX,
        "reject_min": REJECT_MIN,
        "uncertainty_max": UNCERTAINTY_MAX,
    }
