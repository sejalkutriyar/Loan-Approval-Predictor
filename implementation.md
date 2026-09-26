# Loan Approval Predictor (ANN) — Implementation Plan & Project Status

> This document serves two purposes:
> 1. A **checklist** of what's done and what's left, to track progress against the PRD.
> 2. A **context prompt** — if this needs to be handed to another developer, mentor, or AI assistant to continue work, this file alone explains the full project and current state.

---

## 1. Project Summary

**Title:** Loan Approval Predictor (ANN) — AI-Assisted Decision Support System for Loan Officers
**Track:** Advanced Data Science (OJT)
**Domain:** Fintech / Lending
**Grounding Paper:** "Deep Learning" — Nature, 2015 (LeCun, Bengio, Hinton)

**What we're building:** A full-stack, AI-powered decision-support system for loan officers. Not just a model — a deployable app (FastAPI backend + React frontend) where an officer submits an applicant's details and receives an Approve / Reject / Needs Manual Review decision, backed by:
- Two compared model architectures (baseline ANN vs. attention-based TabTransformer)
- SHAP-based reason codes (why the decision was made)
- DiCE-based counterfactual recourse (what to change to get approved)
- Calibrated, uncertainty-aware confidence scores (Monte Carlo Dropout + Platt scaling)
- Fairness auditing, role-based auth, and an audit trail

**Dataset (note: upgraded from original PRD):** Home Credit Default Risk (Kaggle competition), `application_train.csv` — 307,511 rows, 122 columns, later reduced to 72 columns after preprocessing. Target: `TARGET` (0 = repaid, 1 = defaulted), ~92:8 class imbalance.

**Important constraint:** The PRD has already been approved by the mentor and is **not being edited further**. This implementation file tracks actual build progress; it does not replace or modify the PRD.

---

## 2. What's Already Done ✅ (Kaggle Notebook Phase — COMPLETE)

All of this happened in Kaggle Notebooks (using free GPU), and is saved in `notebooks/training_pipeline.ipynb` in the repo.

- [x] Dataset acquired from Kaggle (`application_train.csv`)
- [x] Missing-value analysis — columns with >40% missing dropped (49 columns dropped, 73 remained)
- [x] Remaining missing values imputed (mode for categorical, median for numerical)
- [x] `SK_ID_CURR` (ID column) dropped
- [x] One-hot encoding applied (for ANN) → 171 features
- [x] Label encoding + embeddings prepared (for TabTransformer) — 12 categorical, 59 numerical columns
- [x] StandardScaler applied to numerical features
- [x] Class imbalance handled via **class-weighted loss** (SMOTE evaluated but not used — dataset too large, would balloon training time)
- [x] Stratified train/validation split (80/20), `random_state=42` for reproducibility
- [x] **Baseline ANN trained** (128→64→32, ReLU, BatchNorm, Dropout) — ROC-AUC: 0.7407, F1: 0.2584
- [x] **TabTransformer trained** (embeddings + 2-layer self-attention) — ROC-AUC: 0.7459, F1: 0.2595
- [x] **Ablation study completed and documented**: TabTransformer showed marginal improvement but significant training instability (val loss fluctuated 1.1–5.3 across epochs). **Decision: Baseline ANN promoted to production** — more robust, negligible accuracy trade-off doesn't justify instability.
- [x] Both trained models saved: `best_ann_model.pt`, `best_tabtransformer_model.pt`
- [x] **SHAP explainability** implemented and tested (KernelExplainer) — generates ranked reason codes per applicant
- [x] **DiCE counterfactual recourse** implemented and tested — generates 2-3 alternative profiles per rejected applicant (⚠️ known issue: needs feature constraints refined — one test case suggested an unrealistic change to `CNT_CHILDREN`; must add `permitted_range` constraints before production use)
- [x] **Monte Carlo Dropout** implemented — 50 stochastic forward passes to estimate uncertainty
- [x] **Platt scaling calibration** implemented — raw probabilities calibrated against validation set
- [x] Model files (`.pt`) and notebook downloaded and moved into project repo structure

**Everything above is proof-of-concept / validated in the notebook. Nothing further needs to be added to the notebook.**

---

## 3. What's Left To Do ⏳ (VS Code Phase — STARTING NOW)

All of this happens in VS Code, building the actual FastAPI + React application described in the PRD (Section 3.3.4 module structure).

### 3.1 Project Setup
- [x] Folder structure created (`app/models`, `app/routers`, `app/services`, `app/schemas`, `app/db`, `app/core`, `notebooks/`)
- [x] Trained model files placed in `app/models/`
- [x] Training notebook placed in `notebooks/`
- [ ] `requirements.txt` created
- [ ] `.gitignore` created
- [ ] `README.md` written
- [ ] Git repo initialized and pushed to GitHub

### 3.2 Model Layer (`app/models/`)
- [x] `ann_model.py` — LoanANN class written (matches trained architecture)
- [ ] `preprocessing.py` — reusable preprocessing pipeline (imputation logic, encoders, scaler) saved/loaded via `joblib` or `pickle`, so a new applicant's data is transformed identically to training data
- [ ] Save fitted `StandardScaler` and encoders from the notebook as `.pkl` files, move into `app/models/`

### 3.3 Schemas (`app/schemas/`)
- [ ] `application_schema.py` — Pydantic model for incoming applicant data (all fields from the dataset)
- [ ] `prediction_schema.py` — Pydantic model for the response (decision, confidence, uncertainty_score, reason_codes, counterfactuals, model_version)

### 3.4 Services (`app/services/`)
- [ ] `inference_service.py` — loads the ANN model, applies preprocessing, returns raw prediction
- [ ] `uncertainty_service.py` — runs MC Dropout (50 passes), returns mean + uncertainty
- [ ] `calibration_service.py` — applies fitted Platt scaling to raw probability
- [ ] `shap_service.py` — loads SHAP explainer, returns ranked reason codes for a given input
- [ ] `dice_service.py` — generates counterfactual recourse (**with proper feature constraints this time** — immutable: gender, marital status; bounded: income, credit amount, children within realistic ranges)
- [ ] `fairness_service.py` — computes demographic parity / equal opportunity metrics across stored predictions

### 3.5 Database (`app/db/`)
- [ ] `models.py` — SQLAlchemy ORM models for `users`, `applications`, `predictions`, `audit_log` tables (per PRD Section 3.3.1 schema)
- [ ] `session.py` — DB connection/session setup (start with SQLite for local dev, PostgreSQL later)
- [ ] Alembic migrations set up (optional but recommended)

### 3.6 Core (`app/core/`)
- [ ] `config.py` — environment variables (DB URL, secret keys, model paths)
- [ ] `security.py` — JWT token creation/verification, password hashing

### 3.7 Routers / API Endpoints (`app/routers/`)
- [ ] `auth.py` — `POST /api/v1/auth/login`
- [ ] `predict.py` — `POST /api/v1/predict` (the core endpoint — chains validation → inference → uncertainty → calibration → SHAP → DiCE → DB write → response), plus `POST /api/v1/predict/batch`
- [ ] `metrics.py` — `GET /api/v1/metrics`, `GET /api/v1/health`
- [ ] `fairness.py` — `GET /api/v1/fairness-report`

### 3.8 Main App
- [ ] `app/main.py` — FastAPI app instance, includes all routers, CORS setup for frontend

### 3.9 Testing (`tests/`)
- [ ] Unit tests for preprocessing pipeline
- [ ] Unit tests for each endpoint (valid input → correct schema, invalid input → 4xx)
- [ ] Integration test: full request → validation → inference → reason-code generation

### 3.10 Frontend (React) — separate `frontend/` folder, to start after backend core works
- [ ] React app scaffold (Vite or CRA) + Tailwind CSS setup
- [ ] Officer workspace: application form + decision result view
- [ ] Admin workspace: analytics dashboard (Accuracy/F1/confusion matrix/ROC curve) + fairness report view
- [ ] Axios integration with backend API
- [ ] JWT-based login flow (officer vs admin roles)

### 3.11 Deployment (Month 3, per PRD milestones)
- [ ] Dockerfiles for backend and frontend
- [ ] `docker-compose.yml` for local full-stack runs
- [ ] GitHub Actions CI/CD (lint + pytest on push, build on merge to main)
- [ ] Deploy backend (Render/Railway) and frontend (Vercel)

---

## 4. Known Issues / Things to Fix Along the Way

1. **DiCE feature constraints not yet set** — current implementation can suggest unrealistic changes (e.g., number of children). Must add `permitted_range` and immutable-feature lists before this is production-ready.
2. **KernelExplainer (SHAP) is slow** — fine for demo/testing on small samples, but for real-time `/predict` latency (<300ms target per PRD), may need to switch to a faster SHAP explainer or precompute background data more efficiently.
3. **MC Dropout adds latency** (50 passes per prediction) — will need benchmarking against the 300ms target once wired into the API; may need to reduce passes or optimize batching (this was already flagged as a risk in the PRD).
4. **EXT_SOURCE_2 / EXT_SOURCE_3 SHAP direction** looked slightly counter-intuitive in initial testing (showed as "increases risk" when normally higher external credit scores reduce risk) — worth a quick sanity check on sign conventions when SHAP is wired into the actual service.

---

## 5. How to Resume This Project (Context for a New Session / New Developer)

*If you're picking this project up fresh, here's everything you need to know:*

This is a 3-month OJT project building a full-stack loan approval decision-support system. The **PRD is finalized and approved — do not modify it.** The **data science / model training phase is complete** (see Section 2 above) — a baseline ANN was trained on the Home Credit Default Risk dataset (307K rows), compared against a TabTransformer via ablation study, and the ANN was promoted to production due to better training stability at nearly identical accuracy (ROC-AUC 0.74). SHAP, DiCE, MC Dropout, and calibration were all validated in a Kaggle notebook (`notebooks/training_pipeline.ipynb`), and the trained model weights (`best_ann_model.pt`, `best_tabtransformer_model.pt`) are saved in `app/models/`.

**The current phase is building the actual FastAPI + React application in VS Code**, following the checklist in Section 3 above, in order: preprocessing/schemas → services → database → routers → main app → tests → frontend → deployment. Work through Section 3's checkboxes top to bottom; each unchecked item is the next piece to build.

---

## 6. Quick Reference — Full Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Tailwind CSS, Axios |
| Backend | FastAPI |
| ML | PyTorch, scikit-learn, SHAP, DiCE |
| Database | PostgreSQL (SQLite for local dev) |
| Experiment tracking | MLflow (not yet integrated — future step) |
| Deployment | Docker, GitHub Actions, Render/Railway, Vercel |
