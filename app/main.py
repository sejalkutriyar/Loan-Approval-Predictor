import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_cors_origins
from app.routers import predict, health, fairness, auth, admin
from app.services.auth_service import seed_default_users

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Seeds the default accounts without preventing the API from starting."""
    try:
        seed_default_users()
    except Exception as exc:  # MongoDB unreachable: fallback users still allow sign-in
        logger.warning("Could not seed default users into MongoDB: %s", exc)
    yield


app = FastAPI(
    title="Loan Approval Predictor API",
    description="AI-assisted decision-support system for loan officers with RBAC & XAI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: configurable through CORS_ORIGINS, defaulting to local Vite origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1", tags=["Prediction"])
app.include_router(health.router, prefix="/api/v1", tags=["Health & Telemetry"])
app.include_router(fairness.router, prefix="/api/v1", tags=["Fairness & Bias Audit"])
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Loan Approval Predictor API is running"}
