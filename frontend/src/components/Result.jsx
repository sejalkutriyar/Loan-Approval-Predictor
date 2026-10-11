import React from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { label, pct } from "../fields.js";

const STYLE = {
  "Approved": { cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: CheckCircle2 },
  "Rejected": { cls: "bg-rose-100 text-rose-800 border-rose-300", Icon: XCircle },
  "Needs Manual Review": { cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: AlertTriangle },
};

function Metric({ title, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

// Risk meter scale 0 to 0.40. Zones: approve <= 0.10, review 0.10-0.20, reject > 0.20.
function RiskMeter({ p }) {
  const MAX = 0.4;
  const pos = Math.min(p, MAX) / MAX * 100;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-xs text-slate-500">Default probability on the decision scale</div>
      <div className="relative h-3 overflow-hidden rounded-full">
        <div className="absolute inset-y-0 left-0 bg-emerald-400" style={{ width: "25%" }} />
        <div className="absolute inset-y-0 bg-amber-400" style={{ left: "25%", width: "25%" }} />
        <div className="absolute inset-y-0 bg-rose-400" style={{ left: "50%", width: "50%" }} />
      </div>
      <div className="relative mt-1 h-5">
        <div className="absolute -top-4 h-5 w-0.5 bg-slate-900" style={{ left: `${pos}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>0%</span><span>Approve ≤ 10%</span><span>Reject &gt; 20%</span><span>40%+</span>
      </div>
    </div>
  );
}

function Reasons({ codes }) {
  if (!codes?.length) return null;
  const maxImpact = Math.max(...codes.map((c) => Math.abs(c.impact)), 0.0001);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 text-sm font-semibold">Why this decision (SHAP reason codes)</div>
      <ul className="space-y-2">
        {codes.map((c, i) => {
          const up = String(c.direction).includes("increase");
          return (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="w-56 shrink-0 truncate" title={c.factor}>{label(c.factor)}</span>
              <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                <div className={`h-2.5 rounded-full ${up ? "bg-rose-500" : "bg-emerald-500"}`}
                  style={{ width: `${(Math.abs(c.impact) / maxImpact) * 100}%` }} />
              </div>
              <span className={`w-28 text-right text-xs ${up ? "text-rose-600" : "text-emerald-600"}`}>
                {up ? "raises risk" : "lowers risk"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Result({ result }) {
  const s = STYLE[result.decision] || STYLE["Needs Manual Review"];
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${s.cls}`}>
        <s.Icon size={22} />
        <div>
          <div className="text-lg font-semibold">{result.decision}</div>
          <div className="text-xs opacity-80">model {result.model_version}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric title="Default probability (calibrated)" value={pct(result.default_probability)} />
        <Metric title="Confidence (1 − p)" value={pct(result.confidence_score)} />
        <Metric title="Uncertainty (MC Dropout σ)" value={result.uncertainty_score.toFixed(3)}
          sub={result.uncertainty_score > 0.1 ? "above 0.10, forces manual review" : "within limit"} />
      </div>
      <RiskMeter p={result.default_probability} />
      <Reasons codes={result.reason_codes} />
    </div>
  );
}
