from pydantic import BaseModel
from typing import List


class ReasonCode(BaseModel):
    factor: str
    impact: float
    direction: str


class PredictionResponse(BaseModel):
    decision: str
    default_probability: float   # calibrated P(default), e.g. 0.0856 = 8.56% risk
    confidence_score: float      # calibrated P(repay) = 1 - default_probability
    uncertainty_score: float
    reason_codes: List[ReasonCode] = []
    explanation_available: bool = True
    model_version: str = "ANN-v1"