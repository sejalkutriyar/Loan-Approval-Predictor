from pydantic import BaseModel
from typing import List


class ReasonCode(BaseModel):
    factor: str
    impact: float
    direction: str


class CounterfactualChange(BaseModel):
    feature: str
    current: float
    suggested: float


class Counterfactual(BaseModel):
    changes: List[CounterfactualChange]
    new_default_probability: float


class PredictionResponse(BaseModel):
    decision: str
    default_probability: float
    confidence_score: float
    uncertainty_score: float
    reason_codes: List[ReasonCode] = []
    explanation_available: bool = True
    model_version: str = "ANN-v1"


class RecourseResponse(BaseModel):
    recourse_needed: bool
    default_probability: float
    counterfactuals: List[Counterfactual] = []
    message: str