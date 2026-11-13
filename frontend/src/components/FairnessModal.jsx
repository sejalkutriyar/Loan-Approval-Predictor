import React, { useEffect, useRef } from "react";
import {
  ShieldAlert,
  Scale,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";

const fmtTimestamp = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export default function FairnessModal({ isOpen, onClose, report, loading, error }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
      );

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = focusables();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const parity = report?.demographic_parity;
  const scores = report?.score_distribution;
  const passed = parity?.eeoc_rule_passed;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fairness-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Scale size={16} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 id="fairness-title" className="text-[14px] font-semibold text-ink">
                Fairness and audit
              </h3>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Gender parity across the benchmark cohort · ECOA / EEOC four-fifths rule
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close fairness report"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-paper-2 hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 text-[12.5px] sm:px-6">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
              <p className="text-[11.5px] text-muted">Scoring the benchmark cohort…</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rejected-line bg-rejected-soft px-3 py-2.5 text-[12px] text-rejected">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && report && (
            <>
              <div
                className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 ${
                  passed
                    ? "border-approved-line bg-approved-soft text-approved"
                    : "border-review-line bg-review-soft text-review"
                }`}
              >
                {passed ? (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-[12.5px] font-semibold">
                    {passed
                      ? "Four-fifths rule satisfied"
                      : "Disparate impact below the 80% threshold"}
                  </p>
                  <p className="mt-1 leading-relaxed opacity-90">{report.recommendation}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-paper-2 px-3.5 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                    Female approval rate
                  </p>
                  <p className="mt-1 font-mono text-[19px] font-semibold text-ink">
                    {(parity.female_approval_rate * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 text-[10.5px] text-muted">
                    Avg default p:{" "}
                    {(scores.average_female_default_probability * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-paper-2 px-3.5 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                    Male approval rate
                  </p>
                  <p className="mt-1 font-mono text-[19px] font-semibold text-ink">
                    {(parity.male_approval_rate * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 text-[10.5px] text-muted">
                    Avg default p:{" "}
                    {(scores.average_male_default_probability * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-paper-2 px-3.5 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                    Disparate impact ratio
                  </p>
                  <p
                    className={`mt-1 font-mono text-[19px] font-semibold ${
                      passed ? "text-approved" : "text-review"
                    }`}
                  >
                    {(parity.disparate_impact_ratio * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 text-[10.5px] text-muted">
                    Required: ≥ {(parity.eeoc_four_fifths_threshold * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  <ShieldAlert size={13} className="text-brand" />
                  Model safeguards
                </h4>

                <div className="flex items-start gap-2.5 rounded-lg border border-line bg-paper-2 px-3.5 py-3">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-[12px] font-medium text-ink">
                      Gender is excluded from explanations
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      Gender never appears in the reason codes shown to a credit officer, so it
                      can never be cited as the cause of a decline.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-line bg-paper-2 px-3.5 py-3">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-[12px] font-medium text-ink">
                      Improvement options only use changeable factors
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      Recommendations cover loan terms and bureau scores. Age and gender are
                      never proposed as changes.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper-2/60 px-5 py-3 text-[11px] text-subtle sm:px-6">
          <span className="flex items-center gap-1.5">
            <Info size={13} />
            {report?.cohort_size ? `${report.cohort_size} benchmark profiles` : "Benchmark cohort"}
            {report?.audit_timestamp ? ` · ${fmtTimestamp(report.audit_timestamp)}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-paper-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


