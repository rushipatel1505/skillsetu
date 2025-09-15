// src/services/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Create axios instance WITHOUT hard-coding Content-Type
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization header automatically if token exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Signup — expects JSON body
 */
export async function signup(payload) {
  try {
    const res = await apiClient.post("/signup/", payload); // defaults to JSON
    return res.data;
  } catch (err) {
    throw err;
  }
}

/**
 * Login — FastAPI OAuth2PasswordRequestForm REQUIRES form-urlencoded
 */
// src/services/api.js  (replace only the `login` function below)
export async function login(phone_number, password) {
  try {
    const form = new URLSearchParams();
    form.append("username", (phone_number || "").trim());
    form.append("password", password || "");

    // debug log - you can remove these later
    console.log("[api] POST /token payload:", form.toString());

    const res = await apiClient.post("/token", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    console.log("[api] /token response:", res.status, res.data);

    // Ensure we return something meaningful (or throw)
    if (!res || res.status !== 200) {
      const e = new Error("Login failed");
      e.response = res;
      throw e;
    }
    return res.data; // expected: { access_token, token_type }
  } catch (err) {
    console.error("[api] login error:", err.response?.status, err.response?.data || err.message);
    throw err;
  }
}
// Add this to src/services/api.js (near other exported API helpers)

export async function fetchJobs(skip = 0, limit = 6) {
  try {
    // server endpoint supports skip & limit query params
    const res = await apiClient.get("/jobs/", {
      params: { skip, limit },
    });
    // Expect res.data to be an array of jobs
    return res.data;
  } catch (err) {
    // Bubble up for the caller to show errors
    throw err;
  }
}
// src/services/api.js  (append these)
export async function getProfile() {
  try {
    const res = await apiClient.get("/users/me/");
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function getAllSkills() {
  try {
    const res = await apiClient.get("/skills/");
    return res.data;
  } catch (err) {
    throw err;
  }
}

/**
 * Update current user's skills.
 * Backend expects { skill_ids: [1,2,3] }
 */
export async function updateMySkills(skillIds = []) {
  try {
    const res = await apiClient.put("/users/me/skills", { skill_ids: skillIds });
    return res.data;
  } catch (err) {
    throw err;
  }
}
// src/services/api.js  (append)
export async function createJob(payload) {
  try {
    // payload example: { title, description, location_area, required_skills: [1,2,3] }
    const res = await apiClient.post("/jobs/", payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}
// src/services/api.js  (append)
export async function updateProfile(payload) {
  // payload example: { name?: string, location_area?: string, phone_number?: string }
  try {
    const res = await apiClient.put("/users/me", payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}


export default apiClient;
