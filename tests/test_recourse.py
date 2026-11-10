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


def test_recourse_not_needed_for_approved_applicant(prime_payload):
    """If an applicant is already Approved, recourse_needed must be False."""
    response = client.post("/api/v1/recourse", json=prime_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["recourse_needed"] is False
    assert len(data["counterfactuals"]) == 0


def test_recourse_borderline_applicant(borderline_payload):
    """Borderline applicant requires recourse and must receive valid suggestions inside the approval zone."""
    response = client.post("/api/v1/recourse", json=borderline_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["recourse_needed"] is True
    assert len(data["counterfactuals"]) > 0

    # Immutable attributes check: Demographic/protected features must NEVER change in recourse
    forbidden_features = {"CODE_GENDER", "DAYS_BIRTH"}

    for cf in data["counterfactuals"]:
        # New default risk target should land safely inside the Approved zone (<= 0.09)
        assert cf["new_default_probability"] <= 0.09
        for change in cf["changes"]:
            feat = change["feature"]
            assert feat not in forbidden_features, f"Protected feature {feat} was modified in recourse!"
            # Only allowed mutable features (reducible loans / improvable bureau scores)
            assert feat in {
                "AMT_CREDIT",
                "AMT_GOODS_PRICE",
                "AMT_ANNUITY",
                "EXT_SOURCE_2",
                "EXT_SOURCE_3",
            }


def test_recourse_suggested_change_leads_to_approval(borderline_payload):
    """End-to-end consistency: Applying the suggested recourse changes to /predict must yield 'Approved'."""
    rec_res = client.post("/api/v1/recourse", json=borderline_payload).json()
    assert rec_res["counterfactuals"], "Expected at least one counterfactual strategy"

    # Pick the first strategy
    strategy = rec_res["counterfactuals"][0]
    updated_applicant = dict(borderline_payload)
    for c in strategy["changes"]:
        updated_applicant[c["feature"]] = c["suggested"]

    pred_res = client.post("/api/v1/predict", json=updated_applicant).json()
    assert pred_res["decision"] == "Approved", (
        f"Expected Approved after applying recourse, got {pred_res['decision']} with p={pred_res['default_probability']}"
    )
    assert pred_res["default_probability"] <= 0.10

