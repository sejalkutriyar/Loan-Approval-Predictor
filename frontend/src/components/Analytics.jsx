import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  RefreshCw,
  Target,
} from "lucide-react";
import { getAdminMetrics, getApplications } from "../api.js";

const pct = (v, digits = 1) =>
  v == null || Number.isNaN(v) ? "—" : `${(v * 100).toFixed(digits)}%`;

const num = (v) =>
  v == null || Number.isNaN(v) ? "—" : Number(v).toLocaleString("en-IN");

const fixed = (v, digits = 4) =>
  v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(digits);

const fmtTimestamp = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const cellShare = (value, total) => (total ? value / total : 0);

const MATRIX_CELLS = [
  {
    key: "true_negatives",
    tone: "correct",
    title: "Correctly approved",
    detail: "repayment predicted, and the applicant repaid",
  },
  {
    key: "false_positives",
    tone: "error",
    title: "Good customer declined",
    detail: "default predicted, but the applicant repaid",
  },
  {
    key: "false_negatives",
    tone: "error",
    title: "Default approved",
    detail: "repayment predicted, but the applicant defaulted",
  },
  {
    key: "true_positives",
    tone: "correct",
    title: "Correctly declined",
    detail: "default predicted, and the applicant defaulted",
  },
];

function KpiCard({ icon: Icon, label, value, hint, tag, tagTone }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__top">
        <span className="kpi-card__label">
          <Icon size={13} strokeWidth={1.9} aria-hidden="true" />
          {label}
        </span>
        {tag && <span className={`kpi-card__tag kpi-card__tag--${tagTone}`}>{tag}</span>}
      </div>
      <p className="kpi-card__value">{value}</p>
      <p className="kpi-card__hint">{hint}</p>
    </div>
  );
}

function ConfusionMatrix({ evaluation }) {
  const { confusion_matrix: cm, n_records: total, metrics, cross_validation: cv } = evaluation;
  const [selected, setSelected] = useState(null);
  const active = MATRIX_CELLS.find((c) => c.key === selected);

  return (
    <section className="panel" aria-labelledby="matrix-title">
      <div className="panel__header">
        <div>
          <h2 id="matrix-title" className="panel__title">
            Confusion matrix
          </h2>
          <p className="panel__subtitle">
            Positive class = default · threshold p ≥ {fixed(evaluation.threshold, 2)}
          </p>
        </div>
        <span className="panel-tag">{num(total)} records</span>
      </div>

      <div className="cm" role="group" aria-label="Confusion matrix, select a cell for details">
        <span className="cm__corner" aria-hidden="true" />
        <span className="cm__col-label">Predicted repay</span>
        <span className="cm__col-label">Predicted default</span>

        <span className="cm__row-label">Actually repaid</span>
        {MATRIX_CELLS.slice(0, 2).map((cell) => (
          <MatrixCell
            key={cell.key}
            cell={cell}
            value={cm[cell.key]}
            total={total}
            selected={selected === cell.key}
            onSelect={() => setSelected(cell.key)}
          />
        ))}

        <span className="cm__row-label">Actually defaulted</span>
        {MATRIX_CELLS.slice(2).map((cell) => (
          <MatrixCell
            key={cell.key}
            cell={cell}
            value={cm[cell.key]}
            total={total}
            selected={selected === cell.key}
            onSelect={() => setSelected(cell.key)}
          />
        ))}
      </div>

      <p className="cm-detail" aria-live="polite">
        {active ? (
          <>
            <strong>{active.title}</strong> — {active.detail}: {num(cm[active.key])} of{" "}
            {num(total)} records ({pct(cellShare(cm[active.key], total))}).
          </>
        ) : (
          "Select a cell to see what it counts. Cells are coloured by whether the outcome was correct."
        )}
      </p>

      <dl className="cm-metrics">
        <div>
          <dt>Precision</dt>
          <dd>{pct(metrics.precision)}</dd>
        </div>
        <div>
          <dt>Recall</dt>
          <dd>{pct(metrics.recall)}</dd>
        </div>
        <div>
          <dt>F1 score</dt>
          <dd>{pct(metrics.f1_score)}</dd>
        </div>
      </dl>

      <div className="cm-footer">
        <span className="cm-footer__badge">Production · ANN</span>
        <span>
          5-fold CV · ANN {fixed(cv.ann.roc_auc, 3)} AUC / {fixed(cv.ann.f1_score, 3)} F1 ·
          TabTransformer {fixed(cv.tab_transformer.roc_auc, 3)} /{" "}
          {fixed(cv.tab_transformer.f1_score, 3)}
        </span>
      </div>
    </section>
  );
}

function MatrixCell({ cell, value, total, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${cell.title}: ${num(value)} records, ${pct(cellShare(value, total))} of the validation set`}
      onClick={onSelect}
      className={`cm-cell cm-cell--${cell.tone}${selected ? " cm-cell--selected" : ""}`}
    >
      <span className="cm-cell__label">{cell.title}</span>
      <span className="cm-cell__value">{num(value)}</span>
      <span className="cm-cell__share">{pct(cellShare(value, total))} of records</span>
    </button>
  );
}

function PlattCurve({ coefficient, intercept }) {
  const W = 132;
  const H = 72;
  const L = 20;
  const R = 5;
  const T = 8;
  const B = 16;
  const x = (v) => L + v * (W - L - R);
  const y = (v) => H - B - v * (H - B - T);

  const line = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 48; i += 1) {
      const raw = i / 48;
      const calibrated = 1 / (1 + Math.exp(-(coefficient * raw + intercept)));
      points.push(`${x(raw).toFixed(1)},${y(calibrated).toFixed(1)}`);
    }
    return points.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coefficient, intercept]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="calib-chart"
      role="img"
      aria-label="Platt scaling curve from raw model probability to calibrated probability"
    >
      {[0, 0.25, 0.5].map((v) => (
        <line
          key={v}
          x1={L}
          y1={y(v)}
          x2={W - R}
          y2={y(v)}
          className="calib-chart__grid"
        />
      ))}
      <line x1={L} y1={y(0)} x2={W - R} y2={y(0)} className="calib-chart__axis" />
      <line x1={L} y1={y(0)} x2={L} y2={y(0.5)} className="calib-chart__axis" />
      <polyline points={line} className="calib-chart__curve" />
      <text x={L - 3} y={y(0.5) + 2} textAnchor="end" className="calib-chart__tick">
        50%
      </text>
      <text x={L - 3} y={y(0) + 2} textAnchor="end" className="calib-chart__tick">
        0
      </text>
      <text x={L} y={H - 4} textAnchor="middle" className="calib-chart__tick">
        0
      </text>
      <text x={W - R} y={H - 4} textAnchor="end" className="calib-chart__tick">
        1
      </text>
    </svg>
  );
}

function Calibration({ calibration }) {
  const { coefficient, intercept, table, brier_score: brier, brier_note: brierNote } = calibration;

  return (
    <section className="panel" aria-labelledby="calibration-title">
      <div className="panel__header">
        <div>
          <h2 id="calibration-title" className="panel__title">
            Calibration — Platt scaling
          </h2>
          <p className="panel__subtitle">
            Fitted on MC-Dropout mean probabilities from the validation split
          </p>
        </div>
        <span className="panel-tag">Validation</span>
      </div>

      <div className="calib-overview">
        <div>
          <p className="calib-formula">
            p<sub>cal</sub> = σ({fixed(coefficient, 3)} × p<sub>raw</sub> −{" "}
            {fixed(Math.abs(intercept), 3)})
          </p>
          <p className="calib-caption">
            Raw network output → calibrated default probability (x: raw, y: calibrated).
          </p>
          <div className="calib-brier">
            <span className="calib-brier__label">Brier score</span>
            <span className="calib-brier__value">{brier == null ? "—" : fixed(brier, 4)}</span>
          </div>
        </div>
        <PlattCurve coefficient={coefficient} intercept={intercept} />
      </div>

      <table className="calib-table">
        <thead>
          <tr>
            <th scope="col">Calibrated p ≤</th>
            <th scope="col">Share of applicants</th>
            <th scope="col">Actual default rate</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row) => (
            <tr key={row.max_probability}>
              <td className="calib-table__threshold">{fixed(row.max_probability, 2)}</td>
              <td>
                <div className="calib-table__share">
                  <span className="calib-track">
                    <span
                      className="calib-bar"
                      style={{ width: pct(row.share_of_applicants) }}
                    />
                  </span>
                  <span className="calib-table__num">{pct(row.share_of_applicants)}</span>
                </div>
              </td>
              <td className="calib-table__num">{pct(row.actual_default_rate, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {brier == null && (
        <p className="calib-note">
          <Info size={13} className="mt-[1px] shrink-0" aria-hidden="true" />
          <span>{brierNote}</span>
        </p>
      )}
    </section>
  );
}

function DecisionChip({ decision }) {
  const tone =
    decision === "Approved"
      ? "approved"
      : decision === "Rejected"
      ? "rejected"
      : "review";
  return <span className={`chip chip--${tone}`}>{decision || "—"}</span>;
}

function AuditTable({ applications, loading, error, onRefresh }) {
  return (
    <section className="panel audit-panel" aria-labelledby="audit-title">
      <div className="panel__header">
        <div>
          <h2 id="audit-title" className="panel__title">
            Recent applications
          </h2>
          <p className="panel__subtitle">
            Newest first · {applications ? `${num(applications.length)} records` : "loading"} ·
            full organisation scope
          </p>
        </div>
        <button
          type="button"
          className="analytics-refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="audit-error" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!error && applications && applications.length === 0 && (
        <div className="audit-empty">
          <CheckCircle2 size={18} className="shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="audit-empty__title">No applications yet</p>
            <p className="audit-empty__text">
              Run an assessment from the underwriting intake to populate the audit trail.
            </p>
          </div>
        </div>
      )}

      {applications && applications.length > 0 && (
        <div className="audit-scroll">
          <table className="audit-table">
            <caption className="sr-only">
              Recent loan applications with decision and review status
            </caption>
            <thead>
              <tr>
                <th scope="col">Application</th>
                <th scope="col">Submitted</th>
                <th scope="col">Officer</th>
                <th scope="col" className="audit-table__num">
                  Default risk
                </th>
                <th scope="col">Decision</th>
                <th scope="col">Review</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="audit-table__id">{app.id}</td>
                  <td className="audit-table__time">{fmtTimestamp(app.created_at)}</td>
                  <td className="audit-table__officer">{app.officer || "—"}</td>
                  <td className="audit-table__num">{pct(app.default_probability)}</td>
                  <td>
                    <DecisionChip decision={app.decision} />
                  </td>
                  <td>
                    {app.decision === "Needs Manual Review" ? (
                      <span className="chip chip--review">Pending</span>
                    ) : (
                      <span className="chip chip--auto">Auto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [applications, setApplications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableError, setTableError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setTableError("");

    const [metricsResult, appsResult] = await Promise.allSettled([
      getAdminMetrics(),
      getApplications({ limit: 20 }),
    ]);

    if (metricsResult.status === "fulfilled") {
      setMetrics(metricsResult.value);
    } else {
      setError(metricsResult.reason?.message || "Could not load model metrics.");
    }

    if (appsResult.status === "fulfilled") {
      setApplications(appsResult.value);
    } else {
      setTableError(appsResult.reason?.message || "Could not load the audit trail.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !metrics) {
    return (
      <div className="analytics-page">
        <div className="audit-error" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{error}</span>
            <button type="button" className="underline underline-offset-2" onClick={load}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
          <p>Loading model evaluation…</p>
        </div>
      </div>
    );
  }

  const { evaluation, operational } = metrics;

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">Admin workspace</p>
          <h1 className="analytics-title">Model performance & audit</h1>
          <p className="analytics-subtitle">
            Validation evidence for the production ANN, plus live application volumes from this
            deployment.
          </p>
        </div>
        <button
          type="button"
          className="analytics-refresh"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </header>

      <div className="kpi-grid">
        <KpiCard
          icon={Target}
          label="Model accuracy"
          value={pct(evaluation.metrics.accuracy)}
          hint={`Validation · ${num(evaluation.n_records)} records`}
          tag="Offline"
          tagTone="offline"
        />
        <KpiCard
          icon={Activity}
          label="ROC-AUC"
          value={fixed(evaluation.metrics.roc_auc)}
          hint={`5-fold CV ${fixed(evaluation.cross_validation.ann.roc_auc, 3)} ± ${fixed(
            evaluation.cross_validation.ann.roc_auc_std,
            3
          )}`}
          tag="Offline"
          tagTone="offline"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approval rate"
          value={pct(operational.approval_rate)}
          hint={`${num(operational.approved)} approved of ${num(
            operational.total_applications
          )} applications`}
          tag="Live"
          tagTone="live"
        />
        <KpiCard
          icon={Gauge}
          label="Avg epistemic uncertainty"
          value={fixed(operational.average_uncertainty)}
          hint="MC Dropout σ · 50 passes"
          tag="Live"
          tagTone="live"
        />
      </div>

      <div className="analytics-grid">
        <div className="analytics-grid__matrix">
          <ConfusionMatrix evaluation={evaluation} />
        </div>
        <div className="analytics-grid__calibration">
          <Calibration calibration={evaluation.calibration} />
        </div>
      </div>

      <AuditTable
        applications={applications}
        loading={loading}
        error={tableError}
        onRefresh={load}
      />
    </div>
  );
}
