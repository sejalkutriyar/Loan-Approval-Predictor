from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.schemas.application_schema import ApplicantData
from app.schemas.prediction_schema import (
    PredictionResponse,
    RecourseResponse,
    BatchPredictionResponse,
    ApplicationRecord,
)
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
def predict(applicant: ApplicantData):
    try:
        app_dict = applicant.model_dump()
        result = predict_applicant(app_dict)
        # Automatically persist to MongoDB
        app_id = save_prediction_record(app_dict, result)
        result["application_id"] = app_id
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(applicants: List[ApplicantData]):
    if len(applicants) == 0:
        raise HTTPException(status_code=400, detail="Applicant list cannot be empty.")
    if len(applicants) > 100:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 100 applicants.")
    try:
        data_list = [app.model_dump() for app in applicants]
        batch_res = predict_batch_applicants(data_list)
        # Persist batch items with IDs
        for item, raw_app in zip(batch_res["predictions"], data_list):
            app_id = save_prediction_record(raw_app, item)
            item["application_id"] = app_id
        return batch_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recourse", response_model=RecourseResponse)
def recourse(applicant: ApplicantData):
    try:
        return recourse_applicant(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications", response_model=List[ApplicationRecord])
def list_applications(
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
):
    """Retrieves recent loan applications saved in MongoDB for audit history."""
    try:
        return get_recent_applications(limit=limit, skip=skip)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications/{application_id}")
def get_application(application_id: str):
    """Retrieves a specific loan application and its prediction details from MongoDB."""
    record = get_application_by_id(application_id)
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")
    return record
