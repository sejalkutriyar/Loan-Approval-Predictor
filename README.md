# Loan Approval Predictor (ANN)

AI-assisted decision-support system for loan officers — built with PyTorch, FastAPI, and React.

## Project Status
- ✅ Data preprocessing, baseline ANN training, TabTransformer ablation study complete (see `notebooks/`)
- ✅ SHAP, DiCE, MC Dropout + Calibration validated
- ✅ FastAPI backend + React frontend with JWT auth, RBAC, XAI, fairness audit & admin analytics
- ✅ Docker containerization + GitHub Actions CI

## Setup
1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `DB_NAME` and `JWT_SECRET` (generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`). `.env` must never be committed.
3. Start the API: `uvicorn app.main:app --reload --port 8000` (docs at `/docs`).
4. Start the UI: `cd frontend && npm install && npm run dev`.
5. Sign in with a seeded account (created automatically at startup): officer `sejal / Sejal800`, admin `admin / Admin@123`.
6. Run the tests: `python -m pytest -q`.

## Run with Docker
The whole stack (FastAPI + Nginx-served React) runs with one command:

```bash
docker compose up --build
```

- Web UI: http://localhost:8080 (nginx proxies `/api/*` to the API container)
- API: http://localhost:8000 (docs at `/docs`)
- `MONGODB_URI` is read from `.env`; if Atlas is unreachable, seeded demo users still work via the in-memory fallback. Always set a real `JWT_SECRET` outside local development.

`Dockerfile.backend` builds a CPU-only PyTorch image; `frontend/Dockerfile` is a two-stage build (Vite build → nginx with SPA fallback and API proxying).

## CI/CD
[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on every push/PR:
- **Backend tests**: Python 3.12 + CPU-only PyTorch against a MongoDB service container (`python -m pytest -q`)
- **Frontend build**: Node 20, `npm ci` + `npm run build`

For model training details see `notebooks/training_pipeline.ipynb`; for the implementation checklist see `implementation.md`.