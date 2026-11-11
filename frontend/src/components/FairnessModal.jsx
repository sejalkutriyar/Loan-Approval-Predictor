import React from "react";
import {
  ShieldAlert,
  Scale,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
  Layers,
} from "lucide-react";

export default function FairnessModal({ isOpen, onClose, report, loading, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Responsible AI &amp; Algorithmic Fairness Audit
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  ECOA / EEOC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Disparate Impact &amp; Demographic Parity Audit across Sensitive Attributes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5 text-sm text-slate-200">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-400">Evaluating cohort fairness across protected attributes...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && report && (
            <>
              {/* Four-Fifths / Demographic Parity Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  report.demographic_parity.eeoc_rule_passed
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                }`}
              >
                {report.demographic_parity.eeoc_rule_passed ? (
                  <CheckCircle2 size={22} className="shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle size={22} className="shrink-0 mt-0.5 text-amber-400" />
                )}
                <div className="space-y-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {report.demographic_parity.eeoc_rule_passed
                      ? "80% Four-Fifths Rule Satisfied (Non-Discriminatory)"
                      : "Borderline Parity Disparity Detected"}
                    <span className="text-xs px-2 py-0.2 rounded font-mono font-bold bg-slate-950/40">
                      Ratio: {(report.demographic_parity.disparate_impact_ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {report.recommendation}
                  </p>
                </div>
              </div>

              {/* Parity Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                    Female Approval Rate
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {(report.demographic_parity.female_approval_rate * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Avg default p: {(report.score_distribution.average_female_default_probability * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                    Male Approval Rate
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-400">
                    {(report.demographic_parity.male_approval_rate * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Avg default p: {(report.score_distribution.average_male_default_probability * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                    EEOC Benchmark Threshold
                  </span>
                  <div className="text-xl font-bold font-mono text-white">
                    80.0%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Four-Fifths Rule Requirement
                  </span>
                </div>
              </div>

              {/* Responsible AI Safeguards Accordion / Box */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-indigo-400" />
                  Active Model Governance &amp; Compliance Safeguards
                </h4>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Shielded Explainability (SHAP Filtering)
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <code className="text-indigo-300">CODE_GENDER</code> is strictly excluded from SHAP reason codes. The system never blames gender for a loan denial or manual review referral.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Immutable Counterfactual Constraints (DiCE)
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Algorithmic recourse prevents proposing changes to immutable demographic attributes (Age, Gender). Only financial levers (loan amount, credit bureau enhancement) are generated.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Info size={13} /> Cohort Size: {report?.cohort_size || 15} benchmark test profiles
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

