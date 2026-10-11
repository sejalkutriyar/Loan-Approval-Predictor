import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
const client = axios.create({ baseURL: BASE, timeout: 60000 });

function errMsg(e) {
  if (e.response) {
    const d = e.response.data?.detail;
    if (e.response.status === 422 && Array.isArray(d)) {
      return "Validation error: " + d.map((x) => `${(x.loc || []).slice(1).join(".")} (${x.msg})`).join("; ");
    }
    return `Server error ${e.response.status}: ${typeof d === "string" ? d : JSON.stringify(d)}`;
  }
  return "Cannot reach the API. Is the backend running on " + BASE + " ?";
}

export async function predict(applicant) {
  try { return (await client.post("/predict", applicant)).data; }
  catch (e) { throw new Error(errMsg(e)); }
}
export async function recourse(applicant) {
  try { return (await client.post("/recourse", applicant)).data; }
  catch (e) { throw new Error(errMsg(e)); }
}
