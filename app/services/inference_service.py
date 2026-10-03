import torch
from app.models.ann_model import load_production_model
from app.models.preprocessing import preprocess_applicant
from app.services.uncertainty_service import mc_dropout_predict
from app.services.calibration_service import calibrate_probability

_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_production_model(input_size=171)
    return _model


def predict_applicant(applicant_data: dict) -> dict:
    processed = preprocess_applicant(applicant_data)
    model = get_model()
    x = torch.FloatTensor(processed)

    # MC Dropout: mean probability + uncertainty
    raw_prob, uncertainty = mc_dropout_predict(model, x, n_passes=50)

    # Calibrate the mean probability
    calibrated_prob = calibrate_probability(raw_prob)

    # Decision thresholding (per PRD Section 3.3.3c)
    if calibrated_prob <= 0.4:
        decision = "Approved"
    elif calibrated_prob >= 0.6:
        decision = "Rejected"
    else:
        decision = "Needs Manual Review"

    # High uncertainty overrides to manual review, even if probability looks confident
    if uncertainty > 0.1:
        decision = "Needs Manual Review"

    return {
        "decision": decision,
        "confidence_score": round(calibrated_prob, 4),
        "uncertainty_score": round(uncertainty, 4),
        "model_version": "ANN-v1"
    }