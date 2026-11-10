import os
import torch
from fastapi import APIRouter
from app.services.inference_service import get_model

router = APIRouter(tags=["Health & Telemetry"])


@router.get("/health")
def health_check():
    """Returns system status, device hardware, and loaded PyTorch model."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = get_model()
    is_model_loaded = model is not None

    telemetry = {
        "pid": os.getpid(),
    }

    try:
        import psutil
        process = psutil.Process(os.getpid())
        telemetry["process_memory_mb"] = round(process.memory_info().rss / (1024 * 1024), 2)
        telemetry["cpu_usage_percent"] = psutil.cpu_percent(interval=None)
    except ImportError:
        telemetry["note"] = "psutil optional for detailed memory usage"

    return {
        "status": "healthy",
        "service": "Loan Approval Predictor API",
        "version": "1.0.0",
        "model": {
            "name": "Production ANN",
            "version": "ANN-v1",
            "is_loaded": is_model_loaded,
            "input_features": 171,
            "device": device,
        },
        "telemetry": telemetry,
    }
