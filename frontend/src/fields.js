// Fields shown in the main form. Everything else lives in the "Background data" drawer.
export const INCOME_TYPES = [
  "Working",
  "Commercial associate",
  "Pensioner",
  "State servant",
  "Unemployed",
  "Student",
  "Businessman",
  "Maternity leave",
];

export const EDUCATION_TYPES = [
  "Higher education",
  "Secondary / secondary special",
  "Incomplete higher",
  "Lower secondary",
  "Academic degree",
];

export const HOUSING_TYPES = [
  "House / apartment",
  "With parents",
  "Municipal apartment",
  "Rented apartment",
  "Office apartment",
  "Co-op apartment",
];

export const PRIMARY_KEYS = [
  "AMT_CREDIT",
  "AMT_ANNUITY",
  "AMT_GOODS_PRICE",
  "AMT_INCOME_TOTAL",
  "NAME_INCOME_TYPE",
  "DAYS_EMPLOYED",
  "EXT_SOURCE_2",
  "EXT_SOURCE_3",
  "NAME_EDUCATION_TYPE",
  "NAME_HOUSING_TYPE",
  "DAYS_BIRTH",
];

export const LABELS = {
  AMT_CREDIT: "Loan Amount (Credit)",
  AMT_ANNUITY: "Monthly / Annual EMI",
  AMT_GOODS_PRICE: "Goods / Asset Valuation",
  AMT_INCOME_TOTAL: "Total Annual Income",
  EXT_SOURCE_2: "Credit Bureau Rating (CIBIL/Equifax 2)",
  EXT_SOURCE_3: "Credit Bureau Rating (Experian 3)",
  DAYS_BIRTH: "Applicant Age",
  DAYS_EMPLOYED: "Total Employment Duration",
  NAME_INCOME_TYPE: "Employment Category",
  NAME_EDUCATION_TYPE: "Highest Education Level",
  NAME_HOUSING_TYPE: "Residential Status",
};

export const label = (k) =>
  LABELS[k] ||
  k.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const inr = (v) => {
  if (v == null || isNaN(v)) return "₹0";
  return "₹" + Math.round(v).toLocaleString("en-IN");
};

export function inrLakhWords(v) {
  if (!v || isNaN(v)) return "";
  if (v >= 10000000) return `(${(v / 10000000).toFixed(2)} Cr)`;
  if (v >= 100000) return `(${(v / 100000).toFixed(2)} Lakhs)`;
  if (v >= 1000) return `(${(v / 1000).toFixed(1)}k)`;
  return "";
}

export function getCreditScoreTier(score) {
  if (score >= 0.7) return { text: "Prime / Excellent", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  if (score >= 0.5) return { text: "Good Standing", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" };
  if (score >= 0.3) return { text: "Moderate / Fair", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  return { text: "High Risk / Subprime", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
}

export const MONEY_KEYS = new Set([
  "AMT_CREDIT",
  "AMT_ANNUITY",
  "AMT_GOODS_PRICE",
  "AMT_INCOME_TOTAL",
]);

export function fmtValue(key, v) {
  if (MONEY_KEYS.has(key)) return inr(v);
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : v.toFixed(3);
  return String(v);
}

export const pct = (p) => (p * 100).toFixed(2) + "%";

