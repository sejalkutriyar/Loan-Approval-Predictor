import json
from pathlib import Path
import pytest
import numpy as np
from app.models.preprocessing import (
    preprocess_applicant,
    feature_names,
    categorical_cols,
    scaler,
)

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def prime_applicant():
    with open(ROOT / "prime.json", "r") as f:
        return json.load(f)


@pytest.fixture
def borderline_applicant():
    with open(ROOT / "borderline.json", "r") as f:
        return json.load(f)


def test_preprocessing_output_shape(prime_applicant):
    """Output array must be exactly 2D numpy array of shape (1, 171)."""
    processed = preprocess_applicant(prime_applicant)
    assert isinstance(processed, np.ndarray)
    assert processed.shape == (1, 171)
    assert processed.shape[1] == len(feature_names)


def test_preprocessing_no_nan_or_inf(borderline_applicant):
    """Output must contain valid scaled finite floats (no NaN or Inf)."""
    processed = preprocess_applicant(borderline_applicant)
    assert not np.isnan(processed).any()
    assert not np.isinf(processed).any()


def test_preprocessing_categorical_one_hot_encoding(prime_applicant):
    """Categorical features must be encoded correctly into one-hot dummy features."""
    processed = preprocess_applicant(prime_applicant)
    # prime.json has NAME_INCOME_TYPE: "Working"
    dummy_col = "NAME_INCOME_TYPE_Working"
    if dummy_col in feature_names:
        idx = feature_names.index(dummy_col)
        # Because scaler is applied, a present binary feature scaled value is > 0
        assert processed[0, idx] > 0


def test_preprocessing_unknown_category_fallback(prime_applicant):
    """Unknown/unseen category should not crash and should fallback safely (baseline 0)."""
    modified = prime_applicant.copy()
    modified["NAME_INCOME_TYPE"] = "UnknownNonExistentType123"
    processed = preprocess_applicant(modified)
    assert processed.shape == (1, 171)
    assert not np.isnan(processed).any()

