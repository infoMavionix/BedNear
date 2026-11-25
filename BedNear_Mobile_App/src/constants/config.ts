
export const APP_NAME = "BedNear";

// Backend API URL
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

// Live backend should be used by default.
export const USE_DEMO_DATA =
  (process.env.EXPO_PUBLIC_USE_DEMO_DATA || "false").toLowerCase() === "true";

// Availability freshness duration
export const AVAILABILITY_FRESH_HOURS = 24;
