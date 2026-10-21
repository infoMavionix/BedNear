
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    // Use the token key already present in the browser.
    const token =
      localStorage.getItem("jwt") ||
      localStorage.getItem("bednear_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
