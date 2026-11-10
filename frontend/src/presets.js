import prime from "./presets/prime.json";
import borderline from "./presets/borderline.json";
import highRisk from "./presets/high_risk.json";

// Full 71-field applicants. Expected results were measured on the real API.
export const PRESETS = [
  { id: "prime", label: "Prime (Good)", hint: "expect: Approved", data: prime },
  { id: "borderline", label: "Average (Borderline)", hint: "expect: Manual Review", data: borderline },
  { id: "high_risk", label: "High Risk (Poor)", hint: "expect: Rejected", data: highRisk },
];
