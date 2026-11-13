from typing import List, Optional
from pydantic import BaseModel


class DecisionPolicy(BaseModel):
    approve_max: float
    reject_min: float
    uncertainty_max: float


class ThresholdMetrics(BaseModel):
    roc_auc: float
    accuracy: float
    precision: float
    recall: float
    f1_score: float


class ConfusionMatrix(BaseModel):
    """Counts at the 0.50 decision threshold; positive class = default."""

    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class ClassBalance(BaseModel):
    repaid: int
    defaults: int
    default_rate: float


class CalibrationPoint(BaseModel):
    max_probability: float
    share_of_applicants: float
    actual_default_rate: float


class PlattCalibration(BaseModel):
    method: str
    coefficient: float
    intercept: float
    brier_score: Optional[float] = None
    brier_note: str
    table: List[CalibrationPoint]


class FoldScore(BaseModel):
    roc_auc: float
    roc_auc_std: float
    f1_score: float
    f1_std: float
    recall: float
    precision: float


class CrossValidation(BaseModel):
    folds: int
    ann: FoldScore
    tab_transformer: FoldScore


class EvaluationSummary(BaseModel):
    dataset: str
    split: str
    threshold: float
    n_records: int
    metrics: ThresholdMetrics
    confusion_matrix: ConfusionMatrix
    class_balance: ClassBalance
    calibration: PlattCalibration
    cross_validation: CrossValidation


class OperationalSummary(BaseModel):
    total_applications: int
    approved: int
    needs_review: int
    rejected: int
    unclassified: int
    approval_rate: float
    average_default_probability: Optional[float] = None
    average_uncertainty: Optional[float] = None
    latest_application_at: Optional[str] = None
    database_available: bool


class AdminMetricsResponse(BaseModel):
    model_version: str
    decision_policy: DecisionPolicy
    evaluation: EvaluationSummary
    operational: OperationalSummary
