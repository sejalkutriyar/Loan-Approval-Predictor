import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import { label, fmtValue, pct } from "../fields.js";

export default function Recourse({ decision, data, loading, error, onRun, onApply }) {
  if (decision === "Approved") return null;
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
          <Lightbulb size={18} /> What would change this decision?
        </div>
        <button onClick={onRun} disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {loading ? "Searching (~1s)..." : data ? "Run again" : "Show suggestions"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {data && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-indigo-800">{data.message} Each option is an <b>alternative</b>: apply one of them, not all.</p>
          {data.counterfactuals.map((cf, i) => (
            <div key={i} className="rounded-lg border border-indigo-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Option {i + 1}</span>
                <span className="text-xs text-emerald-700">new default probability ≈ {pct(cf.new_default_probability)}</span>
              </div>
              <ul className="space-y-1 text-sm">
                {cf.changes.map((c, j) => (
                  <li key={j} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{label(c.feature)}:</span>
                    <span className="text-slate-500">{fmtValue(c.feature, c.current)}</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-semibold text-indigo-700">{fmtValue(c.feature, c.suggested)}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => onApply(cf)}
                className="mt-3 rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                Apply to form and re-evaluate
              </button>
            </div>
          ))}
          <p className="text-[11px] text-slate-500">External credit scores come from bureaus, so improving them is a longer-term action. Suggestions are model-based, not causal guarantees.</p>
        </div>
      )}
    </div>
  );
}
