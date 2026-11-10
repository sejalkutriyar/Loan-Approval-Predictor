from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.application_schema import ApplicantData
from app.schemas.prediction_schema import (
    PredictionResponse,
    RecourseResponse,
    BatchPredictionResponse,
)
from app.services.inference_service import (
    predict_applicant,
    recourse_applicant,
    predict_batch_applicants,
)

router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantData):
    try:
        return predict_applicant(applicant.model_dump())
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
        return predict_batch_applicants(data_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recourse", response_model=RecourseResponse)
def recourse(applicant: ApplicantData):
    try:
        return recourse_applicant(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
