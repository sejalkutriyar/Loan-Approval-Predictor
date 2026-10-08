import numpy as np
import torch
import shap
from pathlib import Path
from app.models.preprocessing import feature_names, categorical_cols

MODELS_DIR = Path(__file__).parent.parent / "models"
_background = np.load(MODELS_DIR / "shap_background.npy")
_explainer = None

# Never shown to the officer as a "reason":
#  - protected attributes (gender)
#  - process-timing fields that are not meaningful explanations
_EXCLUDED_PREFIXES = (
    "CODE_GENDER_",
    "WEEKDAY_APPR_PROCESS_START_",
    "HOUR_APPR_PROCESS_START",
)
_ONEHOT_PREFIXES = tuple(f"{c}_" for c in categorical_cols)
_MIN_IMPACT = 0.005   # ignore factors whose effect is essentially zero


def _get_explainer(model):
    """Builds the SHAP explainer once, on the first request."""
    global _explainer
    if _explainer is None:
        def predict_fn(x):
            model.eval()
            with torch.no_grad():
                return torch.sigmoid(model(torch.FloatTensor(x))).numpy().ravel()
        _explainer = shap.KernelExplainer(predict_fn, _background)
    return _explainer


def explain_applicant(model, processed: np.ndarray, top_k: int = 5):
    """
    Returns up to top_k factors driving this applicant's default-risk score.
    Positive SHAP value = pushes risk UP, negative = pushes risk DOWN.

    Skips: excluded/protected features, one-hot categories the applicant does
    NOT have, and factors with negligible impact.
    """
    explainer = _get_explainer(model)
    sv = explainer.shap_values(processed, nsamples=200, silent=True)
    vals = np.array(sv).reshape(-1)
    row = processed.reshape(-1)

    reasons = []
    for i in np.argsort(np.abs(vals))[::-1]:
        name = feature_names[i]
        if abs(vals[i]) < _MIN_IMPACT:
            break   # sorted by |impact|, so everything after is smaller
        if name.startswith(_EXCLUDED_PREFIXES):
            continue
        # After StandardScaler: raw 0 -> value <= 0, raw 1 -> value > 0
        if name.startswith(_ONEHOT_PREFIXES) and row[i] <= 0:
            continue
        reasons.append({
            "factor": name,
            "impact": round(float(vals[i]), 4),
            "direction": "increases_risk" if vals[i] > 0 else "decreases_risk",
        })
        if len(reasons) == top_k:
            break
    return reasons