from fastapi import APIRouter, HTTPException
from app.schemas.application_schema import ApplicantData
from app.schemas.prediction_schema import PredictionResponse, RecourseResponse
from app.services.inference_service import predict_applicant, recourse_applicant

router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantData):
    try:
        return predict_applicant(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recourse", response_model=RecourseResponse)
def recourse(applicant: ApplicantData):
    try:
        return recourse_applicant(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))