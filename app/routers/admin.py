from fastapi import APIRouter, Depends

from app.core.dependencies import require_role
from app.schemas.analytics_schema import AdminMetricsResponse
from app.schemas.auth_schema import UserProfile, UserRole
from app.services.analytics_service import build_admin_metrics

router = APIRouter(tags=["Admin Analytics"])


@router.get("/admin/metrics", response_model=AdminMetricsResponse)
def admin_metrics(
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
):
    """
    [Admin Only] Offline model evaluation (ROC-AUC, threshold metrics, confusion
    matrix, calibration) plus live application volumes from MongoDB.
    """
    return build_admin_metrics()
