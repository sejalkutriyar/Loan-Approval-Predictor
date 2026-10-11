import prime from "./presets/prime.json";
import borderline from "./presets/borderline.json";
import highRisk from "./presets/high_risk.json";

// Full 71-field applicants. Expected results were measured on the real API.
export const PRESETS = [
  { id: "prime", label: "Prime applicant", hint: "expect: Approved", data: prime },
  { id: "borderline", label: "Borderline applicant", hint: "expect: Manual Review", data: borderline },
  { id: "high_risk", label: "High-risk applicant", hint: "expect: Rejected", data: highRisk },
];
