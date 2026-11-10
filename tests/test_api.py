import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

ROOT = Path(__file__).resolve().parent.parent
client = TestClient(app)


@pytest.fixture
def prime_payload():
    with open(ROOT / "prime.json", "r") as f:
        return json.load(f)


@pytest.fixture
def borderline_payload():
    with open(ROOT / "borderline.json", "r") as f:
        return json.load(f)


@pytest.fixture
def high_risk_payload():
    with open(ROOT / "high_risk.json", "r") as f:
        return json.load(f)


def test_root_endpoint():
    """Verify that root endpoint responds with status 200."""
    response = client.get("/")
    assert response.status_code == 200
    assert "running" in response.json().get("message", "")


def test_predict_prime_applicant(prime_payload):
    """Prime applicant must be Approved with low default probability (p <= 0.10)."""
    response = client.post("/api/v1/predict", json=prime_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "Approved"
    assert data["default_probability"] <= 0.10
    assert 0.0 <= data["confidence_score"] <= 1.0
    assert data["uncertainty_score"] >= 0.0


def test_predict_borderline_applicant(borderline_payload):
    """Borderline applicant should land in Needs Manual Review zone (0.10 < p <= 0.20 or uncertainty > 0.10)."""
    response = client.post("/api/v1/predict", json=borderline_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "Needs Manual Review"
    assert 0.10 < data["default_probability"] <= 0.20


def test_predict_high_risk_applicant(high_risk_payload):
    """High-risk applicant must be Rejected (p > 0.20)."""
    response = client.post("/api/v1/predict", json=high_risk_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "Rejected"
    assert data["default_probability"] > 0.20


def test_shap_gender_exclusion(prime_payload, borderline_payload, high_risk_payload):
    """Ethical compliance check: CODE_GENDER must NEVER appear in reason codes."""
    for payload in [prime_payload, borderline_payload, high_risk_payload]:
        response = client.post("/api/v1/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        reason_codes = data.get("reason_codes", [])
        for rc in reason_codes:
            assert not rc["factor"].startswith("CODE_GENDER"), (
                f"Gender attribute leaked in reason codes: {rc['factor']}"
            )


def test_predict_deterministic_seeds(borderline_payload):
    """Identical requests must yield identical numerical results (deterministic seeds)."""
    res1 = client.post("/api/v1/predict", json=borderline_payload).json()
    res2 = client.post("/api/v1/predict", json=borderline_payload).json()
    assert res1["default_probability"] == res2["default_probability"]
    assert res1["uncertainty_score"] == res2["uncertainty_score"]
    assert res1["decision"] == res2["decision"]

