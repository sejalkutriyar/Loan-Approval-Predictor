import json
import torch
from app.models.preprocessing import preprocess_applicant, scaler, feature_names
from app.services.inference_service import get_model
from app.services.dice_service import _platt

a = json.load(open("borderline.json"))
base = preprocess_applicant(a).reshape(-1)
model = get_model()
model.eval()


def p_of(changes):
    """Calibrated default probability after changing raw feature values."""
    x = base.copy()
    for f, v in changes.items():
        i = feature_names.index(f)
        x[i] = (v - scaler.mean_[i]) / scaler.scale_[i]
    with torch.no_grad():
        raw = torch.sigmoid(model(torch.FloatTensor(x).unsqueeze(0))).item()
    return _platt.predict_proba([[raw]])[0][1]


LOAN = ["AMT_CREDIT", "AMT_GOODS_PRICE", "AMT_ANNUITY"]

print("current p:", round(p_of({}), 4))
for frac in [1.0, 0.8, 0.6, 0.5]:
    ch = {f: a[f] * frac for f in LOAN}
    print(f"loan values x{frac}: p = {p_of(ch):.4f}")

print("--- loan x0.5 PLUS higher income ---")
for mult in [1.0, 1.5, 2.0, 3.0]:
    ch = {f: a[f] * 0.5 for f in LOAN}
    ch["AMT_INCOME_TOTAL"] = a["AMT_INCOME_TOTAL"] * mult
    print(f"income x{mult}: p = {p_of(ch):.4f}")