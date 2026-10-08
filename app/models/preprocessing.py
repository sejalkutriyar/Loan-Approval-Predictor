import joblib
import pandas as pd
import numpy as np
from pathlib import Path

MODELS_DIR = Path(__file__).parent

# Load saved preprocessing objects (loaded once when the app starts)
scaler = joblib.load(MODELS_DIR / "scaler.pkl")
feature_names = joblib.load(MODELS_DIR / "feature_names.pkl")
categorical_cols = joblib.load(MODELS_DIR / "categorical_cols.pkl")

_feature_set = set(feature_names)
_categorical_set = set(categorical_cols)


def preprocess_applicant(applicant_data: dict) -> np.ndarray:
    """
    Takes a single applicant's raw input (dict matching the Pydantic schema)
    and returns a model-ready, scaled numpy array.

    One-hot columns are built manually against the training-time feature_names.
    (pd.get_dummies on a single row is wrong: drop_first=True drops the only
    category present, so every dummy ended up 0 -> train/serve skew.)
    """
    # Start with every training feature at 0
    row = {name: 0.0 for name in feature_names}

    for col, value in applicant_data.items():
        if col in _categorical_set:
            dummy = f"{col}_{value}"
            # If this category was the dropped baseline in training, no column
            # exists and all its dummies correctly stay 0.
            if dummy in _feature_set:
                row[dummy] = 1.0
        elif col in _feature_set:
            row[col] = float(value)

    # Keep exact training column order
    df = pd.DataFrame([row], columns=feature_names)

    # Scale using the SAME fitted scaler from training (not fit again!)
    return scaler.transform(df)