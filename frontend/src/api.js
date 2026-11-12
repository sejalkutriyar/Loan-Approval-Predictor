import axios from "axios";

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
  if (e.response) {
    const d = e.response.data?.detail;
    if (e.response.status === 422 && Array.isArray(d)) {
      return "Validation error: " + d.map((x) => `${(x.loc || []).slice(1).join(".")} (${x.msg})`).join("; ");
    }
    return `Server error ${e.response.status}: ${typeof d === "string" ? d : JSON.stringify(d)}`;
  }
  return "Cannot reach the API. Is the backend running on " + BASE + " ?";
}

// ---------------------------------------------------------------------------
// Authentication & Profile Services
// ---------------------------------------------------------------------------
export async function login({ username, password }) {
  try {
    const res = await client.post("/auth/login", { username, password });
    const { access_token, user } = res.data;
    localStorage.setItem("jwt_token", access_token);
    localStorage.setItem("jwt_user", JSON.stringify(user));
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
