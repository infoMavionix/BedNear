
import axios from "axios";
import { api } from "./api";

export interface AdminDashboardStats {
  registeredUsers: number;
  activeOwners: number;
  publishedListings: number;
  pendingListings: number;
  totalEnquiries: number;
  activeSubscriptions: number;
}

export interface AdminRevenue {
  currency: string;
  successfulPaymentCount: number;
  totalAmount: number;
}

export interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AdminRecentListing {
  id: string;
  name: string;
  city: string;
  locality: string;
  status: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

export interface AdminDashboardResponse {
  message: string;
  stats: AdminDashboardStats;
  revenue: AdminRevenue[];
  recentUsers: AdminRecentUser[];
  recentListings: AdminRecentListing[];
  generatedAt: string;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.response?.status === 403) {
      return "Admin permission is required to view these statistics.";
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (!error.response) {
      return "Cannot connect to BedNear. Check that the backend server is running.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Unable to load dashboard statistics.";
}

export async function getAdminDashboardStats(): Promise<AdminDashboardResponse> {
  try {
    const response = await api.get<AdminDashboardResponse>(
      "/admin/dashboard/stats"
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}
