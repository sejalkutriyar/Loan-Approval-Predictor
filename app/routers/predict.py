from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
from app.schemas.application_schema import ApplicantData
from app.schemas.prediction_schema import (
    PredictionResponse,
    RecourseResponse,
    BatchPredictionResponse,
    ApplicationRecord,
)
from app.schemas.auth_schema import UserProfile, UserRole
from app.core.dependencies import get_current_user, require_role
from app.services.inference_service import (
    predict_applicant,
    recourse_applicant,
    predict_batch_applicants,
)
from app.services.application_service import (
    save_prediction_record,
    get_recent_applications,
    get_application_by_id,
)

router = APIRouter(tags=["Prediction & Applications"])


@router.post("/predict", response_model=PredictionResponse)
def predict(
    applicant: ApplicantData,
    current_user: UserProfile = Depends(get_current_user),
):
    """Evaluates applicant default risk with 50-pass MC Dropout uncertainty and SHAP attribution."""
    try:
        app_dict = applicant.model_dump()
        result = predict_applicant(app_dict)
        # Automatically persist to MongoDB with the logged-in officer's name
        app_id = save_prediction_record(app_dict, result, officer=current_user.full_name)
        result["application_id"] = app_id
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(
    applicants: List[ApplicantData],
    current_user: UserProfile = Depends(get_current_user),
):
    """Processes bulk loan applicants (1-100 batch limit) with parallelized inference."""
    if len(applicants) == 0:
        raise HTTPException(status_code=400, detail="Applicant list cannot be empty.")
    if len(applicants) > 100:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 100 applicants.")
    try:
        data_list = [app.model_dump() for app in applicants]
        batch_res = predict_batch_applicants(data_list)
        # Persist batch items with IDs associated with current officer
        for item, raw_app in zip(batch_res["predictions"], data_list):
            app_id = save_prediction_record(raw_app, item, officer=current_user.full_name)
            item["application_id"] = app_id
        return batch_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recourse", response_model=RecourseResponse)
def recourse(
    applicant: ApplicantData,
    current_user: UserProfile = Depends(get_current_user),
):
    """Generates DiCE actionable counterfactuals to guide rejected applicants towards approval."""
    try:
        return recourse_applicant(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications", response_model=List[ApplicationRecord])
def list_applications(
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Retrieves recent loan applications saved in MongoDB for audit history.
    - Officers view only their own submitted applications.
    - Admins view the full organization audit history.
    """
    try:
        officer_filter = current_user.full_name if current_user.role == UserRole.OFFICER else None
        return get_recent_applications(limit=limit, skip=skip, officer=officer_filter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications/{application_id}")
def get_application(
    application_id: str,
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
):
    """
    [Admin Only] Retrieves full audit dossier of a specific loan application.
    Enforces RBAC restriction (HTTP 403 Forbidden for non-admins).
    """
    record = get_application_by_id(application_id)
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")
    return record
