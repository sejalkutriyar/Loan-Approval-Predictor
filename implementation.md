# Loan Approval Predictor (ANN) — Implementation Status & AI Handoff Prompt

> **Last updated:** 9 Oct 2026
> This file does two jobs:
> 1. A **status tracker** of what is built and what is left (vs. the approved PRD).
> 2. A **handoff prompt**: paste this whole file (or just Section 0) into any AI assistant / IDE agent (Claude, ChatGPT, Gemini, Antigravity, Cursor, Copilot…) and it will have full context to continue the project.

---

## 0. Copy-paste prompt for an AI assistant

```
You are helping me continue a project called "Loan Approval Predictor": an
AI-assisted decision-support system for loan officers (OJT project, Advanced
Data Science track). Read the full project context in implementation.md first.

Stack: PyTorch ANN, FastAPI backend, React frontend (not started yet).
Dataset: Home Credit Default Risk (307,511 rows). Backend is DONE and working
locally. NEXT TASK: build the React frontend (applicant form + result view +
on-demand "what would change this decision?" recourse panel), add CORS, then
DB / auth / fairness / metrics / tests / Docker.

Rules:
1. The PRD is approved and FROZEN. Never edit or contradict it.
2. Do not change app/models/preprocessing.py, the thresholds, or the seeds
   without explaining why (each was fixed after a real bug, see Section 4).
3. Never show gender (CODE_GENDER_*) as a reason code to the user.
4. Work step by step, give complete file contents (not partial diffs), and
   tell me how to test each step (Swagger at /docs, or the browser).
5. Explain simply; I am a student. I also need viva-ready explanations.
6. I use Windows + VS Code + PowerShell. Run the server with
   `python -m uvicorn app.main:app --reload` (plain `uvicorn` is not on PATH).
```

---

## 1. Project summary

| Item | Value |
|---|---|
| **Title** | Loan Approval Predictor (ANN) — AI-Assisted Decision Support System for Loan Officers |
| **Student** | Sejal Kumari (ID 240410700158) |
| **Track** | Advanced Data Science (OJT), mentor: Chennaveer Jogur Sir |
| **Domain** | Fintech / Lending |
| **Grounding paper** | "Deep Learning", Nature 2015 (LeCun, Bengio, Hinton) |
| **PRD** | **Approved and frozen. Do not edit.** |
| **Next milestone** | **Viva 2: 15–22 Oct 2026** (5-fold CV ✅, SHAP + DiCE in API ✅, React form/result screen ⏳ NEXT) |

**What it does:** a loan officer submits an applicant's details and receives a decision
(**Approved / Rejected / Needs Manual Review**) with:
- a **calibrated default probability** (Platt scaling on top of the ANN),
- an **uncertainty score** (Monte Carlo Dropout),
- **SHAP reason codes** (why the model decided this),
- **DiCE counterfactual recourse** (what minimal change would reach the approval zone), on demand.

**Features added after mentor feedback ("project too simple"):** TabTransformer ablation,
DiCE counterfactual recourse, MC Dropout + Platt calibration. Dataset was also upgraded to 307K rows ("lakh+").

---

## 2. Data & modelling (DONE — Kaggle notebook `notebooks/training_pipeline.ipynb`)

- **Dataset:** Home Credit Default Risk, `application_train.csv`, 307,511 rows × 122 columns.
  Target `TARGET` (0 = repaid, 1 = default), ~91.9 : 8.07 imbalance.
- **Cleaning:** 49 columns with >40% missing dropped (71 input columns remain after dropping `SK_ID_CURR`);
  mode (categorical) / median (numerical) imputation.
- **Encoding:** one-hot with `drop_first=True` → **171 features** (ANN). Label-encoding + embeddings for TabTransformer.
- **Scaling:** `StandardScaler` on all 171 features (fitted on training split only).
- **Imbalance:** class-weighted `BCEWithLogitsLoss(pos_weight≈11.39)`. SMOTE evaluated, rejected (too large).
- **Split:** stratified 80/20, `random_state=42`.
- **Models:**
  - ANN: 171 → 128 → 64 → 32 → 1 (ReLU, BatchNorm, Dropout). ROC-AUC **0.7407**, F1 0.2584.
  - TabTransformer (embeddings + 2-layer `nn.TransformerEncoder`): ROC-AUC **0.7459**, F1 0.2595, but unstable val loss.
- **Stratified 5-fold CV** (scaler fitted per fold) completed: ANN and TabTransformer are effectively tied.
  **Decision: ANN is the production model** (more stable, simpler, same accuracy).
- **MC Dropout:** Dropout layers only in train mode (BatchNorm stays in eval, because batch size 1 breaks BatchNorm).
- **Platt scaling:** `LogisticRegression` on MC-Dropout mean probabilities of the validation set (20 passes in notebook).

### Calibration table (validation set, used to choose thresholds)

| Calibrated p ≤ | % of applicants | Actual default rate |
|---|---|---|
| 0.05 | 47.8% | 3.19% |
| 0.08 | 64.5% | 3.92% |
| 0.10 | 71.9% | 4.43% |
| 0.15 | 84.8% | 5.61% |
| 0.20 | 92.0% | 6.45% |
| 0.25 | 96.2% | 7.11% |
| 0.30 | 98.5% | 7.61% |
| 0.40 | 99.9% | 8.05% |

Band default rates roughly match predicted probabilities → calibration is good.

---

## 3. Backend (DONE — FastAPI, runs locally)

### 3.1 Project structure

```
Loan Approval Predictor/
├── app/
│   ├── main.py                      # FastAPI app; router included with prefix /api/v1
│   ├── models/
│   │   ├── ann_model.py             # LoanANN class + load_production_model(input_size=171)
│   │   ├── preprocessing.py         # preprocess_applicant(dict) -> scaled np.ndarray (1, 171)
│   │   ├── best_ann_model.pt        # production weights
│   │   ├── best_tabtransformer_model.pt
│   │   ├── scaler.pkl               # fitted StandardScaler
│   │   ├── feature_names.pkl        # 171 training feature names (order matters)
│   │   ├── categorical_cols.pkl
│   │   ├── platt_calibrator.pkl     # fitted Platt scaler
│   │   ├── shap_background.npy      # background sample for SHAP
│   │   └── dice_reference.csv       # 3000 rows: AMT_CREDIT, AMT_GOODS_PRICE, AMT_ANNUITY,
│   │                                #   EXT_SOURCE_2, EXT_SOURCE_3, TARGET (for DiCE ranges)
│   ├── routers/predict.py           # POST /predict, POST /recourse
│   ├── schemas/
│   │   ├── application_schema.py    # ApplicantData: 71 Home Credit fields (Pydantic)
│   │   └── prediction_schema.py     # PredictionResponse, RecourseResponse, ReasonCode, Counterfactual...
│   └── services/
│       ├── inference_service.py     # predict_applicant(), recourse_applicant(), thresholds, seeds, lock
│       ├── uncertainty_service.py   # mc_dropout_predict(model, x, n_passes=50) -> (mean, std)
│       ├── calibration_service.py   # calibrate_probability(raw)
│       ├── shap_service.py          # explain_applicant(): KernelExplainer, filtered reason codes
│       └── dice_service.py          # generate_recourse(): DiCE (random method) + sparsify
├── notebooks/training_pipeline.ipynb
├── test_pipeline.py                 # standalone preprocessing + model sanity test
├── test_recourse.py                 # diagnostic: how much does p move when loan/income change
├── borderline.json                  # example borderline applicant (EXT_SOURCE 0.4, loan 900000)
└── implementation.md
```

### 3.2 API

Base path: `/api/v1`. Swagger UI: `http://127.0.0.1:8000/docs`.

**`POST /api/v1/predict`** — body: `ApplicantData` (71 fields). Response:
```json
{
  "decision": "Needs Manual Review",
  "default_probability": 0.1625,
  "confidence_score": 0.8375,
  "uncertainty_score": 0.0319,
  "reason_codes": [{"factor": "EXT_SOURCE_2", "impact": 0.066, "direction": "increases_risk"}],
  "explanation_available": true,
  "model_version": "ANN-v1"
}
```
- `default_probability` = calibrated P(default). `confidence_score` = 1 − default_probability (kept for PRD naming).

**`POST /api/v1/recourse`** — same body; on-demand because DiCE is slower. Response:
```json
{
  "recourse_needed": true,
  "default_probability": 0.1625,
  "counterfactuals": [
    {"changes": [{"feature": "EXT_SOURCE_3", "current": 0.4, "suggested": 0.6078}],
     "new_default_probability": 0.09},
    {"changes": [{"feature": "EXT_SOURCE_2", "current": 0.4, "suggested": 0.6637}],
     "new_default_probability": 0.09}
  ],
  "message": "2 suggestion(s) found."
}
```
If already approved: `recourse_needed: false`, empty list. If nothing feasible: empty list + message
"No feasible change within the allowed limits; manual review recommended."
Each suggestion is an ALTERNATIVE (apply one of them, not all).

### 3.3 Decision logic (in `inference_service.py`)

```
APPROVE_MAX = 0.10      # calibrated default prob <= 0.10 -> Approved (~72% of applicants, 4.4% default)
REJECT_MIN  = 0.20      # > 0.20 -> Rejected (~8% of applicants, ~27% default)
                        # between -> Needs Manual Review
UNCERTAINTY_MAX = 0.10  # MC-Dropout std above this forces Needs Manual Review (manual, NOT tuned yet)
```
Thresholds were chosen from the calibration table above (originally 0.4 / 0.6, which would never reject anyone).

### 3.4 Pipeline inside `predict_applicant`

`preprocess_applicant` → `torch.manual_seed(42); np.random.seed(42)` → `mc_dropout_predict` (50 passes) →
`calibrate_probability` → thresholds → uncertainty override → SHAP (try/except; `explanation_available`).
A `threading.Lock` serialises requests because MC Dropout / SHAP / DiCE all flip the shared model's mode.

### 3.5 SHAP reason codes (`shap_service.py`)
- `KernelExplainer` on the ANN sigmoid output, `nsamples=200`, built lazily on first request.
- Filters: skips `CODE_GENDER_*` (protected attribute), `WEEKDAY_APPR_PROCESS_START_*`, `HOUR_APPR_PROCESS_START`,
  one-hot dummies the applicant does NOT have (scaled value ≤ 0), and impacts < 0.005.

### 3.6 DiCE recourse (`dice_service.py`)
- Only these features can change: **reducible** `AMT_CREDIT`, `AMT_GOODS_PRICE`, `AMT_ANNUITY` (down to 50% of current);
  **improvable** `EXT_SOURCE_2`, `EXT_SOURCE_3` (up by at most +0.4, capped at 1.0). Everything else is fixed/immutable.
- Wrapper keeps the applicant's scaled vector fixed and only swaps those columns; probabilities are rescaled so
  DiCE's 0.5 boundary equals our 0.10 approval threshold.
- **Safety margin:** the whole function aims at `target = APPROVE_MAX * 0.90 = 0.09` (not 0.10). The wrapper is built with
  `target`, so DiCE's own 0.5 boundary is p = 0.09. Reason: recourse uses ONE deterministic forward pass while `/predict`
  averages 50 MC-Dropout passes, so p can differ slightly; the margin keeps suggestions safely inside the Approved zone.
- Post-processing: each DiCE candidate is **shrunk** (binary search) to the minimum change that still stays within
  `target`, negligible changes dropped, duplicates collapsed by feature set, lowest-effort first. Final p is re-checked
  against `target` after rounding.
- `total_CFs` must stay at **3** (5 made DiCE's random search take ~56 s).
- **Verified end-to-end:** for `borderline.json` (p = 0.1625), putting each suggested value into `/predict` returned
  **Approved** (`EXT_SOURCE_3 = 0.6078` -> p 0.0859; `EXT_SOURCE_2 = 0.6637` -> p 0.0849).

### 3.7 Measured latency (warm, local CPU)
| Call | Time |
|---|---|
| `/predict` (50 MC passes + SHAP) | ~83–200 ms (PRD target < 300 ms met) |
| `/recourse` | ~450–800 ms |

---

## 4. Bugs found & fixed during integration (important context — do not reintroduce)

1. **Train/serve skew in preprocessing.** `pd.get_dummies(single_row, drop_first=True)` produces *no* dummy columns for a
   one-row frame (drop_first drops the only category), so every one-hot became 0. **Fix:** build the one-hot row manually
   against `feature_names` (`f"{col}_{value}"` = 1 if that column exists). The notebook's DiCE wrapper has the same
   pattern but works there because it runs on batches.
2. **FLAG_MOBIL dominating SHAP.** Cause was the Swagger default template (all numbers 0, categories "string"):
   `FLAG_MOBIL=0` is a ~−500 z-score outlier (only 1 row in 307K has 0). Always test with a realistic applicant.
3. **Thresholds 0.4 / 0.6** could never reject anyone (calibrated probabilities rarely exceed 0.3). Re-chosen at 0.10 / 0.20.
4. **Non-deterministic output** (MC Dropout + SHAP sampling). Fixed with fixed seeds; same input → same output.
5. **MC Dropout with batch size 1** crashed BatchNorm. Fixed with Dropout-only train mode.
6. **Confusing `confidence_score`** (was default probability). Added `default_probability`; `confidence_score = 1 − p`.
7. **Gender appeared as a reason code.** Now filtered from the output (the model still uses it, see Section 7).
8. **DiCE returned nothing** with loan-only levers: loan amount / income barely move the ANN (p 0.1686 → 0.1565 even with
   loan ×0.5 and income ×3). Credit scores were added as improvable features.
9. **DiCE took ~56 s** when `total_CFs=5` (random search struggles to find 5 valid points in a narrow range). Kept at 3.
10. **Recourse suggestions sat exactly on the approval boundary (p = 0.1000).** A first fix applied the 0.90 margin only
    *conditionally* (when DiCE's raw candidate was already below 0.09), so it silently fell back to 0.10. Final fix: the
    margin (`target = approve_max * 0.90`) is used everywhere (DiCE wrapper, shrinking, final check).
11. **`/predict` was slow (~1.2 s) when DiCE ran inside it.** DiCE moved to the separate on-demand `/recourse` endpoint;
    `/predict` is now ~83–200 ms.

---

## 5. How to run locally (Windows / PowerShell)

```powershell
cd "C:\Users\Acer\Loan Approval Predictor"
python -m pip install fastapi uvicorn torch scikit-learn joblib pandas numpy shap dice-ml
python -m uvicorn app.main:app --reload
# open http://127.0.0.1:8000/docs
```
- Expected harmless warnings: `InconsistentVersionWarning` (pickles made with scikit-learn 1.6.1, local is 1.9.1).
- Terminal prints `[timing] ...` lines for SHAP / total predict / DiCE.
- Test applicant: use `borderline.json` or any realistic JSON (NOT the Swagger default template).
  Rough sanity profiles: EXT_SOURCE_2/3 = 0.8 → Approved (p≈0.017); 0.55/0.5 → Approved (p≈0.07–0.09);
  0.4/0.4 with loan 900000 → Needs Manual Review (p≈0.16); 0.15/0.15 → Rejected (p≈0.33).
- Recourse consistency check: run `borderline.json` on `/recourse`, then put a suggested value into the same JSON on
  `/predict` → decision should be Approved with p < 0.10.

---

## 6. Status checklist

### Done ✅
- [x] Dataset, cleaning, encoding, scaling, class-weighted training
- [x] ANN + TabTransformer + ablation + stratified 5-fold CV (ANN promoted)
- [x] SHAP, DiCE, MC Dropout, Platt calibration (notebook proof of concept)
- [x] FastAPI app: `/predict` and `/recourse`, Pydantic schemas, Swagger
- [x] Preprocessing pipeline matching training (skew bug fixed)
- [x] MC Dropout uncertainty + Platt calibration wired into the API
- [x] SHAP reason codes with filtering (no gender, no noise)
- [x] DiCE recourse with constraints, shrinking, on-demand endpoint
- [x] Calibration-based thresholds, deterministic seeds, latency measured
- [x] 90-day logbook, status updates for mentor, PRD (frozen), HLD diagram
- [x] `/recourse` split from `/predict` (latency), safety margin 0.90 applied, consistency with `/predict` verified
- [x] `implementation.md` kept up to date (this file)

### Housekeeping
- [ ] Commit + push after each step (last planned commit: `fix: add safety margin to recourse so suggestions land inside the approval zone`).
- [ ] Update this file's checkboxes whenever a step is completed.

### Next: Viva 2 (15–22 Oct) — React frontend (COMPLETED ✅)
- [x] Add CORS (`CORSMiddleware`, allow `http://localhost:5173`) in `app/main.py`
- [x] `frontend/` scaffold: Vite + React + Tailwind + Axios
- [x] Applicant form (71 fields; group into sections: personal, loan, employment, address, bureau, documents; dropdowns
      must use the exact Home Credit category strings; quick-fill presets for Borderline, High-Risk, Prime)
- [x] Result view: decision badge, default probability, uncertainty, reason codes (increases/decreases risk)
- [x] "What would change this decision?" button → calls `/recourse` and shows suggestions
      (only shown when decision ≠ Approved)

### Later (Month 3 / PRD milestones)
- [ ] DB (MongoDB via Motor / PyMongo): `users`, `applications`, `predictions`, `audit_log` collections
- [ ] JWT auth + roles (officer / admin), `POST /auth/login`
- [ ] `GET /metrics`, `GET /health`, `POST /predict/batch`
- [ ] Fairness report (`fairness_service.py`, `GET /fairness-report`): demographic parity / equal opportunity by gender
- [ ] Admin dashboard (accuracy, F1, confusion matrix, ROC)
- [ ] Pydantic `Literal[...]` validation for categorical fields (today an unknown string silently becomes the baseline)
- [ ] Tests (pytest): preprocessing, endpoints, integration
- [ ] `requirements.txt`, `.gitignore`, `README.md`, Dockerfiles, docker-compose, GitHub Actions CI, MLflow
- [ ] Deploy: backend (Render/Railway), frontend (Vercel)

---

## 7. Known limitations / honest notes (good viva material)

1. **The ANN relies almost entirely on `EXT_SOURCE_2/3`** (external bureau scores). SHAP shows them dominating; loan amount
   and income barely move the prediction, and the ANN is not monotonic in loan amount. This is why recourse centres on
   credit-score improvement.
2. **Gender is an input feature.** Hidden from reason codes, but the model still uses it → fairness audit is required
   (demographic parity / equal opportunity). Removing protected attributes and retraining is Future Scope.
3. **Uncertainty cutoff (0.10) is manual**, not tuned. Future work: plot uncertainty vs error rate and choose the cutoff.
4. **Calibrator mismatch (minor):** fitted on 20-pass MC-Dropout means, served with 50 passes. Differences are small.
5. **scikit-learn version mismatch** (pickles from 1.6.1, local 1.9.1): harmless warnings now; pin versions or re-export in `requirements.txt`.
6. **Recourse is limited to 5 features** and uses DiCE's `random` method plus our own shrinking step; the weakest applicants
   (very low EXT_SOURCE) may legitimately get "no feasible change".
7. **SHAP `KernelExplainer` with `nsamples=200`** is approximate; values vary slightly with the sampling seed (fixed).
8. Free-text/unknown categories silently map to the baseline category (no 422 error yet).
9. Home Credit data: only `application_train.csv` is used (no bureau / previous-application tables).

---

## 8. Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Tailwind CSS, Axios (to build) |
| Backend | FastAPI, Pydantic v2, uvicorn |
| ML | PyTorch, scikit-learn, SHAP (KernelExplainer), dice-ml |
| Database | MongoDB (Motor / PyMongo) — not yet built |
| Experiment tracking | MLflow — not yet integrated |
| Deployment | Docker, GitHub Actions, Render/Railway, Vercel — Month 3 |
| Env | Windows 10/11, VS Code, Python 3.14, Smart App Control turned off (it blocked scikit-learn DLLs) |
