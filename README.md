# Loan Approval Predictor (ANN)

AI-assisted decision-support system for loan officers — built with PyTorch, FastAPI, and React.

## Project Status
- ✅ Data preprocessing, baseline ANN training, TabTransformer ablation study complete (see `notebooks/`)
- ✅ SHAP, DiCE, MC Dropout + Calibration validated
- ✅ FastAPI backend + React frontend in progress

## Setup
1. `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `DB_NAME` and `JWT_SECRET` (generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`). `.env` must never be committed.
3. Start the API: `uvicorn app.main:app --reload --port 8000` (docs at `/docs`).
4. Start the UI: `cd frontend && npm install && npm run dev`.
5. Sign in with a seeded account (created automatically at startup): officer `sejal / Sejal800`, admin `admin / Admin@123`.
6. Run the tests: `python -m pytest -q`.

For model training details see `notebooks/training_pipeline.ipynb`; for the implementation checklist see `implementation.md`.