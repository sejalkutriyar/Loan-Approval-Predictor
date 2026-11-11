from fastapi import APIRouter
from app.services.fairness_service import generate_benchmark_fairness_report

router = APIRouter(tags=["Fairness & Bias Audit"])


@router.get("/fairness-report")
def get_fairness_report():
    """
    Computes and returns algorithmic fairness and disparate impact metrics
    evaluated on sensitive attributes (Gender: Male vs Female).
    """
    return generate_benchmark_fairness_report()

