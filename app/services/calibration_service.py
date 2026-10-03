import joblib
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "models"
platt_calibrator = joblib.load(MODELS_DIR / "platt_calibrator.pkl")


def calibrate_probability(raw_probability: float) -> float:
    """
    Applies the fitted Platt-scaling calibrator to a raw model probability,
    so the returned confidence is statistically reliable rather than a raw,
    potentially overconfident network output.
    """
    calibrated = platt_calibrator.predict_proba([[raw_probability]])[0][1]
    return float(calibrated)