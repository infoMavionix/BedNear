
import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../constants/config";

const TOKEN_KEY = "bednear_access_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach authentication to protected API requests.
api.interceptors.request.use(
  async (config) => {
    const requestUrl = config.url || "";

    // Public listing endpoints do not require authentication.
    // Owner contact endpoint DOES require candidate authentication.
    const isPublicRequest =
      requestUrl.startsWith("/public/") &&
      !requestUrl.includes("/contact");

    if (isPublicRequest) {
      return config;
    }

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("[BedNear] SecureStore error:", error);
      throw error;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// API error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    console.error("[BedNear API Error]", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      response: error.response?.data,
      message: error.message,
      code: error.code,
    });

    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : error.response
          ? `Request failed (${error.response.status}).`
          : "Could not connect to the server. Check your connection.");

    return Promise.reject(new Error(message));
  }
);
