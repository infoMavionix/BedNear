import axios from "axios";
import { api } from "./api";

export type AdminEnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "CLOSED";

export interface AdminEnquiry {
  id: string;
  candidateName: string;
  phone: string;
  email: string | null;
  message: string | null;
  preferredVisitAt: string | null;
  status: AdminEnquiryStatus;
  ownerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    name: string;
    locality: string;
    city: string;
    monthlyRent: number | null;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface AdminEnquirySummary {
  total: number;
  new: number;
  contacted: number;
  visits: number;
  closed: number;
}

interface AdminEnquiriesResponse {
  enquiries: AdminEnquiry[];
  summary: AdminEnquirySummary;
}

interface UpdateEnquiryResponse {
  message: string;
  enquiry: AdminEnquiry;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.response?.status === 403) {
      return "Admin permission is required to view or update enquiries.";
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (!error.response) {
      return "Cannot connect to BedNear. Check that the backend is running.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Unable to process the enquiry request.";
}

export async function getAdminEnquiries(params?: {
  search?: string;
  status?: AdminEnquiryStatus | "ALL";
}): Promise<AdminEnquiriesResponse> {
  try {
    const response = await api.get<AdminEnquiriesResponse>(
      "/admin/enquiries",
      { params }
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminEnquiry(
  id: string,
  data: {
    status: AdminEnquiryStatus;
    ownerNotes: string | null;
  }
): Promise<AdminEnquiry> {
  try {
    const response = await api.patch<UpdateEnquiryResponse>(
      `/admin/enquiries/${encodeURIComponent(id)}`,
      data
    );

    return response.data.enquiry;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}