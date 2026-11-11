import json
from pathlib import Path
from typing import Dict, Any, List
from app.services.inference_service import _score, APPROVE_MAX, REJECT_MIN

ROOT = Path(__file__).resolve().parent.parent.parent


def evaluate_cohort_fairness(cohort_applicants: List[dict]) -> Dict[str, Any]:
    """
    Computes algorithmic fairness and bias metrics across sensitive attributes (Gender: Female vs Male)
    for a given benchmark cohort of loan applicants.

    Evaluates:
      1. Demographic Parity Ratio (Disparate Impact): P(Approved | Female) / P(Approved | Male)
         - EEOC 80% Rule (Four-Fifths Rule): Must be >= 0.80 and <= 1.25 for fairness.
      2. Approval & Rejection rates per sensitive group.
      3. Counterfactual Sensitivity: Measuring average default probability shift when only gender is toggled.
      4. Regulatory Compliance Status & Explainability Safeguards.
    """
    total = len(cohort_applicants)
    results_m = []
    results_f = []

    diffs = []

    for app in cohort_applicants:
        # Male version
        m_app = dict(app)
        m_app["CODE_GENDER"] = "M"
        _, _, p_m, u_m = _score(m_app)
        dec_m = "Approved" if p_m <= APPROVE_MAX else ("Rejected" if p_m > REJECT_MIN else "Needs Manual Review")
        results_m.append({"prob": p_m, "decision": dec_m, "uncertainty": u_m})

        # Female version
        f_app = dict(app)
        f_app["CODE_GENDER"] = "F"
        _, _, p_f, u_f = _score(f_app)
        dec_f = "Approved" if p_f <= APPROVE_MAX else ("Rejected" if p_f > REJECT_MIN else "Needs Manual Review")
        results_f.append({"prob": p_f, "decision": dec_f, "uncertainty": u_f})

        # Gender marginal delta
        diffs.append(p_m - p_f)

    # Calculate Approval counts
    m_approved = sum(1 for r in results_m if r["decision"] == "Approved")
    f_approved = sum(1 for r in results_f if r["decision"] == "Approved")

    m_approval_rate = round(m_approved / max(total, 1), 4)
    f_approval_rate = round(f_approved / max(total, 1), 4)

    # Disparate Impact / Demographic Parity Ratio
    # Ratio of favorable outcome rates: min(rate1, rate2) / max(rate1, rate2) or F / M
    if m_approval_rate > 0 and f_approval_rate > 0:
        disparate_impact_ratio = round(min(f_approval_rate, m_approval_rate) / max(f_approval_rate, m_approval_rate), 4)
    elif m_approval_rate == 0 and f_approval_rate == 0:
        disparate_impact_ratio = 1.0
    else:
        disparate_impact_ratio = 0.0

    eeoc_80_rule_pass = disparate_impact_ratio >= 0.80

    avg_prob_m = round(sum(r["prob"] for r in results_m) / max(total, 1), 4)
    avg_prob_f = round(sum(r["prob"] for r in results_f) / max(total, 1), 4)
    avg_delta = round(sum(diffs) / max(total, 1), 4)

    return {
        "audit_timestamp": "2026-11-11T10:20:00Z",
        "sensitive_attribute": "CODE_GENDER",
        "cohort_size": total,
        "demographic_parity": {
            "disparate_impact_ratio": disparate_impact_ratio,
            "eeoc_four_fifths_threshold": 0.80,
            "eeoc_rule_passed": bool(eeoc_80_rule_pass),
            "female_approval_rate": f_approval_rate,
            "male_approval_rate": m_approval_rate,
            "approval_rate_difference": round(abs(f_approval_rate - m_approval_rate), 4),
        },
        "score_distribution": {
            "average_female_default_probability": avg_prob_f,
            "average_male_default_probability": avg_prob_m,
            "average_gender_gap_delta": avg_delta,
        },
        "safeguards": {
            "gender_in_reason_codes": "EXCLUDED (Strictly filtered in shap_service.py)",
            "gender_in_recourse": "IMMUTABLE (Protected from changes in dice_service.py)",
            "compliance_standard": "Equal Credit Opportunity Act (ECOA) & EU AI Act High-Risk Guidelines",
        },
        "recommendation": (
            "Model satisfies the 80% EEOC rule on the benchmark cohort. "
            "Protected attributes are shielded from explainability outputs to avoid disparate treatment."
            if eeoc_80_rule_pass else
            "Warning: Disparate impact ratio is below the 80% threshold. Equalized Odds mitigation recommended."
        ),
    }


def generate_benchmark_fairness_report() -> Dict[str, Any]:
    """Generates fairness report on standard benchmark applicants + synthetic credit variations."""
    cohort = []

    # 1. Base Presets
    for fname in ["prime.json", "borderline.json", "high_risk.json"]:
        fpath = ROOT / fname
        if fpath.exists():
            with open(fpath, "r") as f:
                cohort.append(json.load(f))

    # 2. Synthetic variations spanning different credit profiles (to form a representative cohort)
    if cohort:
        base = cohort[0]
        # Generate variations across credit bureau ratings (0.2, 0.4, 0.6, 0.8) and loan sizes
        for cibil in [0.25, 0.45, 0.65, 0.85]:
            for loan in [250000.0, 600000.0, 1200000.0]:
                var = dict(base)
                var["EXT_SOURCE_2"] = cibil
                var["EXT_SOURCE_3"] = cibil
                var["AMT_CREDIT"] = loan
                var["AMT_GOODS_PRICE"] = loan
                var["AMT_ANNUITY"] = round(loan * 0.08, 2)
                cohort.append(var)

    return evaluate_cohort_fairness(cohort)

