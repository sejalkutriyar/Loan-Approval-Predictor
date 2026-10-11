import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PRIMARY_KEYS, INCOME_TYPES, EDUCATION_TYPES, HOUSING_TYPES, label } from "../fields.js";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

function Field({ name, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{name}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Num({ value, onChange, step = "any", min, max }) {
  return (
    <input
      className={inputCls} type="number" step={step} min={min} max={max}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
    />
  );
}

function Select({ value, options, onChange }) {
  const opts = options.includes(value) ? options : [value, ...options];
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function Form({ applicant, setField, onSubmit, loading }) {
  const [open, setOpen] = useState(false);
  const ageYears = Math.round(Math.abs(applicant.DAYS_BIRTH) / 365);
  const empYears = Math.round((Math.abs(applicant.DAYS_EMPLOYED) / 365) * 10) / 10;
  const restKeys = Object.keys(applicant).filter((k) => !PRIMARY_KEYS.includes(k));

  const money = (k, hint) => (
    <Field name={label(k)} hint={hint}><Num value={applicant[k]} min={0} onChange={(v) => setField(k, v)} /></Field>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Loan details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {money("AMT_CREDIT")}{money("AMT_ANNUITY")}{money("AMT_GOODS_PRICE")}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Income & work</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {money("AMT_INCOME_TOTAL")}
          <Field name={label("NAME_INCOME_TYPE")}>
            <Select value={applicant.NAME_INCOME_TYPE} options={INCOME_TYPES} onChange={(v) => setField("NAME_INCOME_TYPE", v)} />
          </Field>
          <Field name="Employment length (years)" hint="stored internally as negative days">
            <Num value={empYears} min={0} step="0.1"
              onChange={(v) => setField("DAYS_EMPLOYED", Number.isFinite(v) ? Math.round(-v * 365) : NaN)} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">External credit scores (0 to 1)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {["EXT_SOURCE_2", "EXT_SOURCE_3"].map((k) => (
            <Field key={k} name={label(k)}>
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="1" step="0.01" className="w-full accent-indigo-600"
                  value={applicant[k]} onChange={(e) => setField(k, Number(e.target.value))} />
                <span className="w-12 text-right text-sm tabular-nums">{Number(applicant[k]).toFixed(2)}</span>
              </div>
            </Field>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Applicant profile</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field name="Age (years)" hint="stored internally as negative days">
            <Num value={ageYears} min={18} max={80} step="1"
              onChange={(v) => setField("DAYS_BIRTH", Number.isFinite(v) ? Math.round(-v * 365) : NaN)} />
          </Field>
          <Field name={label("NAME_EDUCATION_TYPE")}>
            <Select value={applicant.NAME_EDUCATION_TYPE} options={EDUCATION_TYPES} onChange={(v) => setField("NAME_EDUCATION_TYPE", v)} />
          </Field>
          <Field name={label("NAME_HOUSING_TYPE")}>
            <Select value={applicant.NAME_HOUSING_TYPE} options={HOUSING_TYPES} onChange={(v) => setField("NAME_HOUSING_TYPE", v)} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50">
        <button type="button" onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
          Background data ({restKeys.length} more fields, pre-filled from preset)
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {open && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-3">
            {restKeys.map((k) => (
              <Field key={k} name={label(k)}>
                {typeof applicant[k] === "number"
                  ? <Num value={applicant[k]} onChange={(v) => setField(k, v)} />
                  : <input className={inputCls} value={applicant[k]} onChange={(e) => setField(k, e.target.value)} />}
              </Field>
            ))}
          </div>
        )}
      </section>

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {loading ? "Evaluating..." : "Evaluate application"}
      </button>
    </form>
  );
}
