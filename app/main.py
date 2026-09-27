from fastapi import FastAPI
from app.routers import predict

app = FastAPI(
    title="Loan Approval Predictor API",
    description="AI-assisted decision-support system for loan officers",
    version="1.0.0"
)

app.include_router(predict.router, prefix="/api/v1", tags=["Prediction"])


@app.get("/")
def root():
    return {"message": "Loan Approval Predictor API is running"}