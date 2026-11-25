
import axios from "axios";
import { api } from "./api";

export type OwnerVerificationStatus =
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED";

export type OwnerDocumentType = "OWNER_IDENTITY" | "PG_LICENSE";
export type OwnerDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface OwnerVerificationDocument {
  id: string;
  type: OwnerDocumentType;
  status: OwnerDocumentStatus;
  originalName: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface PendingOwnerVerification {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  isActive: boolean;
  isVerified: boolean;
  verificationStatus: OwnerVerificationStatus;
  createdAt: string;
  ownerProfile?: {
    ownerType: string;
    address: string | null;
    locality: string | null;
    city: string;
    state: string;
    pincode: string | null;
  } | null;
  verificationDocuments: OwnerVerificationDocument[];
}

interface AdminDashboardResponse {
  recentOwnerVerifications?: PendingOwnerVerification[];
}

interface DocumentReviewResponse {
  message: string;
  document: OwnerVerificationDocument;
  owner: {
    id: string;
    name: string;
    email: string;
    verificationStatus: OwnerVerificationStatus;
    isVerified: boolean;
  };
}

function getErrorMessage(error: unknown): string {
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

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

// Uses the existing admin dashboard endpoint.
// The backend currently returns the five most recent pending owner applications.
export async function getRecentOwnerVerifications(): Promise<
  PendingOwnerVerification[]
> {
  try {
    const response = await api.get<AdminDashboardResponse>(
      "/admin/dashboard/stats"
    );

    return response.data.recentOwnerVerifications ?? [];
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// Uses the existing private document preview endpoint.
export async function getOwnerVerificationDocumentFile(
  documentId: string
): Promise<Blob> {
  try {
    const response = await api.get(
      `/admin/documents/${encodeURIComponent(documentId)}/file`,
      { responseType: "blob" }
    );

    return response.data as Blob;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// Uses the existing document review endpoint.
// The backend automatically updates the owner's verification status.
export async function reviewOwnerDocument(
  documentId: string,
  status: "VERIFIED" | "REJECTED",
  reviewNote?: string
): Promise<DocumentReviewResponse> {
  try {
    const response = await api.patch<DocumentReviewResponse>(
      `/admin/documents/${encodeURIComponent(documentId)}/review`,
      {
        status,
        ...(reviewNote ? { reviewNote } : {}),
      }
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}
