import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Cpu,
  Layers,
  Sparkles,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  Clock,
  User,
  SlidersHorizontal,
  Scale,
} from "lucide-react";
import { PRESETS } from "./presets.js";
import { predict, recourse, getFairnessReport } from "./api.js";
import Form from "./components/Form.jsx";
import Result from "./components/Result.jsx";
import Recourse from "./components/Recourse.jsx";
import FairnessModal from "./components/FairnessModal.jsx";

const clone = (o) => JSON.parse(JSON.stringify(o));

export default function App() {
  const [applicant, setApplicant] = useState(clone(PRESETS[1].data));
  const [active, setActive] = useState("borderline");
  const [result, setResult] = useState(null);
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");
  const [recError, setRecError] = useState("");
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const [fairnessReport, setFairnessReport] = useState(null);
  const [fairnessLoading, setFairnessLoading] = useState(false);
  const [fairnessError, setFairnessError] = useState("");

  const openFairnessAudit = async () => {
    setFairnessOpen(true);
    if (!fairnessReport) {
      setFairnessLoading(true);
      setFairnessError("");
      try {
        const rep = await getFairnessReport();
        setFairnessReport(rep);
      } catch (err) {
        setFairnessError(err.message);
      } finally {
        setFairnessLoading(false);
      }
    }
  };

  const setField = (k, v) => setApplicant((a) => ({ ...a, [k]: v }));

  const loadPreset = (p) => {
    setApplicant(clone(p.data));
    setActive(p.id);
    setResult(null);
    setRec(null);
    setError("");
    setRecError("");
  };

  const hasNaN = (a) =>
    Object.values(a).some((v) => typeof v === "number" && Number.isNaN(v));

  const evaluate = async (data = applicant) => {
    if (hasNaN(data)) {
      setError("Please ensure all financial and numerical fields are filled.");
      return;
    }
    setLoading(true);
    setError("");
    setRec(null);
    setRecError("");
    try {
      const res = await predict(data);
      setResult(res);
    } catch (e) {
      setError(e.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const runRecourse = async () => {
    setRecLoading(true);
    setRecError("");
    try {
      const r = await recourse(applicant);
      setRec(r);
    } catch (e) {
      setRecError(e.message);
    } finally {
      setRecLoading(false);
    }
  };

  const applySuggestion = (cf) => {
    const next = { ...applicant };
    cf.changes.forEach((c) => {
      next[c.feature] = c.suggested;
    });
    setApplicant(next);
    evaluate(next);
  };

  return (
    <div className="app-shell">
      {/* 1. Institutional Top Navigation Bar */}
      <header className="app-header">
        <div className="app-header__inner">
          {/* Logo & Platform ID */}
          <div className="flex items-center gap-3">
            <div className="app-header__logo-wrap">
              <div className="app-header__logo-inner">
                <Building2 className="text-indigo-400" size={20} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="app-header__brand-name">
                  Loan Approval Predictor
                </h1>
              </div>
              <p className="app-header__subtitle">
                ML-Powered Credit Assessment &amp; Risk Prediction • Home Credit Dataset
              </p>
            </div>
          </div>

          {/* System Telemetry & Badges */}
          <div className="app-header__telemetry">
            <div className="badge-connected">
              <span className="badge-connected__dot" />
              <span>FastAPI Connected</span>
            </div>

            <div className="badge-pill">
              <Cpu size={12} className="text-indigo-400" />
              <span>ANN-v1 Production (171-D)</span>
            </div>

            <div className="badge-pill">
              <User size={12} className="text-slate-400" />
              <span>Officer: Sejal Kumari</span>
            </div>

            <button
              onClick={openFairnessAudit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all shadow-sm"
              title="View Responsible AI & Fairness Audit Report"
            >
              <Scale size={13} className="text-indigo-400" />
              <span>Fairness &amp; Audit</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Content */}
      <main className="app-main">
        {/* Demo Applicant Profiles Switcher */}
        <section className="preset-section">
          <div className="preset-section__header">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-indigo-400" />
              <h2 className="preset-section__title">
                Demo Profiles: [Prime] [Average] [High Risk]
              </h2>
            </div>
            <span className="preset-section__subtitle">
              Click any profile to test different applicant scenarios
            </span>
          </div>

          <div className="preset-grid">
            {PRESETS.map((p) => {
              const isSelected = active === p.id;
              const isPrime = p.id === "prime";
              const isBorderline = p.id === "borderline";
              const isHigh = p.id === "high_risk";

              return (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className={`group preset-card${isSelected ? " preset-card--active" : ""}`}
                >
                  <div className="preset-card__header">
                    <span className="preset-card__label">
                      <span
                        className={
                          isPrime
                            ? "preset-card__dot--prime"
                            : isBorderline
                            ? "preset-card__dot--borderline"
                            : "preset-card__dot--high-risk"
                        }
                      />
                      {p.label}
                    </span>
                    <span
                      className={
                        isPrime
                          ? "preset-card__hint--prime"
                          : isBorderline
                          ? "preset-card__hint--borderline"
                          : "preset-card__hint--high-risk"
                      }
                    >
                      {p.hint}
                    </span>
                  </div>

                  <p className="preset-card__desc">
                    {isPrime
                      ? "High Credit Score • Low Debt • Gets Approved"
                      : isBorderline
                      ? "Moderate Score • ₹9.0L Loan • Needs Manual Review"
                      : "Low Credit Score • High Debt • Gets Rejected"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Underwriting Intake & Dossier Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Application Form (7 cols) */}
          <div className="dashboard-left">
            <div className="form-panel">
              <div className="form-panel__header">
                <div>
                  <h2 className="form-panel__title">
                    <span>Loan Application Details</span>
                  </h2>
                  <p className="form-panel__subtitle">
                    Enter applicant financial details or test with demo profiles above
                  </p>
                </div>
                <span className="form-panel__profile-badge">
                  Profile: {active.toUpperCase()}
                </span>
              </div>

              <Form
                applicant={applicant}
                setField={setField}
                onSubmit={() => evaluate()}
                loading={loading}
              />
            </div>
          </div>

          {/* Right Column: Underwriting Verdict & XAI Dossier (5 cols) */}
          <div className="dashboard-right">
            {error && (
              <div className="error-banner">
                <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="error-banner__title">Inference Request Failed</h4>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Standby State (Before clicking Evaluate) */}
            {!result && !error && (
              <div className="standby-panel">
                <div className="standby-panel__icon">
                  <ShieldCheck size={28} />
                </div>

                <div>
                  <h3 className="standby-panel__title">
                    Underwriting Dossier: Standby
                  </h3>
                  <p className="standby-panel__subtitle">
                    Select a benchmark profile above or modify application parameters, then execute the neural underwriting engine.
                  </p>
                </div>

                {/* Pipeline Feature Checklist */}
                <div className="pipeline-checklist">
                  <div className="pipeline-checklist__item">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    <span>One-Hot Preprocessing (171 Dimensions)</span>
                  </div>
                  <div className="pipeline-checklist__item">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    <span>50-Pass Monte Carlo Dropout (Epistemic σ)</span>
                  </div>
                  <div className="pipeline-checklist__item">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    <span>Platt-Scaled Empirical Probability Calibration</span>
                  </div>
                  <div className="pipeline-checklist__item">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    <span>SHAP Kernel Attribution (Gender Excluded)</span>
                  </div>
                  <div className="pipeline-checklist__item">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    <span>DiCE Counterfactual Optimization (Recourse)</span>
                  </div>
                </div>

                <div className="pipeline-checklist__footer">
                  <span>Thresholds: ≤10% Approved</span>
                  <span>&gt;20% Decline</span>
                </div>
              </div>
            )}

            {/* Evaluated Result & Recourse */}
            {result && (
              <>
                <Result result={result} />
                <Recourse
                  decision={result.decision}
                  data={rec}
                  loading={recLoading}
                  error={recError}
                  onRun={runRecourse}
                  onApply={applySuggestion}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="app-footer">
        Loan Approval Decision Support System • Advanced Data Science OJT • PyTorch • FastAPI • React
      </footer>

      {/* 5. Responsible AI Fairness Audit Modal */}
      <FairnessModal
        isOpen={fairnessOpen}
        onClose={() => setFairnessOpen(false)}
        report={fairnessReport}
        loading={fairnessLoading}
        error={fairnessError}
      />
    </div>
  );
}
