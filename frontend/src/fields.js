// Field labels, enum options and number formatting shared by the form,
// result and fairness views.

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

const DOCUMENT_LABELS = {};
for (let n = 2; n <= 21; n += 1) {
  DOCUMENT_LABELS[`FLAG_DOCUMENT_${n}`] = `Document ${n} provided`;
}

export const LABELS = {
  NAME_CONTRACT_TYPE: "Contract type",
  CODE_GENDER: "Gender",
  FLAG_OWN_CAR: "Owns a car",
  FLAG_OWN_REALTY: "Owns property",
  CNT_CHILDREN: "Children",
  AMT_INCOME_TOTAL: "Annual income",
  AMT_CREDIT: "Loan amount",
  AMT_ANNUITY: "Annual EMI / annuity",
  AMT_GOODS_PRICE: "Goods / asset price",
  NAME_TYPE_SUITE: "Accompanying person",
  NAME_INCOME_TYPE: "Income type",
  NAME_EDUCATION_TYPE: "Education",
  NAME_FAMILY_STATUS: "Marital status",
  NAME_HOUSING_TYPE: "Housing",
  REGION_POPULATION_RELATIVE: "Region population density",
  DAYS_BIRTH: "Age (days before application)",
  DAYS_EMPLOYED: "Employment length (days)",
  DAYS_REGISTRATION: "Registration age (days)",
  DAYS_ID_PUBLISH: "ID publish age (days)",
  OWN_CAR_AGE: "Car age (years)",
  FLAG_MOBIL: "Mobile phone provided",
  FLAG_EMP_PHONE: "Work phone provided",
  FLAG_WORK_PHONE: "Landline provided",
  FLAG_CONT_MOBILE: "Mobile reachable",
  FLAG_PHONE: "Home phone provided",
  FLAG_EMAIL: "Email provided",
  OCCUPATION_TYPE: "Occupation",
  CNT_FAM_MEMBERS: "Household size",
  REGION_RATING_CLIENT: "Region rating",
  REGION_RATING_CLIENT_W_CITY: "Region rating (with city)",
  WEEKDAY_APPR_PROCESS_START: "Application weekday",
  HOUR_APPR_PROCESS_START: "Application hour",
  REG_REGION_NOT_LIVE_REGION: "Registered region differs from home",
  REG_REGION_NOT_WORK_REGION: "Registered region differs from work",
  LIVE_REGION_NOT_WORK_REGION: "Home region differs from work",
  REG_CITY_NOT_LIVE_CITY: "Registered city differs from home",
  REG_CITY_NOT_WORK_CITY: "Registered city differs from work",
  LIVE_CITY_NOT_WORK_CITY: "Home city differs from work",
  ORGANIZATION_TYPE: "Employer sector",
  EXT_SOURCE_2: "Bureau score 1 (CIBIL / Equifax)",
  EXT_SOURCE_3: "Bureau score 2 (Experian / CRIF)",
  OBS_30_CNT_SOCIAL_CIRCLE: "30-day social circle observations",
  DEF_30_CNT_SOCIAL_CIRCLE: "30-day social circle defaults",
  OBS_60_CNT_SOCIAL_CIRCLE: "60-day social circle observations",
  DEF_60_CNT_SOCIAL_CIRCLE: "60-day social circle defaults",
  DAYS_LAST_PHONE_CHANGE: "Days since last phone change",
  AMT_REQ_CREDIT_BUREAU_HOUR: "Bureau enquiries (last hour)",
  AMT_REQ_CREDIT_BUREAU_DAY: "Bureau enquiries (last day)",
  AMT_REQ_CREDIT_BUREAU_WEEK: "Bureau enquiries (last week)",
  AMT_REQ_CREDIT_BUREAU_MON: "Bureau enquiries (last month)",
  AMT_REQ_CREDIT_BUREAU_QRT: "Bureau enquiries (last quarter)",
  AMT_REQ_CREDIT_BUREAU_YEAR: "Bureau enquiries (last year)",
  ...DOCUMENT_LABELS,
};

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

export const ENUMS = {
  NAME_CONTRACT_TYPE: ["Cash loans", "Revolving loans"],
  CODE_GENDER: ["F", "M", "XNA"],
  NAME_TYPE_SUITE: [
    "Unaccompanied",
    "Family",
    "Spouse, partner",
    "Children",
    "Other_A",
    "Other_B",
    "Group of people",
  ],
  NAME_INCOME_TYPE: INCOME_TYPES,
  NAME_EDUCATION_TYPE: EDUCATION_TYPES,
  NAME_FAMILY_STATUS: [
    "Married",
    "Single / not married",
    "Civil marriage",
    "Separated",
    "Widow",
    "Unknown",
  ],
  NAME_HOUSING_TYPE: HOUSING_TYPES,
  WEEKDAY_APPR_PROCESS_START: [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ],
  OCCUPATION_TYPE: [
    "Laborers",
    "Sales staff",
    "Core staff",
    "Managers",
    "Drivers",
    "High skill tech staff",
    "Accountants",
    "Medicine staff",
    "Security staff",
    "Cooking staff",
    "Cleaning staff",
    "Private service staff",
    "Low-skill Laborers",
    "Secretaries",
    "Waiters/barmen staff",
    "HR staff",
    "Realty agents",
    "IT staff",
  ],
  ORGANIZATION_TYPE: [
    "Business Entity Type 3",
    "Business Entity Type 2",
    "Business Entity Type 1",
    "Self-employed",
    "Government",
    "Other",
    "Medicine",
    "Education",
    "Trade: type 7",
    "Trade: type 3",
    "Industry: type 3",
    "Industry: type 9",
    "Construction",
    "Transport: type 2",
    "Security",
    "Military",
  ],
};

// Integer 0/1 flags that read better as Yes / No in the annex.
export const BINARY_KEYS = new Set([
  "FLAG_OWN_CAR",
  "FLAG_OWN_REALTY",
  "FLAG_MOBIL",
  "FLAG_EMP_PHONE",
  "FLAG_WORK_PHONE",
  "FLAG_CONT_MOBILE",
  "FLAG_PHONE",
  "FLAG_EMAIL",
  "REG_REGION_NOT_LIVE_REGION",
  "REG_REGION_NOT_WORK_REGION",
  "LIVE_REGION_NOT_WORK_REGION",
  "REG_CITY_NOT_LIVE_CITY",
  "REG_CITY_NOT_WORK_CITY",
  "LIVE_CITY_NOT_WORK_CITY",
  ...Object.keys(DOCUMENT_LABELS),
]);

export const MONEY_KEYS = new Set([
  "AMT_CREDIT",
  "AMT_ANNUITY",
  "AMT_GOODS_PRICE",
  "AMT_INCOME_TOTAL",
]);

export const label = (k) => {
  if (LABELS[k]) return LABELS[k];

  // Decode one-hot feature names returned by SHAP, e.g.
  // "NAME_HOUSING_TYPE_With parents" -> "Housing type · With parents".
  const prefixes = [
    { key: "NAME_HOUSING_TYPE", display: "Housing type" },
    { key: "NAME_EDUCATION_TYPE", display: "Education" },
    { key: "NAME_INCOME_TYPE", display: "Income type" },
    { key: "NAME_CONTRACT_TYPE", display: "Contract type" },
    { key: "NAME_TYPE_SUITE", display: "Accompanying person" },
    { key: "NAME_FAMILY_STATUS", display: "Marital status" },
    { key: "FLAG_OWN_REALTY", display: "Owns property" },
    { key: "FLAG_OWN_CAR", display: "Owns a car" },
    { key: "CODE_GENDER", display: "Gender" },
    { key: "OCCUPATION_TYPE", display: "Occupation" },
    { key: "ORGANIZATION_TYPE", display: "Employer sector" },
    { key: "WEEKDAY_APPR_PROCESS_START", display: "Application weekday" },
  ];

  for (const p of prefixes) {
    const match = k.match(new RegExp(`^${p.key}[_\\s](.+)$`, "i"));
    if (match) {
      const val = match[1].replace(/_/g, " ").trim();
      return `${p.display} · ${val.charAt(0).toUpperCase() + val.slice(1)}`;
    }
  }

  return k
    .replace(/^NAME_/i, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
};

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

// Compact amount for in-field suffixes: "3.50 L", "18k", "900".
export function inrCompact(v) {
  if (!Number.isFinite(v) || v <= 0) return "";
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(2)} L`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

export function getCreditScoreTier(score) {
  if (score >= 0.7)
    return { text: "Prime", color: "text-approved bg-approved-soft border-approved-line" };
  if (score >= 0.5)
    return { text: "Good", color: "text-approved bg-approved-soft border-approved-line" };
  if (score >= 0.3)
    return { text: "Fair", color: "text-review bg-review-soft border-review-line" };
  return { text: "Poor", color: "text-rejected bg-rejected-soft border-rejected-line" };
}

export function fmtValue(key, v) {
  if (MONEY_KEYS.has(key)) return inr(v);
  if (BINARY_KEYS.has(key)) return Number(v) === 1 ? "Yes" : "No";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

export const pct = (p) => (p * 100).toFixed(2) + "%";
