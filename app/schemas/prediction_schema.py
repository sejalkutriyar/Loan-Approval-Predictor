from pydantic import BaseModel
from typing import List, Optional


class PredictionResponse(BaseModel):
    decision: str
    confidence_score: float
    model_version: str = "ANN-v1"