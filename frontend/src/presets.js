import prime from "./presets/prime.json";
import borderline from "./presets/borderline.json";
import highRisk from "./presets/high_risk.json";

// Full 71-field applicants. Expected results were measured on the real API.
export const PRESETS = [
  { id: "prime", label: "Prime (Good)", hint: "expect: Approved", data: { ...prime, loan_duration_years: 15 } },
  { id: "borderline", label: "Average (Borderline)", hint: "expect: Manual Review", data: { ...borderline, loan_duration_years: 20 } },
  { id: "high_risk", label: "High Risk (Poor)", hint: "expect: Rejected", data: { ...highRisk, loan_duration_years: 10 } },
];

export const createEmptyApplicant = () => {
  const blank = JSON.parse(JSON.stringify(borderline));
  blank.AMT_CREDIT = NaN;
  blank.loan_duration_years = NaN;
  blank.AMT_ANNUITY = NaN;
  blank.AMT_GOODS_PRICE = NaN;
  blank.AMT_INCOME_TOTAL = NaN;
  blank.DAYS_EMPLOYED = NaN;
  blank.EXT_SOURCE_2 = NaN;
  blank.EXT_SOURCE_3 = NaN;
  return blank;
};
