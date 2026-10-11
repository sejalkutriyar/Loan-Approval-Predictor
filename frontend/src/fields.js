// Fields shown in the main form. Everything else lives in the "Background data" drawer.
export const INCOME_TYPES = ["Working", "Commercial associate", "Pensioner", "State servant", "Unemployed", "Student", "Businessman", "Maternity leave"];
export const EDUCATION_TYPES = ["Secondary / secondary special", "Higher education", "Incomplete higher", "Lower secondary", "Academic degree"];
export const HOUSING_TYPES = ["House / apartment", "With parents", "Municipal apartment", "Rented apartment", "Office apartment", "Co-op apartment"];

export const PRIMARY_KEYS = [
  "AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE", "AMT_INCOME_TOTAL",
  "NAME_INCOME_TYPE", "DAYS_EMPLOYED", "EXT_SOURCE_2", "EXT_SOURCE_3",
  "NAME_EDUCATION_TYPE", "NAME_HOUSING_TYPE", "DAYS_BIRTH",
];

export const LABELS = {
  AMT_CREDIT: "Loan amount",
  AMT_ANNUITY: "Annual EMI (annuity)",
  AMT_GOODS_PRICE: "Goods price",
  AMT_INCOME_TOTAL: "Total income",
  EXT_SOURCE_2: "External credit score 2",
  EXT_SOURCE_3: "External credit score 3",
  DAYS_BIRTH: "Age",
  DAYS_EMPLOYED: "Employment length",
  NAME_INCOME_TYPE: "Income type",
  NAME_EDUCATION_TYPE: "Education",
  NAME_HOUSING_TYPE: "Housing",
};
export const label = (k) => LABELS[k] || k.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const inr = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
export const MONEY_KEYS = new Set(["AMT_CREDIT", "AMT_ANNUITY", "AMT_GOODS_PRICE", "AMT_INCOME_TOTAL"]);

export function fmtValue(key, v) {
  if (MONEY_KEYS.has(key)) return inr(v);
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}
export const pct = (p) => (p * 100).toFixed(1) + "%";
