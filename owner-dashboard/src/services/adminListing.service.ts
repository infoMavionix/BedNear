
import axios from "axios";
import { api } from "./api";

export type VerificationDocumentType =
  | "OWNER_IDENTITY"
  | "PROPERTY_OWNERSHIP"
  | "AUTHORIZATION_LETTER";

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface VerificationDocument {
  id: string;
  type: VerificationDocumentType;
  status: VerificationStatus;
  originalName: string;
  mimeType: string;
  fileSize: number;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface PendingListing {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode?: string | null;
  genderPolicy: string;
  monthlyRent?: number | null;
  deposit?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  createdAt: string;
  submittedAt?: string | null;
  rejectionReason?: string | null;

  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    businessName?: string | null;
  };

  images: {
    id: string;
    url: string;
    altText?: string | null;
    isCover: boolean;
    storageKey?: string;
    mimeType?: string | null;
    originalName?: string | null;
  }[];

  verificationDocuments: VerificationDocument[];

  rooms: {
    id: string;
    name: string;
    capacity: number;
    beds: {
      id: string;
      status: string;
    }[];
  }[];

  amenities: {
    amenity: {
      name: string;
    };
  }[];
}

interface PendingListingsResponse {
  listings: PendingListing[];
}

interface ListingActionResponse {
  message: string;
  listing?: PendingListing;
  id?: string;
  status?: string;
}

interface DocumentReviewResponse {
  message: string;
  document: VerificationDocument;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.response?.status === 403) {
      return "Admin permission is required to perform this action.";
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (!error.response) {
      return "Cannot connect to the BedNear backend. Check that the server is running.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

// GET /api/v1/admin/listings/pending
export async function getPendingListings(): Promise<PendingListing[]> {
  try {
    const response = await api.get<PendingListingsResponse>(
      "/admin/listings/pending"
    );

    return response.data.listings ?? [];
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// PATCH /api/v1/admin/listings/:id/approve
export async function approveListing(
  id: string
): Promise<ListingActionResponse> {
  try {
    const response = await api.patch<ListingActionResponse>(
      `/admin/listings/${encodeURIComponent(id)}/approve`
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// PATCH /api/v1/admin/listings/:id/reject
export async function rejectListing(
  id: string,
  reason: string
): Promise<ListingActionResponse> {
  try {
    const response = await api.patch<ListingActionResponse>(
      `/admin/listings/${encodeURIComponent(id)}/reject`,
      { reason }
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// GET /api/v1/admin/listings/:listingId/images/:storageKey/file
// Retrieves a private PG photo using admin authentication.
export async function getAdminListingImageFile(
  listingId: string,
  storageKey: string
): Promise<Blob> {
  try {
    const response = await api.get(
      `/admin/listings/${encodeURIComponent(listingId)}/images/${encodeURIComponent(storageKey)}/file`,
      {
        responseType: "blob",
      }
    );

    return response.data as Blob;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// GET /api/v1/admin/documents/:documentId/file
// Retrieves a private verification document.
export async function getAdminDocumentFile(
  documentId: string
): Promise<Blob> {
  try {
    const response = await api.get(
      `/admin/documents/${encodeURIComponent(documentId)}/file`,
      {
        responseType: "blob",
      }
    );

    return response.data as Blob;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

// PATCH /api/v1/admin/documents/:documentId/review
export async function reviewVerificationDocument(
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
