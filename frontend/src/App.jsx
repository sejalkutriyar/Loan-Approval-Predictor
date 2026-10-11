import React, { useState } from "react";
import { Landmark } from "lucide-react";
import { PRESETS } from "./presets.js";
import { predict, recourse } from "./api.js";
import Form from "./components/Form.jsx";
import Result from "./components/Result.jsx";
import Recourse from "./components/Recourse.jsx";

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

  const setField = (k, v) => setApplicant((a) => ({ ...a, [k]: v }));

  const loadPreset = (p) => {
    setApplicant(clone(p.data)); setActive(p.id);
    setResult(null); setRec(null); setError(""); setRecError("");
  };

  const hasNaN = (a) => Object.values(a).some((v) => typeof v === "number" && Number.isNaN(v));

  const evaluate = async (data = applicant) => {
    if (hasNaN(data)) { setError("Please fill every numeric field."); return; }
    setLoading(true); setError(""); setRec(null); setRecError("");
    try { setResult(await predict(data)); }
    catch (e) { setError(e.message); setResult(null); }
    finally { setLoading(false); }
  };

  const runRecourse = async () => {
    setRecLoading(true); setRecError("");
    try { setRec(await recourse(applicant)); }
    catch (e) { setRecError(e.message); }
    finally { setRecLoading(false); }
  };

  const applySuggestion = (cf) => {
    const next = { ...applicant };
    cf.changes.forEach((c) => { next[c.feature] = c.suggested; });
    setApplicant(next);
    evaluate(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-600 p-2 text-white"><Landmark size={22} /></div>
        <div>
          <h1 className="text-xl font-semibold">Loan Approval Predictor</h1>
          <p className="text-xs text-slate-500">Calibrated default risk with uncertainty, SHAP reasons and counterfactual recourse</p>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Quick fill:</span>
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => loadPreset(p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active === p.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>
            {p.label} <span className="opacity-70">({p.hint})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Application</h2>
          <Form applicant={applicant} setField={setField} onSubmit={() => evaluate()} loading={loading} />
        </div>
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
          {!result && !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
              Pick a preset or fill the form, then press “Evaluate application”.
            </div>
          )}
          {result && (
            <>
              <Result result={result} />
              <Recourse decision={result.decision} data={rec} loading={recLoading} error={recError}
                onRun={runRecourse} onApply={applySuggestion} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
