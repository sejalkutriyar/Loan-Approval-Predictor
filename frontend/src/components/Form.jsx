import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Briefcase,
  Activity,
  UserCheck,
  FileSpreadsheet,
  Search,
  Sparkles,
} from "lucide-react";
import {
  PRIMARY_KEYS,
  INCOME_TYPES,
  EDUCATION_TYPES,
  HOUSING_TYPES,
  label,
  inrLakhWords,
  getCreditScoreTier,
} from "../fields.js";
import "./form.css";

function FormSectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="form-section-header">
      <div className="form-section-header__icon-wrap">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="form-section-header__title">{title}</h3>
        {subtitle && (
          <p className="form-section-header__subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function MoneyInput({ labelText, value, onChange, placeholder = "0" }) {
  const lakhText = inrLakhWords(value);
  return (
    <div className="flex flex-col">
      <div className="form-label-row">
        <label className="form-label">{labelText}</label>
        {lakhText && (
          <span className="money-input__lakh-badge">{lakhText}</span>
        )}
      </div>
      <div className="money-input__wrap">
        <div className="money-input__prefix">
          <span className="money-input__currency">₹</span>
        </div>
        <input
          type="number"
          min={0}
          step="any"
          placeholder={placeholder}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? NaN : Number(e.target.value))
          }
          className="money-input__field"
        />
      </div>
    </div>
  );
}

export default function Form({ applicant, setField, onSubmit, loading }) {
  const [open, setOpen] = useState(false);
  const [bgFilter, setBgFilter] = useState("");

  const ageYears = Math.round(Math.abs(applicant.DAYS_BIRTH) / 365);
  const empYears =
    Math.round((Math.abs(applicant.DAYS_EMPLOYED) / 365) * 10) / 10;

  const restKeys = Object.keys(applicant).filter(
    (k) => !PRIMARY_KEYS.includes(k)
  );

  const filteredRestKeys = restKeys.filter(
    (k) =>
      k.toLowerCase().includes(bgFilter.toLowerCase()) ||
      label(k).toLowerCase().includes(bgFilter.toLowerCase())
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      {/* 1. Credit Facility Request */}
      <section className="form-section">
        <FormSectionHeader
          icon={CreditCard}
          title="Loan Facility Request"
          subtitle="Proposed credit principal, term structure, and asset valuation"
        />
        <div className="form-grid-3">
          <MoneyInput
            labelText="Loan Amount (Credit)"
            value={applicant.AMT_CREDIT}
            onChange={(v) => setField("AMT_CREDIT", v)}
          />
          <MoneyInput
            labelText="Annual Annuity (EMI)"
            value={applicant.AMT_ANNUITY}
            onChange={(v) => setField("AMT_ANNUITY", v)}
          />
          <MoneyInput
            labelText="Goods / Asset Value"
            value={applicant.AMT_GOODS_PRICE}
            onChange={(v) => setField("AMT_GOODS_PRICE", v)}
          />
        </div>
      </section>

      {/* 2. Income & Employment */}
      <section className="form-section">
        <FormSectionHeader
          icon={Briefcase}
          title="Income & Employment Verification"
          subtitle="Declared cash flow stability and occupational category"
        />
        <div className="form-grid-3">
          <MoneyInput
            labelText="Annual Total Income"
            value={applicant.AMT_INCOME_TOTAL}
            onChange={(v) => setField("AMT_INCOME_TOTAL", v)}
          />

          <div>
            <label className="form-label mb-1 block">Income Category</label>
            <select
              value={applicant.NAME_INCOME_TYPE}
              onChange={(e) => setField("NAME_INCOME_TYPE", e.target.value)}
              className="form-select"
            >
              {INCOME_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="form-label-row">
              <label className="form-label">Employment Length</label>
              <span className="form-label-hint">(Negative days internally)</span>
            </div>
            <div className="form-input--suffix-wrap">
              <input
                type="number"
                min={0}
                max={50}
                step="0.1"
                value={Number.isFinite(empYears) ? empYears : ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setField(
                    "DAYS_EMPLOYED",
                    Number.isFinite(val) ? Math.round(-val * 365) : NaN
                  );
                }}
                className="form-input"
              />
              <div className="form-input--suffix">
                <span className="form-input--suffix-text">Years</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. External Bureau Ratings (EXT_SOURCE) */}
      <section className="form-section">
        <FormSectionHeader
          icon={Activity}
          title="External Credit Bureau Analytics"
          subtitle="Normalized risk score feeds (0.00 to 1.00) — Primary underwriting drivers"
        />
        <div className="form-grid-2">
          {[
            {
              key: "EXT_SOURCE_2",
              name: "External Credit Score 2",
              source: "TransUnion / CIBIL Aggregate",
            },
            {
              key: "EXT_SOURCE_3",
              name: "External Credit Score 3",
              source: "Experian / CRIF Normalized",
            },
          ].map(({ key, name, source }) => {
            const score = Number(applicant[key]) || 0;
            const tier = getCreditScoreTier(score);
            return (
              <div key={key} className="ext-score-card">
                <div>
                  <div className="ext-score-card__header">
                    <span className="ext-score-card__name">{name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}
                    >
                      {tier.text}
                    </span>
                  </div>
                  <p className="ext-score-card__source">{source}</p>
                </div>

                <div>
                  <div className="ext-score-card__range-row">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={score}
                      onChange={(e) =>
                        setField(key, parseFloat(e.target.value))
                      }
                      className="ext-score-card__range"
                    />
                    <div className="ext-score-card__value-box">
                      <span className="ext-score-card__value">
                        {score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="ext-score-card__scale">
                    <span>0.00 (Poor)</span>
                    <span>0.50</span>
                    <span>1.00 (Prime)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Applicant Profile & Demographics */}
      <section className="form-section">
        <FormSectionHeader
          icon={UserCheck}
          title="Applicant Profile & Demographics"
          subtitle="Education, residential status, and legal age qualifications"
        />
        <div className="form-grid-3">
          <div>
            <div className="form-label-row">
              <label className="form-label">Age</label>
              <span className="form-label-hint">(Negative days internally)</span>
            </div>
            <div className="form-input--suffix-wrap">
              <input
                type="number"
                min={18}
                max={90}
                step="1"
                value={Number.isFinite(ageYears) ? ageYears : ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setField(
                    "DAYS_BIRTH",
                    Number.isFinite(val) ? Math.round(-val * 365) : NaN
                  );
                }}
                className="form-input"
              />
              <div className="form-input--suffix">
                <span className="form-input--suffix-text">Yrs</span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="form-label mb-1 block">Education Level</label>
            <select
              value={applicant.NAME_EDUCATION_TYPE}
              onChange={(e) =>
                setField("NAME_EDUCATION_TYPE", e.target.value)
              }
              className="form-select--sm"
            >
              {EDUCATION_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="form-label mb-1 block">Residential Status</label>
            <select
              value={applicant.NAME_HOUSING_TYPE}
              onChange={(e) => setField("NAME_HOUSING_TYPE", e.target.value)}
              className="form-select--sm"
            >
              {HOUSING_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 5. Background Data Annex (60 Fields) */}
      <section className="annex-section">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="annex-toggle"
        >
          <div className="annex-toggle__label">
            <FileSpreadsheet size={15} className="text-slate-400" />
            <span>
              Underwriting Data Annex ({restKeys.length} Background Audit Parameters)
            </span>
            <span className="annex-toggle__meta">
              (Pre-filled from training distribution • 0 missing values)
            </span>
          </div>
          <div className="annex-toggle__action">
            <span className="annex-toggle__action-text">{open ? "Hide" : "Inspect"}</span>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {open && (
          <div className="annex-body">
            <div className="annex-search-wrap">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search background parameters (e.g. DOCUMENT, RATING, SOCIAL, REGION)..."
                value={bgFilter}
                onChange={(e) => setBgFilter(e.target.value)}
                className="annex-search"
              />
            </div>

            <div className="annex-fields-grid">
              {filteredRestKeys.map((k) => (
                <div key={k} className="annex-field-card">
                  <label
                    className="annex-field-label"
                    title={k}
                  >
                    {label(k)}
                  </label>
                  {typeof applicant[k] === "number" ? (
                    <input
                      type="number"
                      step="any"
                      value={applicant[k]}
                      onChange={(e) => setField(k, Number(e.target.value))}
                      className="annex-field-input"
                    />
                  ) : (
                    <input
                      type="text"
                      value={applicant[k]}
                      onChange={(e) => setField(k, e.target.value)}
                      className="annex-field-text"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 6. Primary Action CTA Button */}
      <button
        type="submit"
        disabled={loading}
        className="group btn-submit"
      >
        <Sparkles
          size={18}
          className={loading ? "animate-spin" : "transition-transform group-hover:scale-110"}
        />
        <span>
          {loading
            ? "Running Neural Inference (50 Passes + SHAP)..."
            : "Run AI Underwriting Assessment"}
        </span>
      </button>
    </form>
  );
}
