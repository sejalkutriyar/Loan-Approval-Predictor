import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { label, pct } from "../fields.js";
import "./result.css";

const DECISION_CONFIG = {
  Approved: {
    title: "APPROVED FOR DISBURSAL",
    subtitle: "Low calibrated default probability meets institutional risk criteria.",
    bannerClass: "verdict-banner verdict-banner--approved",
    ratingClass: "verdict-banner__rating--prime",
    icon: CheckCircle2,
    rating: "TIER A • LOW RISK",
  },
  Rejected: {
    title: "APPLICATION DECLINED",
    subtitle: "High probability of credit default exceeds standard risk tolerance.",
    bannerClass: "verdict-banner verdict-banner--rejected",
    ratingClass: "verdict-banner__rating--rejected",
    icon: XCircle,
    rating: "TIER C • SUBPRIME / HIGH RISK",
  },
  "Needs Manual Review": {
    title: "REFERRED TO CREDIT COMMITTEE",
    subtitle: "Borderline default risk requires human underwriter manual review.",
    bannerClass: "verdict-banner verdict-banner--review",
    ratingClass: "verdict-banner__rating--review",
    icon: AlertTriangle,
    rating: "TIER B • BORDERLINE / MANUAL AUDIT",
  },
};

function ExecutiveMetric({ title, value, sub, icon: Icon, badge }) {
  return (
    <div className="metric-card">
      <div>
        <div className="metric-card__header">
          <span className="metric-card__title">{title}</span>
          {Icon && <Icon size={15} className="text-slate-500" />}
        </div>
        <div className="metric-card__value">{value}</div>
      </div>
      {(sub || badge) && (
        <div className="metric-card__footer">
          <span className="metric-card__sub">{sub}</span>
          {badge && <span className="metric-card__badge">{badge}</span>}
        </div>
      )}
    </div>
  );
}

function CalibratedRiskMeter({ p }) {
  const MAX = 0.4;
  const clampedP = Math.min(Math.max(p, 0), MAX);
  const positionPercent = (clampedP / MAX) * 100;

  return (
    <div className="risk-meter">
      <div className="risk-meter__header">
        <div>
          <h4 className="risk-meter__title">Calibrated Risk Spectrum</h4>
          <p className="risk-meter__subtitle">
            Platt-scaled empirical default probability vs decision thresholds
          </p>
        </div>
        <span className="risk-meter__value-badge">
          p = {(p * 100).toFixed(2)}%
        </span>
      </div>

      {/* Meter Bar */}
      <div className="risk-meter__track-wrap">
        {/* Track with 3 Zones */}
        <div className="risk-meter__track">
          {/* Zone 1: 0% to 10% (Approve) = 25% of 40% bar */}
          <div
            className="risk-meter__zone--approve"
            style={{ width: "25%" }}
            title="Approve Zone (≤ 10%)"
          />
          {/* Zone 2: 10% to 20% (Review) = 25% of 40% bar */}
          <div
            className="risk-meter__zone--review"
            style={{ width: "25%" }}
            title="Manual Review Zone (10% - 20%)"
          />
          {/* Zone 3: 20% to 40%+ (Reject) = 50% of 40% bar */}
          <div
            className="risk-meter__zone--reject"
            style={{ width: "50%" }}
            title="Decline Zone (> 20%)"
          />
        </div>

        {/* Current Applicant Needle Pointer */}
        <div
          className="risk-meter__needle"
          style={{ left: `${positionPercent}%` }}
        >
          <div className="risk-meter__needle-bar" />
          <div className="risk-meter__needle-tip" />
        </div>
      </div>

      {/* Zone Threshold Indicators */}
      <div className="risk-meter__legend">
        <div className="risk-meter__legend--approve">
          <span className="font-bold">0% - 10%</span> (Approved)
        </div>
        <div className="risk-meter__legend--review">
          <span className="font-bold">10% - 20%</span> (Review)
        </div>
        <div className="risk-meter__legend--reject">
          <span className="font-bold">&gt; 20%</span> (Decline)
        </div>
      </div>
    </div>
  );
}

function ShapAttributionList({ codes }) {
  if (!codes?.length) return null;
  const maxImpact = Math.max(...codes.map((c) => Math.abs(c.impact)), 0.001);

  return (
    <div className="shap-list">
      <div className="shap-list__header">
        <div>
          <h4 className="shap-list__title">SHAP Reason Codes (Explainability)</h4>
          <p className="shap-list__subtitle">
            Top factors influencing model default-risk logits (Protected attributes excluded)
          </p>
        </div>
        <span className="shap-list__engine-badge">KernelExplainer</span>
      </div>

      <div className="shap-list__items">
        {codes.map((c, i) => {
          const isRiskRaiser = String(c.direction).includes("increase");
          const impactPercent = ((Math.abs(c.impact) / maxImpact) * 100).toFixed(0);

          return (
            <div key={i} className="shap-item">
              <div className="shap-item__row">
                <span className="shap-item__factor" title={c.factor}>
                  {label(c.factor)}
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className={isRiskRaiser ? "shap-item__badge--raises" : "shap-item__badge--lowers"}>
                    {isRiskRaiser ? (
                      <>
                        <TrendingUp size={11} /> +{(c.impact * 100).toFixed(1)}% (Raises Risk)
                      </>
                    ) : (
                      <>
                        <TrendingDown size={11} /> {(c.impact * 100).toFixed(1)}% (Lowers Risk)
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Relative Impact Progress Bar */}
              <div className="shap-item__bar-track">
                <div
                  className={isRiskRaiser ? "shap-item__bar--raises" : "shap-item__bar--lowers"}
                  style={{ width: `${Math.max(Number(impactPercent), 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Result({ result }) {
  const cfg =
    DECISION_CONFIG[result.decision] || DECISION_CONFIG["Needs Manual Review"];
  const Icon = cfg.icon;

  return (
    <div className="result-root">
      {/* 1. Executive Verdict Banner */}
      <div className={cfg.bannerClass}>
        <div className="verdict-banner__icon-wrap">
          <Icon size={28} />
        </div>
        <div className="verdict-banner__body">
          <div className="verdict-banner__header-row">
            <h3 className="verdict-banner__title">{cfg.title}</h3>
            <span className={cfg.ratingClass}>{cfg.rating}</span>
          </div>
          <p className="verdict-banner__subtitle">{cfg.subtitle}</p>
          <div className="verdict-banner__meta-row">
            <span className="flex items-center gap-1">
              <Cpu size={12} /> Model: <b>{result.model_version}</b>
            </span>
            <span>•</span>
            <span>Calibrated Platt Scaling Engine</span>
          </div>
        </div>
      </div>

      {/* 2. Key Underwriting Metrics (3 Cards) */}
      <div className="metrics-grid">
        <ExecutiveMetric
          title="Calibrated Default Risk (p)"
          value={pct(result.default_probability)}
          sub={
            result.default_probability <= 0.1
              ? "Underwriting zone ≤ 10%"
              : result.default_probability <= 0.2
              ? "Borderline zone 10-20%"
              : "High default zone > 20%"
          }
          icon={TrendingUp}
          badge="Platt Scaled"
        />

        <ExecutiveMetric
          title="Underwriting Confidence (1-p)"
          value={pct(result.confidence_score)}
          sub="Reimbursement probability"
          icon={ShieldCheck}
          badge="Inverted P"
        />

        <ExecutiveMetric
          title="Epistemic Uncertainty (σ)"
          value={result.uncertainty_score.toFixed(4)}
          sub={
            result.uncertainty_score > 0.1
              ? "High variance forces review"
              : "Within safe bound (≤0.10)"
          }
          icon={HelpCircle}
          badge="50 MC Passes"
        />
      </div>

      {/* 3. Risk Spectrum Gauge */}
      <CalibratedRiskMeter p={result.default_probability} />

      {/* 4. SHAP Reason Codes */}
      <ShapAttributionList codes={result.reason_codes} />
    </div>
  );
}
