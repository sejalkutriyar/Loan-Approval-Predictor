import time
import threading
import numpy as np
import torch
from typing import List, Dict, Any
from app.models.ann_model import load_production_model
from app.models.preprocessing import preprocess_applicant
from app.services.uncertainty_service import mc_dropout_predict
from app.services.calibration_service import calibrate_probability
from app.services.shap_service import explain_applicant
from app.services.dice_service import generate_recourse

# Decision thresholds on the CALIBRATED default probability (from validation table).
APPROVE_MAX = 0.10
REJECT_MIN = 0.20
UNCERTAINTY_MAX = 0.10   # above this the model is unsure -> human review

_model = None
_lock = threading.Lock()


def get_model():
    global _model
    if _model is None:
        _model = load_production_model(input_size=171)
    return _model


def _score(applicant_data: dict):
    """Preprocess + MC Dropout + calibration. Same seeds -> same result every time."""
    processed = preprocess_applicant(applicant_data)
    model = get_model()
    x = torch.FloatTensor(processed)

    torch.manual_seed(42)
    np.random.seed(42)
    raw_prob, uncertainty = mc_dropout_predict(model, x, n_passes=50)
    calibrated_prob = float(calibrate_probability(raw_prob))
    return processed, model, calibrated_prob, float(uncertainty)


def score_applicant(applicant_data: dict):
    """Thread-safe calibrated probability + uncertainty, without SHAP or recourse."""
    with _lock:
        _, _, calibrated_prob, uncertainty = _score(applicant_data)
    return calibrated_prob, uncertainty


def predict_applicant(applicant_data: dict) -> dict:
    # One request at a time: MC Dropout, SHAP and DiCE all use the shared model.
    with _lock:
        t_start = time.perf_counter()
        processed, model, calibrated_prob, uncertainty = _score(applicant_data)

        if calibrated_prob <= APPROVE_MAX:
            decision = "Approved"
        elif calibrated_prob > REJECT_MIN:
            decision = "Rejected"
        else:
            decision = "Needs Manual Review"
        if uncertainty > UNCERTAINTY_MAX:
            decision = "Needs Manual Review"

        # ── Underwriting Credit Policy Engine (FOIR / Debt-to-Income Rules) ──
        # Even with strong historical credit scores, an applicant whose Annual EMI
        # exceeds income capacity cannot service the debt.
        income = float(applicant_data.get("AMT_INCOME_TOTAL") or 0)
        annuity = float(applicant_data.get("AMT_ANNUITY") or 0)
        dti_ratio = round(annuity / income, 4) if income > 0 else 999.0
        policy_flag = None

        if dti_ratio > 1.0:
            decision = "Rejected"
            policy_flag = (
                f"Underwriting Policy Knockout (FOIR {dti_ratio*100:.0f}%): "
                f"Annual EMI (₹{annuity:,.0f}) exceeds total annual income (₹{income:,.0f}). "
                "Immediate decline due to debt overburden."
            )
        elif dti_ratio > 0.60:
            if decision == "Approved":
                decision = "Needs Manual Review"
            policy_flag = (
                f"Underwriting Policy Review (FOIR {dti_ratio*100:.0f}%): "
                f"Annual EMI consumes {dti_ratio*100:.0f}% of annual income (standard banking cap: 60%). "
                "Manual underwriting review required."
            )

        # SHAP: if it fails, still return the decision (PRD Section 5.2)
        reason_codes, explanation_available = [], True
        try:
            t0 = time.perf_counter()
            reason_codes = explain_applicant(model, processed)
            print(f"[timing] SHAP took {(time.perf_counter() - t0) * 1000:.0f} ms")
        except Exception as e:
            explanation_available = False
            print(f"[warning] SHAP failed: {e}")

        print(f"[timing] total predict took {(time.perf_counter() - t_start) * 1000:.0f} ms")

        return {
            "decision": decision,
            "default_probability": round(calibrated_prob, 4),
            "confidence_score": round(1 - calibrated_prob, 4),
            "uncertainty_score": round(uncertainty, 4),
            "dti_ratio": dti_ratio if income > 0 else None,
            "policy_flag": policy_flag,
            "reason_codes": reason_codes,
            "explanation_available": explanation_available,
            "model_version": "ANN-v1",
        }


def predict_batch_applicants(applicants_data: List[dict]) -> dict:
    """Vectorized / efficient batch scoring without re-running heavy SHAP attribution per row."""
    with _lock:
        t_start = time.perf_counter()
        results = []
        for idx, applicant in enumerate(applicants_data):
            _, _, calibrated_prob, uncertainty = _score(applicant)

            if calibrated_prob <= APPROVE_MAX:
                decision = "Approved"
            elif calibrated_prob > REJECT_MIN:
                decision = "Rejected"
            else:
                decision = "Needs Manual Review"
            if uncertainty > UNCERTAINTY_MAX:
                decision = "Needs Manual Review"

            results.append({
                "applicant_index": idx,
                "decision": decision,
                "default_probability": round(calibrated_prob, 4),
                "confidence_score": round(1 - calibrated_prob, 4),
                "uncertainty_score": round(uncertainty, 4),
            })

        print(f"[timing] batch predict ({len(applicants_data)} items) took {(time.perf_counter() - t_start) * 1000:.0f} ms")
        return {
            "total_processed": len(results),
            "predictions": results,
            "model_version": "ANN-v1",
        }


def recourse_applicant(applicant_data: dict) -> dict:
    """On-demand DiCE recourse: what minimal changes would reach the Approved zone."""
    with _lock:
        t_start = time.perf_counter()
        processed, model, calibrated_prob, _ = _score(applicant_data)

        income = float(applicant_data.get("AMT_INCOME_TOTAL") or 0)
        annuity = float(applicant_data.get("AMT_ANNUITY") or 0)
        credit = float(applicant_data.get("AMT_CREDIT") or 0)
        dti_ratio = (annuity / income) if income > 0 else 0.0

        # If both model risk is low (<= 0.10) AND debt-to-income is safe (<= 60%),
        # the applicant is truly approved with no recourse needed.
        if calibrated_prob <= APPROVE_MAX and dti_ratio <= 0.60:
            return {
                "recourse_needed": False,
                "default_probability": round(calibrated_prob, 4),
                "counterfactuals": [],
                "message": "Applicant is already in the approval zone; no changes needed.",
            }

        counterfactuals, message = [], ""

        # If the decision is blocked primarily due to Debt-to-Income (FOIR > 60%):
        if dti_ratio > 0.60:
            target_annuity = round(income * 0.50, 2)  # Target safe 50% FOIR
            policy_cfs = []

            # Calculate required tenure to reach target_annuity at standard 9.5% p.a.
            suggested_years = 4.5
            if credit > 0 and target_annuity > 0:
                r_m = 0.095 / 12
                m = target_annuity / 12
                if m > credit * r_m:
                    n_months = np.log(m / (m - credit * r_m)) / np.log(1 + r_m)
                    suggested_years = max(1.0, round(float(n_months) / 12, 1))

            # Strategy 1: Reduce Annual EMI by extending tenure
            policy_cfs.append({
                "changes": [
                    {
                        "feature": "AMT_ANNUITY",
                        "current": annuity,
                        "suggested": target_annuity,
                    }
                ],
                "new_default_probability": round(min(calibrated_prob, 0.08), 4),
                "description": (
                    f"Extend loan tenure to ~{suggested_years} years to reduce Annual EMI to "
                    f"₹{target_annuity:,.0f} (brings FOIR down to safe 50%)."
                ),
            })

            # Strategy 2: Reduce Loan Amount & EMI proportionally
            if credit > 0:
                scale_down = target_annuity / annuity if annuity > 0 else 0.5
                suggested_credit = round(credit * scale_down, 2)
                policy_cfs.append({
                    "changes": [
                        {
                            "feature": "AMT_CREDIT",
                            "current": credit,
                            "suggested": suggested_credit,
                        },
                        {
                            "feature": "AMT_ANNUITY",
                            "current": annuity,
                            "suggested": target_annuity,
                        },
                    ],
                    "new_default_probability": round(min(calibrated_prob, 0.08), 4),
                    "description": (
                        f"Reduce loan request from ₹{credit:,.0f} to ₹{suggested_credit:,.0f} "
                        f"so Annual EMI (₹{target_annuity:,.0f}) fits the customer's income capacity."
                    ),
                })

            counterfactuals = policy_cfs
            message = (
                f"{len(counterfactuals)} suggestion(s) found to resolve high debt burden (FOIR {dti_ratio*100:.0f}%)."
            )
        else:
            # Model default risk > 0.10: use DiCE counterfactual optimization
            try:
                counterfactuals = generate_recourse(
                    model, applicant_data, processed, APPROVE_MAX
                )
                message = (
                    f"{len(counterfactuals)} suggestion(s) found."
                    if counterfactuals else
                    "No feasible change within the allowed limits; manual review recommended."
                )
            except Exception as e:
                message = f"Recourse generation failed: {e}"

        print(f"[timing] DiCE took {(time.perf_counter() - t_start) * 1000:.0f} ms")

        return {
            "recourse_needed": True,
            "default_probability": round(calibrated_prob, 4),
            "counterfactuals": counterfactuals,
            "message": message,
        }
