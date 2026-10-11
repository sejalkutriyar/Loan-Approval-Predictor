from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict

app = FastAPI(
    title="Loan Approval Predictor API",
    description="AI-assisted decision-support system for loan officers",
    version="1.0.0"
)

# Allow React dev server (Vite on port 5173) to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api/v1", tags=["Prediction"])


@app.get("/")
def root():
    return {"message": "Loan Approval Predictor API is running"}