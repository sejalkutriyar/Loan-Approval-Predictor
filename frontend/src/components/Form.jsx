import React, { useState } from "react";
import {
  ChevronDown,
  CreditCard,
  Briefcase,
  Activity,
  UserCheck,
  FileSpreadsheet,
  Search,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  PRIMARY_KEYS,
  INCOME_TYPES,
  EDUCATION_TYPES,
  HOUSING_TYPES,
  ENUMS,
  BINARY_KEYS,
  label,
  inrCompact,
  getCreditScoreTier,
} from "../fields.js";
import "./form.css";

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="form-section-header">
      <Icon size={15} strokeWidth={1.75} className="form-section-header__icon" />
      <div>
        <h3 className="form-section-header__title">{title}</h3>
        {subtitle && <p className="form-section-header__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function MoneyInput({ id, labelText, value, onChange }) {
  const suffix = inrCompact(value);
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {labelText}
      </label>
      <div className="input-affix">
        <span className="input-affix__prefix" aria-hidden="true">
          ₹
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step="any"
          inputMode="numeric"
          placeholder="0"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className={`form-input form-input--money${suffix ? " form-input--suffix" : ""}`}
        />
        {suffix && (
          <span className="input-affix__suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectField({ id, labelText, value, onChange, options }) {
  const list = options.includes(value) ? options : [value, ...options];
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {labelText}
      </label>
      <div className="select-wrap">
        <select
          id={id}
          className="form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {list.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function YearsField({ id, labelText, value, onChange, min, max, step = 1, placeholder }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {labelText}
      </label>
      <div className="input-affix">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            onChange(e.target.value === "" ? NaN : val);
          }}
          placeholder={placeholder}
          className="form-input form-input--suffix"
        />
        <span className="input-affix__suffix" aria-hidden="true">
          years
        </span>
      </div>
    </div>
  );
}

export default function Form({ applicant, setField, onSubmit, loading }) {
  const [open, setOpen] = useState(false);
  const [bgFilter, setBgFilter] = useState("");

  const ageYears = Math.round(Math.abs(applicant.DAYS_BIRTH) / 365);
  const empYears = Number((Math.abs(applicant.DAYS_EMPLOYED) / 365).toFixed(1));

  const restKeys = Object.keys(applicant).filter((k) => !PRIMARY_KEYS.includes(k));

  const query = bgFilter.trim().toLowerCase();
  const filteredRestKeys = restKeys.filter(
    (k) => k.toLowerCase().includes(query) || label(k).toLowerCase().includes(query)
  );

  const setYears = (key, years) =>
    setField(key, Number.isFinite(years) ? Math.round(-years * 365) : NaN);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="form"
    >
      <section className="form-section">
        <SectionHeader
          icon={CreditCard}
          title="Loan request"
          subtitle="Amount requested, repayment instalment and asset value."
        />
        <div className="form-grid-3">
          <MoneyInput
            id="amt-credit"
            labelText="Loan amount"
            value={applicant.AMT_CREDIT}
            onChange={(v) => setField("AMT_CREDIT", v)}
          />
          <MoneyInput
            id="amt-annuity"
            labelText="Annual EMI / annuity"
            value={applicant.AMT_ANNUITY}
            onChange={(v) => setField("AMT_ANNUITY", v)}
          />
          <MoneyInput
            id="amt-goods"
            labelText="Goods / asset price"
            value={applicant.AMT_GOODS_PRICE}
            onChange={(v) => setField("AMT_GOODS_PRICE", v)}
          />
        </div>
      </section>

      <section className="form-section">
        <SectionHeader
          icon={Briefcase}
          title="Income and employment"
          subtitle="Earnings, income type and time in the current job."
        />
        <div className="form-grid-3">
          <MoneyInput
            id="amt-income"
            labelText="Annual income"
            value={applicant.AMT_INCOME_TOTAL}
            onChange={(v) => setField("AMT_INCOME_TOTAL", v)}
          />
          <SelectField
            id="income-type"
            labelText="Income type"
            value={applicant.NAME_INCOME_TYPE}
            onChange={(v) => setField("NAME_INCOME_TYPE", v)}
            options={INCOME_TYPES}
          />
          <YearsField
            id="work-years"
            labelText="Time in current job"
            value={empYears}
            min={0}
            max={60}
            step={0.1}
            onChange={(v) => setYears("DAYS_EMPLOYED", v)}
          />
        </div>
      </section>

      <section className="form-section">
        <SectionHeader
          icon={Activity}
          title="Credit bureau scores"
          subtitle="Normalised bureau feeds: 0.00 poor, 1.00 excellent."
        />
        <div className="form-grid-2">
          {[
            { key: "EXT_SOURCE_2", name: "Bureau score 1", source: "CIBIL / Equifax" },
            { key: "EXT_SOURCE_3", name: "Bureau score 2", source: "Experian / CRIF" },
          ].map(({ key, name, source }) => {
            const score = Number(applicant[key]) || 0;
            const tier = getCreditScoreTier(score);
            return (
              <div key={key} className="ext-score-card">
                <div>
                  <div className="ext-score-card__header">
                    <span className="ext-score-card__name">{name}</span>
                    <span className={`ext-score-card__tier ${tier.color}`}>{tier.text}</span>
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
                      aria-label={`${name} (${source})`}
                      onChange={(e) => setField(key, parseFloat(e.target.value))}
                      className="ext-score-card__range"
                    />
                    <div className="ext-score-card__value-box">
                      <span className="ext-score-card__value">{score.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="ext-score-card__scale" aria-hidden="true">
                    <span>0.00</span>
                    <span>0.50</span>
                    <span>1.00</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="form-section">
        <SectionHeader
          icon={UserCheck}
          title="Applicant profile"
          subtitle="Age, education and housing situation."
        />
        <div className="form-grid-3">
          <YearsField
            id="age-years"
            labelText="Age"
            value={ageYears}
            min={18}
            max={100}
            onChange={(v) => setYears("DAYS_BIRTH", v)}
          />
          <SelectField
            id="education"
            labelText="Education"
            value={applicant.NAME_EDUCATION_TYPE}
            onChange={(v) => setField("NAME_EDUCATION_TYPE", v)}
            options={EDUCATION_TYPES}
          />
          <SelectField
            id="housing"
            labelText="Housing"
            value={applicant.NAME_HOUSING_TYPE}
            onChange={(v) => setField("NAME_HOUSING_TYPE", v)}
            options={HOUSING_TYPES}
          />
        </div>
      </section>

      <section className="annex-section">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="annex-toggle"
          aria-expanded={open}
          aria-controls="annex-body"
        >
          <span className="annex-toggle__label">
            <FileSpreadsheet size={15} strokeWidth={1.75} className="shrink-0 text-brand" />
            <span className="truncate">Background data</span>
            <span className="annex-toggle__meta">
              · {restKeys.length} remaining fields, pre-filled from the dataset
            </span>
          </span>
          <span className="annex-toggle__action">
            {open ? "Hide" : "Review"}
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {open && (
          <div className="annex-body" id="annex-body">
            <div className="annex-search-wrap">
              <Search size={14} className="annex-search__icon" />
              <input
                type="text"
                placeholder="Search fields, e.g. document, region, social"
                value={bgFilter}
                onChange={(e) => setBgFilter(e.target.value)}
                className="annex-search"
                aria-label="Search background fields"
              />
            </div>

            {filteredRestKeys.length === 0 ? (
              <p className="annex-empty">No fields match “{bgFilter}”.</p>
            ) : (
              <div className="annex-fields-grid">
                {filteredRestKeys.map((k) => {
                  const value = applicant[k];
                  const enumOptions = ENUMS[k];
                  const id = `annex-${k}`;
                  return (
                    <div key={k} className="annex-field">
                      <label className="annex-field-label" htmlFor={id} title={label(k)}>
                        {label(k)}
                      </label>
                      {enumOptions ? (
                        <select
                          id={id}
                          className="annex-field-select"
                          value={value}
                          onChange={(e) => setField(k, e.target.value)}
                        >
                          {(enumOptions.includes(value) ? enumOptions : [value, ...enumOptions]).map(
                            (o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            )
                          )}
                        </select>
                      ) : BINARY_KEYS.has(k) ? (
                        <select
                          id={id}
                          className="annex-field-select"
                          value={Number(value) === 1 ? "1" : "0"}
                          onChange={(e) => setField(k, Number(e.target.value))}
                        >
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </select>
                      ) : typeof value === "number" ? (
                        <input
                          id={id}
                          type="number"
                          step="any"
                          value={Number.isFinite(value) ? value : ""}
                          onChange={(e) =>
                            setField(k, e.target.value === "" ? NaN : Number(e.target.value))
                          }
                          className="annex-field-input"
                        />
                      ) : (
                        <input
                          id={id}
                          type="text"
                          value={value ?? ""}
                          onChange={(e) => setField(k, e.target.value)}
                          className="annex-field-input"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <div>
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <ArrowRight size={17} strokeWidth={2} />
          )}
          {loading ? "Assessing application…" : "Run assessment"}
        </button>
        <p className="btn-submit__note">
          Decision support only — a credit officer makes the final call.
        </p>
      </div>
    </form>
  );
}
