import React from "react";
import {
  Lightbulb,
  ArrowRight,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { label, fmtValue, pct } from "../fields.js";
import "./recourse.css";

export default function Recourse({ decision, data, loading, error, onRun, onApply }) {
  if (decision === "Approved") return null;

  const hasOptions = data?.counterfactuals?.length > 0;

  return (
    <div className="recourse-panel">
      <div className="recourse-panel__header">
        <div className="recourse-panel__intro">
          <Lightbulb size={16} strokeWidth={1.75} className="recourse-panel__icon" />
          <div>
            <h4 className="recourse-panel__title">Improvement options</h4>
            <p className="recourse-panel__subtitle">
              Realistic changes that would move this application toward approval.
            </p>
          </div>
        </div>

        <button type="button" onClick={onRun} disabled={loading} className="btn-recourse">
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <RefreshCw size={13} />
              {data ? "Refresh options" : "Find improvement options"}
            </>
          )}
        </button>
      </div>

      {error && <div className="recourse-error">{error}</div>}

      {data && (
        <div className="recourse-results">
          <p className="recourse-message">{data.message}</p>

          {hasOptions ? (
            <div className="strategy-grid">
              {data.counterfactuals.map((cf, i) => (
                <div key={i} className="strategy-card">
                  <div className="strategy-card__header">
                    <span className="strategy-card__number">
                      <span className="strategy-card__number-badge">{i + 1}</span>
                      Option {i + 1}
                    </span>
                    <span className="strategy-card__new-risk">
                      New risk {pct(cf.new_default_probability)}
                    </span>
                  </div>

                  <div className="strategy-changes">
                    {cf.changes.map((c, j) => (
                      <div key={j} className="strategy-change-row">
                        <span className="strategy-change-row__feature">{label(c.feature)}</span>
                        <span className="strategy-change-row__values">
                          <span className="strategy-change-row__old">
                            {fmtValue(c.feature, c.current)}
                          </span>
                          <ArrowRight size={11} className="strategy-change-row__arrow" />
                          <span className="strategy-change-row__new">
                            {fmtValue(c.feature, c.suggested)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onApply(cf)}
                    className="btn-apply-strategy"
                  >
                    <CheckCircle size={13} />
                    Apply and re-assess
                  </button>
                </div>
              ))}
            </div>
          ) : (
            data.recourse_needed && (
              <p className="strategy-empty">
                No feasible combination was found within the allowed limits. A credit officer
                should review the file.
              </p>
            )
          )}

          <p className="recourse-disclaimer">
            Suggestions come from a counterfactual search over the model, not financial
            advice. Re-assessing shows the model&apos;s new estimate for the changed profile.
          </p>
        </div>
      )}
    </div>
  );
}
