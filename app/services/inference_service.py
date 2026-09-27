import torch
from app.models.ann_model import load_production_model
from app.models.preprocessing import preprocess_applicant

# Model ek baar load hoga jab app start hogi (baar baar load nahi hoga har request pe)
_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_production_model(input_size=171)
    return _model


def predict_applicant(applicant_data: dict) -> dict:
    """
    Takes raw applicant data, preprocesses it, runs it through the
    production ANN model, and returns a decision + confidence score.
    """
    processed = preprocess_applicant(applicant_data)
    model = get_model()

    x = torch.FloatTensor(processed)
    with torch.no_grad():
        output = model(x)
        prob = torch.sigmoid(output).item()

    # Thresholding (per PRD Section 3.3.3c)
    if prob <= 0.4:
        decision = "Approved"
    elif prob >= 0.6:
        decision = "Rejected"
    else:
        decision = "Needs Manual Review"

    return {
        "decision": decision,
        "confidence_score": round(prob, 4),
        "model_version": "ANN-v1"
    }