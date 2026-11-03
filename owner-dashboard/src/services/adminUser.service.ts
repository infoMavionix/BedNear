import axios from "axios";
import { api } from "./api";

export type ManagedUserRole = "OWNER" | "CANDIDATE";
export type ManagedUserStatus = "ALL" | "ACTIVE" | "INACTIVE";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  role: ManagedUserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    listings: number;
    subscriptions: number;
  };
}

export interface ManagedUsersResponse {
  message: string;
  users: ManagedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.response?.status === 403) {
      return "Administrator permission is required.";
    }

    return (
      error.response?.data?.message ||
      (error.response
        ? "The request failed. Please try again."
        : "Cannot connect to the BedNear backend.")
    );
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function getAdminUsers(params: {
  search?: string;
  role?: "ALL" | ManagedUserRole;
  status?: ManagedUserStatus;
  page?: number;
  limit?: number;
}): Promise<ManagedUsersResponse> {
  try {
    const response = await api.get<ManagedUsersResponse>("/admin/users", {
      params,
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(errorMessage(error));
  }
}

export async function setAdminUserStatus(
  id: string,
  isActive: boolean
): Promise<ManagedUser> {
  try {
    const response = await api.patch<{ message: string; user: ManagedUser }>(
      `/admin/users/${encodeURIComponent(id)}/status`,
      { isActive }
    );

    return response.data.user;
  } catch (error: unknown) {
    throw new Error(errorMessage(error));
  }
}