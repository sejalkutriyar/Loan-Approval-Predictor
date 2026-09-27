from fastapi import APIRouter, HTTPException
from app.schemas.application_schema import ApplicantData
from app.schemas.prediction_schema import PredictionResponse
from app.services.inference_service import predict_applicant

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantData):
    try:
        result = predict_applicant(applicant.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")