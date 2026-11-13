from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.schemas.auth_schema import UserProfile
from app.services.fairness_service import generate_benchmark_fairness_report

router = APIRouter(tags=["Fairness & Bias Audit"])


@router.get("/fairness-report")
def get_fairness_report(current_user: UserProfile = Depends(get_current_user)):
    """
    Computes and returns algorithmic fairness and disparate impact metrics
    evaluated on sensitive attributes (Gender: Male vs Female).
    """
    return generate_benchmark_fairness_report()

