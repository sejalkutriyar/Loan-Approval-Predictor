import axios from "axios";
import { label } from "./fields.js";

// Base URL points to FastAPI v1 endpoints
const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
const client = axios.create({ baseURL: BASE, timeout: 60000 });

/* --------------------------------------------------------------------------
   JWT interceptor: attaches Bearer token to all outgoing API requests.
-------------------------------------------------------------------------- */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* --------------------------------------------------------------------------
   Response interceptor: clears expired token on 401 Unauthorized.
-------------------------------------------------------------------------- */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear localStorage
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("jwt_user");
    }
    return Promise.reject(error);
  }
);

function errMsg(e) {
  if (e.code === "ECONNABORTED") {
    return "The request timed out. The model may still be warming up — please try again.";
  }
  if (!e.response) {
    return "Cannot reach the prediction service. Check that the backend is running and try again.";
  }
  const status = e.response.status;
  const detail = e.response.data?.detail;

  if (status === 422 && Array.isArray(detail)) {
    const parts = detail.slice(0, 3).map((d) => {
      const field = (d.loc || []).filter((p) => p !== "body").join(".");
      return `${field ? label(field) : "Request"} — ${d.msg}`;
    });
    return "Please review these fields: " + parts.join("; ") + ".";
  }
  if (typeof detail === "string") return detail;
  if (status >= 500) {
    return "The prediction service ran into a problem. Please try again in a moment.";
  }
  return `Request failed (HTTP ${status}).`;
}

// ---------------------------------------------------------------------------
// Service health
// ---------------------------------------------------------------------------
export async function getHealth() {
  const res = await client.get("/health");
  return res.data;
}

// ---------------------------------------------------------------------------
// Authentication & Profile Services
// ---------------------------------------------------------------------------
function persistSession({ access_token, user }) {
  localStorage.setItem("jwt_token", access_token);
  localStorage.setItem("jwt_user", JSON.stringify(user));
}

export async function login({ username, password }) {
  try {
    const res = await client.post("/auth/login", { username, password });
    persistSession(res.data);
    return res.data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

export async function register({ username, fullName, email, password }) {
  try {
    const res = await client.post("/auth/register", {
      username,
      full_name: fullName,
      email,
      password,
    });
    persistSession(res.data);
    return res.data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

export async function getCurrentUser() {
  try {
    const res = await client.get("/auth/me");
    return res.data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

export function logout() {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("jwt_user");
}

// ---------------------------------------------------------------------------
// Model Inference & Recourse Endpoints
// ---------------------------------------------------------------------------
export async function predict(applicant) {
  try {
    return (await client.post("/predict", applicant)).data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

export async function recourse(applicant) {
  try {
    return (await client.post("/recourse", applicant)).data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

export async function getFairnessReport() {
  try {
    return (await client.get("/fairness-report")).data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

// ---------------------------------------------------------------------------
// Admin analytics & audit history
// ---------------------------------------------------------------------------
export async function getAdminMetrics() {
  try {
    return (await client.get("/admin/metrics")).data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}

export async function getApplications({ limit = 20, skip = 0 } = {}) {
  try {
    return (await client.get("/applications", { params: { limit, skip } })).data;
  } catch (e) {
    throw new Error(errMsg(e));
  }
}
