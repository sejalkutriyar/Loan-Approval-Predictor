import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { label, fmtValue, pct } from "../fields.js";
import "./result.css";

const CONFIG = {
  Approved: {
    tone: "approved",
    icon: CheckCircle2,
    chip: "Approved",
    title: "Approved",
    text: "The model estimates a low probability of default, within the standard approval threshold.",
  },
  "Needs Manual Review": {
    tone: "review",
    icon: AlertTriangle,
    chip: "Needs review",
    title: "Manual review",
    text: "The estimate sits between the approval and decline thresholds, or is unstable across dropout passes. A credit officer should look at this file.",
  },
  Rejected: {
    tone: "rejected",
    icon: XCircle,
    chip: "Declined",
    title: "Declined",
    text: "The model estimates a high probability of default, above the standard decline threshold.",
  },
};

function RiskMeter({ p }) {
  const MAX = 0.4;
  const position = (Math.min(Math.max(p, 0), MAX) / MAX) * 100;
  return (
    <div className="risk-meter">
      <div className="risk-meter__header">
        <div>
          <h4 className="risk-meter__title">Where this application sits</h4>
          <p className="risk-meter__subtitle">
            Calibrated default probability against the policy thresholds
          </p>
        </div>
        <span className="risk-meter__value">p = {pct(p)}</span>
      </div>

      <div className="risk-meter__track-wrap">
        <div className="risk-meter__track">
          <div className="risk-meter__zone--approve" />
          <div className="risk-meter__zone--review" />
          <div className="risk-meter__zone--reject" />
        </div>
        <div
          className="risk-meter__needle"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="risk-meter__legend">
        <span className="risk-meter__legend-left">≤ 10% approve</span>
        <span className="risk-meter__legend-mid">10–20% review</span>
        <span className="risk-meter__legend-right">&gt; 20% decline</span>
      </div>
    </div>
  );
}

function DriverList({ codes, applicant }) {
  const hasCodes = codes?.length > 0;
  return (
    <div className="drivers">
      <div className="drivers__header">
        <div>
          <h4 className="drivers__title">What moved this estimate</h4>
          <p className="drivers__subtitle">
            Relative influence of each factor · gender is never used
          </p>
        </div>
      </div>

      {!hasCodes ? (
        <p className="drivers__empty">
          An explanation could not be produced for this application.
        </p>
      ) : (
        <div className="drivers__list">
          {codes.map((c) => {
            const maxImpact = Math.max(...codes.map((x) => Math.abs(x.impact)), 0.001);
            const raises = String(c.direction).includes("increase") || c.impact > 0;
            const width = Math.max((Math.abs(c.impact) / maxImpact) * 100, 4);
            const current =
              applicant && Object.prototype.hasOwnProperty.call(applicant, c.factor)
                ? fmtValue(c.factor, applicant[c.factor])
                : null;

            return (
              <div
                key={c.factor}
                className="driver"
                title={`Model attribution: ${c.impact.toFixed(3)}`}
              >
                <div className="driver__row">
                  <span className="driver__factor">
                    {label(c.factor)}
                    {current && <span className="driver__current">{current}</span>}
                  </span>
                  <span
                    className={`driver__effect ${
                      raises ? "driver__effect--raises" : "driver__effect--lowers"
                    }`}
                  >
                    {raises ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {raises ? "raises risk" : "lowers risk"}
                  </span>
                </div>
                <div className="driver__track">
                  <div
                    className={`driver__fill ${
                      raises ? "driver__fill--raises" : "driver__fill--lowers"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Result({ result, applicant }) {
  const cfg = CONFIG[result.decision] || CONFIG["Needs Manual Review"];
  const Icon = cfg.icon;
  const p = result.default_probability;
  const zoneNote =
    p <= 0.1
      ? result.decision === "Needs Manual Review"
        ? "Approval zone · unstable estimate"
        : "Approval zone"
      : p <= 0.2
      ? "Review band"
      : "Decline zone";

  return (
    <div className="result-card">
      <div className={`result-verdict result-verdict--${cfg.tone}`}>
        <div className="result-verdict__head">
          <span className="result-verdict__chip">
            <Icon size={13} strokeWidth={2} />
            {cfg.chip}
          </span>
          <span className="result-verdict__meta">{result.model_version} · calibrated</span>
        </div>
        <h2 className="result-verdict__title">{cfg.title}</h2>
        <p className="result-verdict__text">{cfg.text}</p>
      </div>

      <div className="result-stats">
        <div className="result-stat">
          <p className="result-stat__label">Default risk</p>
          <p className="result-stat__value">{pct(p)}</p>
          <p className="result-stat__note">{zoneNote}</p>
        </div>
        <div className="result-stat">
          <p className="result-stat__label">Confidence</p>
          <p className="result-stat__value">{pct(result.confidence_score)}</p>
          <p className="result-stat__note">Repayment probability</p>
        </div>
        <div className="result-stat">
          <p className="result-stat__label">Uncertainty</p>
          <p className="result-stat__value">{result.uncertainty_score.toFixed(3)}</p>
          <p className="result-stat__note">
            {result.uncertainty_score > 0.1 ? "High — review required" : "Stable estimate"}
          </p>
        </div>
      </div>

      <RiskMeter p={p} />

      <DriverList codes={result.reason_codes} applicant={applicant} />

      <p className="result-footnote">
        {result.application_id ? `Saved as ${result.application_id} · ` : "Not stored · "}
        Decision support only. The model does not make the final credit decision.
      </p>
    </div>
  );
}
