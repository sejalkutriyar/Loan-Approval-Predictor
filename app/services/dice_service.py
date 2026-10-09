import joblib
import numpy as np
import pandas as pd
import torch
import dice_ml
from dice_ml import Dice
from pathlib import Path
from app.models.preprocessing import scaler, feature_names

MODELS_DIR = Path(__file__).parent.parent / "models"

# Features that may appear in a recourse suggestion.
#  - Loan terms can only be REDUCED (applicant can ask for a smaller loan).
#  - Credit scores can only IMPROVE (long-term: repayment behaviour over time).
# Gender, age, family, education etc. are never varied.
_REDUCIBLE = ["AMT_CREDIT", "AMT_GOODS_PRICE", "AMT_ANNUITY"]
_IMPROVABLE = ["EXT_SOURCE_2", "EXT_SOURCE_3"]
ACTIONABLE = _REDUCIBLE + _IMPROVABLE

_MIN_FRACTION = 0.5      # loan terms may drop to at most 50% of current
_MAX_SCORE_GAIN = 0.4    # a credit score may improve by at most +0.4 (capped at 1.0)

_platt = joblib.load(MODELS_DIR / "platt_calibrator.pkl")
_reference = pd.read_csv(MODELS_DIR / "dice_reference.csv")
_data = None

_idx = [feature_names.index(c) for c in ACTIONABLE]
_mean = scaler.mean_[_idx]
_scale = scaler.scale_[_idx]


def _get_data():
    global _data
    if _data is None:
        _data = dice_ml.Data(
            dataframe=_reference[ACTIONABLE + ["TARGET"]],
            continuous_features=ACTIONABLE,
            outcome_name="TARGET",
        )
    return _data


class _RecourseModel:
    """
    sklearn-style wrapper for DiCE. Holds the applicant's fully processed
    (scaled) vector fixed and only swaps in new values for ACTIONABLE columns.
    predict_proba is rescaled so DiCE's 0.5 boundary == our approve threshold.
    """

    def __init__(self, model, base_vec, approve_max):
        self.model = model
        self.base_vec = base_vec
        self.approve_max = approve_max

    def default_prob(self, raw_vals: np.ndarray) -> np.ndarray:
        X = np.tile(self.base_vec, (len(raw_vals), 1))
        X[:, _idx] = (raw_vals - _mean) / _scale
        self.model.eval()
        with torch.no_grad():
            raw = torch.sigmoid(self.model(torch.FloatTensor(X))).numpy().ravel()
        return _platt.predict_proba(raw.reshape(-1, 1))[:, 1]

    def predict_proba(self, X):
        df = X if isinstance(X, pd.DataFrame) else pd.DataFrame(X, columns=ACTIONABLE)
        p = self.default_prob(df[ACTIONABLE].to_numpy(dtype=float))
        q = np.clip(p / (2 * self.approve_max), 0, 1)   # p == approve_max -> 0.5
        return np.column_stack([1 - q, q])


def generate_recourse(model, applicant_data: dict, processed: np.ndarray,
                      approve_max: float, total_cfs: int = 3):
    """
    Returns up to total_cfs MINIMAL suggestions of the form
    {"changes": [{feature, current, suggested}], "new_default_probability": p}
    that move the applicant safely inside the Approved zone. Empty list if none found.
    """
    # Aim slightly INSIDE the approval zone: /predict averages 50 MC-Dropout passes,
    # while recourse uses one deterministic pass, so p can differ a little.
    target = approve_max * 0.90

    current = {c: float(applicant_data[c]) for c in ACTIONABLE}
    wrapper = _RecourseModel(model, processed.reshape(-1).copy(), target)
    std = {c: max(float(_reference[c].std()), 1e-9) for c in ACTIONABLE}

    def p_of(cand):
        return float(wrapper.default_prob(
            np.array([[cand[c] for c in ACTIONABLE]], dtype=float))[0])

    m = dice_ml.Model(model=wrapper, backend="sklearn", model_type="classifier")
    exp = Dice(_get_data(), m, method="random")

    query = pd.DataFrame([current])
    permitted = {}
    for c, v in current.items():
        if c in _IMPROVABLE:
            permitted[c] = [v, round(min(1.0, v + _MAX_SCORE_GAIN), 4)]
        else:
            permitted[c] = [round(v * _MIN_FRACTION, 2), v]

    result = exp.generate_counterfactuals(
        query,
        total_CFs=3,                 # 5 made random search take ~56 s
        desired_class=0,
        permitted_range=permitted,
        features_to_vary=ACTIONABLE,
        sample_size=2000,
        random_seed=42,
    )

    cfs_df = result.cf_examples_list[0].final_cfs_df
    if cfs_df is None or len(cfs_df) == 0:
        return []

    best = {}   # keyed by the set of changed features -> lowest-effort suggestion
    for _, row in cfs_df.iterrows():
        cand = {c: float(row[c]) for c in ACTIONABLE}
        if p_of(cand) > target:
            continue

        # Shrink each change toward the current value while staying inside the target
        for c in ACTIONABLE:
            if abs(cand[c] - current[c]) < 1e-9:
                continue
            lo, hi = 0.0, 1.0        # fraction of the suggested move we keep
            for _ in range(12):
                mid = (lo + hi) / 2
                trial = {**cand, c: current[c] + mid * (cand[c] - current[c])}
                if p_of(trial) <= target:
                    hi = mid
                else:
                    lo = mid
            cand[c] = current[c] + hi * (cand[c] - current[c])

        changes = []
        for c in ACTIONABLE:
            if abs(cand[c] - current[c]) / std[c] < 0.01:   # negligible -> drop
                continue
            digits = 2 if c in _REDUCIBLE else 4
            changes.append({"feature": c, "current": current[c],
                            "suggested": round(cand[c], digits)})
        if not changes:
            continue

        final = {c: current[c] for c in ACTIONABLE}
        final.update({ch["feature"]: ch["suggested"] for ch in changes})
        p_final = p_of(final)
        if p_final > target:
            continue

        effort = sum(abs(final[c] - current[c]) / std[c] for c in ACTIONABLE)
        key = tuple(sorted(ch["feature"] for ch in changes))
        if key not in best or effort < best[key][0]:
            best[key] = (effort, {"changes": changes,
                                  "new_default_probability": round(p_final, 4)})

    ranked = sorted(best.values(), key=lambda t: t[0])
    return [item for _, item in ranked[:total_cfs]]