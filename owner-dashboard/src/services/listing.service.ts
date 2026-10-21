
import { api } from "./api";

export type ListingStatus =
  | "DRAFT"
  | "PENDING"
  | "PUBLISHED"
  | "INACTIVE";

export interface ListingInput {
  name: string;
  category?: string;
  description?: string | null;
  address: string;
  locality: string;
  city?: string;
  state?: string;
  pincode?: string | null;
  genderPolicy?: string;
  monthlyRent?: number | null;
  deposit?: number | null;
  status?: ListingStatus;
}

export interface Listing {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string | null;
  genderPolicy: string;
  monthlyRent: number | null;
  deposit: number | null;
  status: ListingStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  rooms?: Array<{
    id: string;
    name: string;
    roomType: string;
    capacity: number;
    monthlyRent: number | null;
    beds?: Array<{
      id: string;
      bedNumber: string;
      status: string;
      monthlyRent: number | null;
    }>;
  }>;
  images?: Array<{
    id: string;
    url: string;
    altText: string | null;
    isCover: boolean;
  }>;
}

export const listingService = {
  async getAll() {
    const response = await api.get<{ listings: Listing[] }>(
      "/listings"
    );
    return response.data.listings;
  },

  async getById(id: string) {
    const response = await api.get<{ listing: Listing }>(
      `/listings/${id}`
    );
    return response.data.listing;
  },

  async create(data: ListingInput) {
    const response = await api.post<{ listing: Listing }>(
      "/listings",
      data
    );
    return response.data.listing;
  },

  async update(id: string, data: Partial<ListingInput>) {
    const response = await api.patch<{ listing: Listing }>(
      `/listings/${id}`,
      data
    );
    return response.data.listing;
  },

  async delete(id: string) {
    const response = await api.delete<{
      message: string;
      id: string;
    }>(`/listings/${id}`);

    return response.data;
  },
};
