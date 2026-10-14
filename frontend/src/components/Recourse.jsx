import React from "react";
import {
  Lightbulb,
  ArrowRight,
  Sparkles,
  CheckCircle,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { label, fmtValue, pct } from "../fields.js";
import "./recourse.css";

export default function Recourse({
  decision,
  data,
  loading,
  error,
  onRun,
  onApply,
}) {
  if (decision === "Approved") return null;

  return (
    <div className="recourse-panel">
      <div className="recourse-panel__header">
        <div className="flex items-center gap-2.5">
          <div className="recourse-panel__icon-wrap">
            <Lightbulb size={18} />
          </div>
          <div>
            <h4 className="recourse-panel__title">
              Counterfactual Recourse Studio (DiCE Engine)
            </h4>
            <p className="recourse-panel__subtitle">
              Algorithmic recommendations to safely shift this applicant into the Approval Zone (p ≤ 9%)
            </p>
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={loading}
          className="btn-recourse"
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Optimizing via DiCE (~600ms)...</span>
            </>
          ) : data ? (
            <>
              <RefreshCw size={13} />
              <span>Re-run Optimization</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Compute Recourse Strategies</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="recourse-error">{error}</div>}

      {data && (
        <div className="recourse-results">
          <div className="recourse-message-bar">
            <span>{data.message}</span>
            <span className="recourse-message-bar__action">
              Apply 1 alternative pathway
            </span>
          </div>

          <div className="strategy-grid">
            {data.counterfactuals.map((cf, i) => (
              <div key={i} className="strategy-card">
                <div>
                  <div className="strategy-card__header">
                    <span className="strategy-card__number">
                      <span className="strategy-card__number-badge">{i + 1}</span>
                      Strategy Alternative {i + 1}
                    </span>
                    <span className="strategy-card__new-risk">
                      <TrendingDown size={11} /> New Default Risk: {pct(cf.new_default_probability)}
                    </span>
                  </div>

                  <div className="strategy-changes">
                    {cf.changes.map((c, j) => (
                      <div key={j} className="strategy-change-row">
                        <span className="strategy-change-row__feature">
                          {label(c.feature)}
                        </span>
                        <div className="strategy-change-row__values">
                          <span className="strategy-change-row__old">
                            {fmtValue(c.feature, c.current)}
                          </span>
                          <ArrowRight size={12} className="text-slate-600" />
                          <span className="strategy-change-row__new">
                            {fmtValue(c.feature, c.suggested)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onApply(cf)}
                  className="btn-apply-strategy"
                >
                  <CheckCircle size={14} />
                  <span>Apply Strategy To Form &amp; Re-Underwrite</span>
                </button>
              </div>
            ))}
          </div>

          <p className="recourse-disclaimer">
            * Note: Reductions in loan amount take immediate effect upon approval restructuring. Credit bureau enhancements represent actionable medium-term financial rehabilitation pathways.
          </p>
        </div>
      )}
    </div>
  );
}
