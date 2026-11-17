
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    // Read the existing authentication token.
    const token =
      sessionStorage.getItem("jwt") ||
      sessionStorage.getItem("bednear_token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("bednear_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData must use multipart/form-data with a browser-generated boundary.
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error) => Promise.reject(error)
);
