import time
import threading
import torch
import numpy as np
from app.models.ann_model import load_production_model
from app.models.preprocessing import preprocess_applicant
from app.services.uncertainty_service import mc_dropout_predict
from app.services.calibration_service import calibrate_probability
from app.services.shap_service import explain_applicant

# Decision thresholds on the CALIBRATED default probability.
# Chosen from the validation calibration table (see notebook):
#   p <= 0.10 -> ~72% of applicants, observed default rate ~4.4%
#   p >  0.20 -> ~8% of applicants,  observed default rate ~27%
APPROVE_MAX = 0.10
REJECT_MIN = 0.20
UNCERTAINTY_MAX = 0.10   # above this the model is unsure -> human review

_model = None
_lock = threading.Lock()


def get_model():
    global _model
    if _model is None:
        _model = load_production_model(input_size=171)
    return _model


def predict_applicant(applicant_data: dict) -> dict:
    # One request at a time: MC Dropout and SHAP both change the shared
    # model's mode, so concurrent requests could interfere with each other.
    with _lock:
        t_start = time.perf_counter()

        processed = preprocess_applicant(applicant_data)
        model = get_model()
        x = torch.FloatTensor(processed)

        torch.manual_seed(42)
        np.random.seed(42)
        raw_prob, uncertainty = mc_dropout_predict(model, x, n_passes=50)
        calibrated_prob = float(calibrate_probability(raw_prob))
        uncertainty = float(uncertainty)

        if calibrated_prob <= APPROVE_MAX:
            decision = "Approved"
        elif calibrated_prob > REJECT_MIN:
            decision = "Rejected"
        else:
            decision = "Needs Manual Review"
        if uncertainty > UNCERTAINTY_MAX:
            decision = "Needs Manual Review"

        # SHAP: if it fails, still return the decision (PRD Section 5.2)
        reason_codes, explanation_available = [], True
        try:
            t0 = time.perf_counter()
            reason_codes = explain_applicant(model, processed)
            print(f"[timing] SHAP took {(time.perf_counter() - t0) * 1000:.0f} ms")
        except Exception as e:
            explanation_available = False
            print(f"[warning] SHAP failed: {e}")

        print(f"[timing] total predict took {(time.perf_counter() - t_start) * 1000:.0f} ms")

        return {
            "decision": decision,
            "default_probability": round(calibrated_prob, 4),
            "confidence_score": round(1 - calibrated_prob, 4),
            "uncertainty_score": round(uncertainty, 4),
            "reason_codes": reason_codes,
            "explanation_available": explanation_available,
            "model_version": "ANN-v1",
        }