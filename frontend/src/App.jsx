import React, { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import {
  Building2,
  ShieldCheck,
  Scale,
  LogOut,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { PRESETS } from "./presets.js";
import {
  predict,
  recourse,
  getFairnessReport,
  getCurrentUser,
  getHealth,
  logout,
} from "./api.js";
import Form from "./components/Form.jsx";
import Result from "./components/Result.jsx";
import Recourse from "./components/Recourse.jsx";
import FairnessModal from "./components/FairnessModal.jsx";
import Analytics from "./components/Analytics.jsx";

const clone = (o) => JSON.parse(JSON.stringify(o));

const OUTCOME = {
  prime: { label: "Approved", className: "preset-card__hint--prime" },
  borderline: { label: "Manual review", className: "preset-card__hint--borderline" },
  high_risk: { label: "Declined", className: "preset-card__hint--high-risk" },
};

const DOT = {
  prime: "preset-card__dot--prime",
  borderline: "preset-card__dot--borderline",
  high_risk: "preset-card__dot--high-risk",
};

const inrShort = (v) => {
  if (!Number.isFinite(v)) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  return `₹${Math.round(v / 1000)}k`;
};

function presetMeta(data) {
  const score = Math.round(300 + Math.min(Math.max(data.EXT_SOURCE_2 ?? 0.5, 0), 1) * 600);
  const age = Math.round(-(data.DAYS_BIRTH ?? 0) / 365);
  return `${score} bureau score · ${inrShort(data.AMT_CREDIT)} loan · ${age} yrs`;
}

const PIPELINE_STEPS = [
  "Applicant data is encoded into the model's 171 input features",
  "The neural network estimates a calibrated default probability",
  "50 dropout passes measure how stable that estimate is",
  "Key drivers are attributed for the credit officer (gender excluded)",
  "A counterfactual search suggests achievable improvements",
];

const initialsOf = (name) => {
  const parts = String(name || "")
    .replace(/^Officer:\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "OF";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export default function App() {
  // ── Authentication state (hooks run unconditionally) ──
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("jwt_token"));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("jwt_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        })
        .catch(() => {
          logout();
          setIsLoggedIn(false);
          setCurrentUser(null);
        });
    }
  }, []);

  // ── Workspace view (analytics is admin-only) ──
  const [view, setView] = useState("intake");

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setView("intake");
    setFairnessReport(null);
    setResult(null);
    setRec(null);
    setResultStale(false);
    setError("");
    setRecError("");
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setView("intake");
  };

  // ── Dashboard state ──
  const [applicant, setApplicant] = useState(clone(PRESETS[1].data));
  const [active, setActive] = useState("borderline");
  const [result, setResult] = useState(null);
  const [resultStale, setResultStale] = useState(false);
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");
  const [recError, setRecError] = useState("");
  const [apiOnline, setApiOnline] = useState(null);
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const [fairnessReport, setFairnessReport] = useState(null);
  const [fairnessLoading, setFairnessLoading] = useState(false);
  const [fairnessError, setFairnessError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then(() => !cancelled && setApiOnline(true))
      .catch(() => !cancelled && setApiOnline(false));
    return () => {
      cancelled = true;
    };
  }, []);

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

  const setField = (k, v) => {
    setApplicant((a) => ({ ...a, [k]: v }));
    setActive("custom");
    if (result) {
      setResultStale(true);
      // Suggestions were computed for the previous profile; drop them so
      // "Apply and re-assess" cannot apply changes to a different applicant.
      setRec(null);
    }
  };

  const loadPreset = (p) => {
    setApplicant(clone(p.data));
    setActive(p.id);
    setResult(null);
    setResultStale(false);
    setRec(null);
    setError("");
    setRecError("");
  };

  const hasNaN = (a) =>
    Object.values(a).some((v) => typeof v === "number" && Number.isNaN(v));

  const evaluate = async (data = applicant) => {
    if (hasNaN(data)) {
      setError("Some numeric fields are empty. Fill them in before running the assessment.");
      return;
    }
    setLoading(true);
    setError("");
    setResultStale(false);
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
    setActive("custom");
    setRec(null);
    evaluate(next);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  const displayName = currentUser?.full_name || currentUser?.username || "Credit officer";
  const activePreset = PRESETS.find((p) => p.id === active);
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-brand">
            <span className="app-brand__mark" aria-hidden="true">
              <Building2 size={18} strokeWidth={1.75} />
            </span>
            <span className="app-brand__text">
              <span className="app-brand__name">Loan Approval Predictor</span>
              <span className="app-brand__sub">
                Credit decision support · Home Credit dataset
              </span>
            </span>
          </div>

          <div className="app-header__actions">
            <span
              className={`status-pill${
                apiOnline === true
                  ? " status-pill--online"
                  : apiOnline === false
                  ? " status-pill--offline"
                  : ""
              }`}
              title="Backend model service status"
            >
              <span className="status-pill__dot" />
              {apiOnline === null ? "Checking API" : apiOnline ? "API online" : "API unreachable"}
            </span>

            <button
              type="button"
              onClick={openFairnessAudit}
              className="header-button"
              title="Open the fairness and audit report"
              aria-label="Open the fairness and audit report"
            >
              <Scale size={15} strokeWidth={1.75} />
              <span className="hidden lg:inline">Fairness</span>
            </button>

            <div className="header-user">
              <span className="header-user__avatar" aria-hidden="true">
                {initialsOf(displayName)}
              </span>
              <span className="header-user__meta">
                <span className="header-user__name">{displayName}</span>
                <span className="header-user__role">{currentUser?.role || "Officer"}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="header-button header-button--quiet"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} strokeWidth={1.75} />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {isAdmin && (
          <div className="view-tabs" role="tablist" aria-label="Workspace views">
            <button
              id="tab-intake"
              type="button"
              role="tab"
              aria-selected={view === "intake"}
              aria-controls="panel-intake"
              onClick={() => setView("intake")}
              className={`view-tab${view === "intake" ? " view-tab--active" : ""}`}
            >
              <ClipboardList size={14} strokeWidth={1.9} aria-hidden="true" />
              Underwriting intake
            </button>
            <button
              id="tab-analytics"
              type="button"
              role="tab"
              aria-selected={view === "analytics"}
              aria-controls="panel-analytics"
              onClick={() => setView("analytics")}
              className={`view-tab${view === "analytics" ? " view-tab--active" : ""}`}
            >
              <BarChart3 size={14} strokeWidth={1.9} aria-hidden="true" />
              Analytics &amp; audit
            </button>
          </div>
        )}

        {isAdmin && view === "analytics" ? (
          <div id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics">
            <Analytics />
          </div>
        ) : (
        <div
          id="panel-intake"
          role="tabpanel"
          aria-labelledby={isAdmin ? "tab-intake" : undefined}
          className="space-y-5"
        >
        <section className="preset-section" aria-label="Sample applications">
          <div className="preset-section__header">
            <div>
              <h2 className="preset-section__title">Sample applications</h2>
              <p className="preset-section__subtitle">
                Load a prepared applicant, or edit any field to run your own case.
              </p>
            </div>
            <span className="hidden text-[12px] text-subtle sm:inline">
              {activePreset ? activePreset.label : "Custom applicant"}
            </span>
          </div>

          <div className="preset-grid">
            {PRESETS.map((p) => {
              const isSelected = active === p.id;
              const outcome = OUTCOME[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadPreset(p)}
                  aria-pressed={isSelected}
                  className={`preset-card${isSelected ? " preset-card--active" : ""}`}
                >
                  <span className="preset-card__header">
                    <span className="preset-card__label">
                      <span className={DOT[p.id]} aria-hidden="true" />
                      {p.label}
                    </span>
                    <span className={outcome.className}>{outcome.label}</span>
                  </span>
                  <span className="preset-card__meta">{presetMeta(p.data)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="dashboard-grid">
          <div className="dashboard-left">
            <div className="form-panel">
              <div className="form-panel__header">
                <div>
                  <h2 className="form-panel__title">Loan application</h2>
                  <p className="form-panel__subtitle">
                    Income, loan terms and bureau records used by the model.
                  </p>
                </div>
                <span className="form-panel__profile-badge">
                  {activePreset ? activePreset.label : "Custom"}
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

          <div className="dashboard-right">
            {error && (
              <div className="error-banner" role="alert">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <div>
                  <p className="error-banner__title">Assessment could not run</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {result && resultStale && (
              <div className="stale-banner" role="status">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>The application changed after this assessment was produced.</span>
                  <button
                    type="button"
                    onClick={() => evaluate()}
                    className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                  >
                    Re-run assessment
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="standby-panel">
                <span className="standby-panel__icon" aria-hidden="true">
                  <ShieldCheck size={20} strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="standby-panel__title">No assessment yet</h3>
                  <p className="standby-panel__subtitle">
                    Review the application on the left, then run the assessment to see the
                    decision, confidence and key drivers.
                  </p>
                </div>

                <ol className="pipeline-checklist">
                  {PIPELINE_STEPS.map((step, i) => (
                    <li key={step} className="pipeline-checklist__item">
                      <span
                        className="w-4 shrink-0 font-mono text-[11px] text-subtle"
                        aria-hidden="true"
                      >
                        0{i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="pipeline-checklist__footer">
                  <span>Approved at ≤10% default risk</span>
                  <span>Declined above 20%</span>
                </div>
              </div>
            )}

            {result && (
              <>
                <Result result={result} applicant={applicant} />
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
        </div>
        )}
      </main>

      <footer className="app-footer">
        Internal decision-support prototype · Not a final credit decision · Home Credit dataset
      </footer>

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
