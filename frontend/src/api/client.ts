import axios from "axios";

/**
 * Single shared axios instance — every module's API calls go through this,
 * not through separate axios.create() calls scattered around. Base URL
 * comes from the Vite env so it's one line to change between local/deployed.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Placeholder for later: once RBAC issues JWTs, an interceptor here attaches
// `Authorization: Bearer <token>` to every request. Not needed for scaffold.
