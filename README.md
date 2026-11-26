# Loan Approval Predictor (ANN)
### Production-Grade AI Decision-Support System for Loan Underwriting

[![CI](https://github.com/sejalkutriyar/Loan-Approval-Predictor/actions/workflows/ci.yml/badge.svg)](https://github.com/sejalkutriyar/Loan-Approval-Predictor/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel&logoColor=white)](https://loan-approval-predictor-two.vercel.app/)
[![API Backend](https://img.shields.io/badge/API%20Backend-Render-46E3B7?logo=render&logoColor=black)](https://loan-approval-predictor-kk73.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.14-blue?logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Production%20API-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## Executive Summary

**Loan Approval Predictor** is an enterprise AI decision-support platform designed for bank loan underwriting. Trained on the **Home Credit Default Risk** dataset (307,511 loan applications × 122 attributes), the system evaluates credit default risk, quantifies epistemic model uncertainty, explains individual decisions using Explainable AI (XAI), enforces real-world banking policy guardrails (FOIR / DTI limits), audits gender bias for regulatory compliance, and provides actionable counterfactual recourse for borderline or rejected borrowers.

**Live Deployments:**
* **Frontend Application (Vercel):** [https://loan-approval-predictor-two.vercel.app/](https://loan-approval-predictor-two.vercel.app/)
* **Backend API & Swagger Docs (Render):** [https://loan-approval-predictor-kk73.onrender.com/docs](https://loan-approval-predictor-kk73.onrender.com/docs)

---

## 🌟 Key Capabilities

### 1. Calibrated Neural Underwriting Engine
* **PyTorch Deep Neural Network (ANN):** 171-dimensional input space $\rightarrow$ 128 $\rightarrow$ 64 $\rightarrow$ 32 $\rightarrow$ 1 output neuron with ReLU, BatchNorm, and Dropout.
* **Platt Scaling:** Sigmoidal probability calibration trained via logistic regression, aligning raw model outputs with empirical default frequencies.
* **Epistemic Uncertainty Estimation:** 50-pass Monte Carlo Dropout measures predictive variance ($\sigma$) to route ambiguous applicants to human credit officers.
* **Decision Policies:**
  * $\le 10\%$ Calibrated Risk: **Approved**
  * $> 20\%$ Calibrated Risk: **Rejected**
  * $10\% - 20\%$ or $\sigma > 0.10$: **Needs Manual Review**

### 2. Underwriting Policy Guardrails (FOIR / DTI Knockout)
* **Institutional Credit Guardrails:** Machine learning default predictions are audited against institutional underwriting rules to prevent over-leveraging low-income applicants.
* **Fixed Obligation to Income Ratio (FOIR):**
  $$\text{FOIR} = \frac{\text{Annual EMI / Annuity}}{\text{Annual Income}}$$
* **Policy Hard Knockout Rules:**
  * **$\text{FOIR} > 100\%$:** Automatic **Rejection** (*"Underwriting Policy Knockout: Annual EMI exceeds 100% of annual income"*), superseding raw bureau credit scores.
  * **$\text{FOIR} \in [60\%, 100\%]$:** Routed to **Needs Manual Review** (*"Underwriting Policy Review: Annual EMI consumes >60% of income"*).

### 3. 💼 Purpose-Driven Loan Structuring & Reducing-Balance EMI
* **Categorical Loan Types:** Supports Car / Auto Loans, Home Loans, Education Loans, Business Loans, Consumer Durable Loans, and Personal Loans.
* **Dynamic Asset Valuation:** Asset price label, placeholder, and hint dynamically transform based on category (e.g., *Vehicle / car price* for auto loans, *Property / home price* for mortgages, *Course / institute fee* for education loans).
* **Automated Reducing-Balance EMI:** Real-time loan amortization based on custom tenure ($n = \text{years} \times 12$) and annual rate ($r = 9.5\%\text{ p.a.}$):
  $$\text{Monthly EMI} = \frac{P \cdot r \cdot (1+r)^n}{(1+r)^n - 1}$$

### 4. Explainable AI & Actionable Recourse
* **SHAP (KernelExplainer):** Identifies top contributing financial factors driving each decision (e.g. debt-to-income, annuity ratios, external bureau scores). Protected demographic attributes like gender are strictly excluded from reason codes.
* **DiCE Counterfactual & Policy Recourse:** Generates practical, human-actionable strategies to move applicants into the approval zone:
  * **Tenure Extension:** Recommends extending loan duration (e.g. from 2 to 4 years) to bring FOIR within the safe $\le 50\%$ banking limit.
  * **Loan Downsizing:** Suggests safe maximum borrowing limits aligned with debt-servicing capacity.

### 5. Responsible AI & Algorithmic Fairness Audit
* **EEOC Four-Fifths (80%) Rule Compliance:** Evaluates Demographic Parity Ratio:
  $$\text{Disparate Impact Ratio} = \frac{P(\text{Approved} \mid \text{Female})}{P(\text{Approved} \mid \text{Male})}$$
* Audited against Equal Credit Opportunity Act (ECOA) standards with a dedicated interactive audit modal in the UI.

### 6. Enterprise RBAC & Security
* **JWT Authentication:** Signed access tokens using `PyJWT` (HS256) and `bcrypt` password hashing.
* **Role-Based Access Control (RBAC):**
  * **Credit Officer:** Form intake, single and batch prediction, recourse guidance.
  * **Chief Risk Officer / Admin:** Full organizational audit history, system KPI metrics, confusion matrix, ROC-AUC analytics.

---

## System Architecture

```text
├── frontend/                   # Modern React 18 + Vite + Tailwind CSS Single-Page App
│   ├── src/components/         # Form, Result, Recourse, FairnessModal, Analytics, Login
│   ├── Dockerfile              # Multi-stage production build (Node 20 -> Nginx Alpine)
│   └── nginx.conf              # Reverse proxy (/api/* -> backend:8000) with SPA fallback
│
├── app/                        # FastAPI Enterprise Backend
│   ├── core/                   # Configuration, database drivers, JWT security, RBAC dependencies
│   ├── models/                 # PyTorch model definitions, preprocessing pipeline, weights (.pt, .pkl)
│   ├── schemas/                # Strict Pydantic schemas (Literals, validation, analytics, auth)
│   ├── services/               # Inference, MC Dropout, calibration, SHAP, DiCE, fairness, auth
│   └── routers/                # REST endpoints: /predict, /recourse, /health, /fairness-report, /auth, /admin
│
├── tests/                      # Automated PyTest Suite (43 unit & integration tests)
├── scripts/                    # Database seeding utilities (scripts/seed_users.py)
├── notebooks/                  # Kaggle data pipeline, EDA, 5-fold CV & TabTransformer ablation study
├── .github/workflows/          # Continuous Integration (pytest + mongo + npm build)
├── docker-compose.yml          # Single-command local orchestration
└── Dockerfile.backend          # CPU-optimized Python 3.12 container
```

---

## Model Evaluation & Benchmarks

| Metric | ANN (Production Model) | TabTransformer (Ablation) |
|---|:---:|:---:|
| **ROC-AUC (Validation)** | **0.7406** | 0.7409 |
| **5-Fold CV ROC-AUC** | **0.7391 ± 0.0049** | 0.7409 ± 0.0050 |
| **F1-Score** | **0.2538 ± 0.0036** | 0.2591 ± 0.0043 |
| **Recall** | **0.674** | 0.657 |
| **Input Features** | **171 (One-Hot Encoded)** | 71 (Embeddings + Numeric) |
| **Inference Latency** | **Fast & Stable** | Higher Memory Footprint |

---

## Quickstart Guide

### Option 1: Run with Docker Compose (Recommended)

Run the full stack (FastAPI + React via Nginx + Auto-Seeder) with one command:

```bash
docker compose up --build
```

* **Frontend Web UI:** [http://localhost:8080](http://localhost:8080)
* **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **API Telemetry:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### Option 2: Local Development Setup

#### 1. Backend Setup (FastAPI)
```bash
# Clone the repository
git clone https://github.com/sejalkutriyar/Loan-Approval-Predictor.git
cd Loan-Approval-Predictor

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT Secret

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Demo Credentials

Default accounts are seeded automatically on first startup:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Credit Officer** | `sejal` | `Sejal800` | Intake Form, Risk Scoring, DiCE Recourse |
| **Administrator** | `admin` | `Admin@123` | Intake + Analytics Dashboard & Full Audit History |

---

## Running Automated Tests

Run the complete 43-test automated test suite:

```bash
python -m pytest -v
```

```text
-- 43 passed, 5 warnings in 7.27s --
```

* **`tests/test_preprocessing.py`**: Shape verification, null handling, categorical encoding.
* **`tests/test_api.py`**: Prime, borderline, high-risk scoring, batch API, SHAP compliance.
* **`tests/test_recourse.py`**: DiCE optimization, actionable constraint verification.
* **`tests/test_auth.py`**: JWT issuance, expired tokens, role enforcement (HTTP 401 & 403).
* **`tests/test_admin_analytics.py`**: Confusion matrix consistency, Brier calibration, operational facets.

---

## 🛠️ Tech Stack

* **Machine Learning & XAI:** PyTorch, scikit-learn, SHAP, DiCE-ML, NumPy, Pandas
* **Backend API:** FastAPI, Uvicorn, Pydantic v2, PyJWT, bcrypt, Motor, PyMongo
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios
* **DevOps & Cloud:** Docker, Nginx, Docker Compose, GitHub Actions, MongoDB Atlas

---