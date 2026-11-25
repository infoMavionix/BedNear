
import { api } from "./api";

export type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "CLOSED";

export interface Enquiry {
  id: string;
  candidateName: string;
  phone: string;
  email: string | null;
  message: string | null;
  preferredVisitAt: string | null;
  status: EnquiryStatus;
  ownerNotes: string | null;
  listingId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  listing?: {
    id: string;
    name: string;
    locality: string;
    monthlyRent: number | null;
  };
}

export interface UpdateEnquiryData {
  status?: EnquiryStatus;
  ownerNotes?: string | null;
  preferredVisitAt?: string | null;
}

export const enquiryService = {
  async getAll() {
    const response = await api.get<{ enquiries: Enquiry[] }>(
      "/enquiries"
    );
    return response.data.enquiries;
  },

  async getById(id: string) {
    const response = await api.get<{ enquiry: Enquiry }>(
      `/enquiries/${id}`
    );
    return response.data.enquiry;
  },

  async update(id: string, data: UpdateEnquiryData) {
    const response = await api.patch<{ enquiry: Enquiry }>(
      `/enquiries/${id}`,
      data
    );
    return response.data.enquiry;
  },
};
