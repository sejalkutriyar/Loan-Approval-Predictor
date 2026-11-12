from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, health, fairness, auth
from app.services.auth_service import seed_default_users

app = FastAPI(
    title="Loan Approval Predictor API",
    description="AI-assisted decision-support system for loan officers with RBAC & XAI",
    version="1.0.0"
)

# Allow React dev server (Vite on port 5173) to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initializes default users and collections in MongoDB."""
    seed_default_users()


app.include_router(auth.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1", tags=["Prediction"])
app.include_router(health.router, prefix="/api/v1", tags=["Health & Telemetry"])
app.include_router(fairness.router, prefix="/api/v1", tags=["Fairness & Bias Audit"])


@app.get("/")
def root():
    return {"message": "Loan Approval Predictor API is running"}
