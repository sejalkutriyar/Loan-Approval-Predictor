import joblib
import pandas as pd
import numpy as np
from pathlib import Path

MODELS_DIR = Path(__file__).parent

# Load saved preprocessing objects (loaded once when the app starts)
scaler = joblib.load(MODELS_DIR / "scaler.pkl")
feature_names = joblib.load(MODELS_DIR / "feature_names.pkl")
categorical_cols = joblib.load(MODELS_DIR / "categorical_cols.pkl")


def preprocess_applicant(applicant_data: dict) -> np.ndarray:
    """
    Takes a single applicant's raw input (as a dict, matching the Pydantic schema)
    and transforms it into a model-ready, scaled numpy array —
    using the exact same encoding and scaling fitted during training.
    """
    df = pd.DataFrame([applicant_data])

    # One-hot encode categorical columns (same as training)
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

    # Align columns exactly with training-time feature order.
    # Any missing dummy column (e.g., a category not present in this single row) gets filled with 0.
    df_encoded = df_encoded.reindex(columns=feature_names, fill_value=0)

    # Scale using the SAME fitted scaler from training (not fit again!)
    scaled = scaler.transform(df_encoded)

    return scaled