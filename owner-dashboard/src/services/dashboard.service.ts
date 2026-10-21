import { api } from "./api";

export interface DashboardSummary {
  totalListings: number;
  publishedListings: number;
  rooms: number;
  beds: number;
  availableBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  enquiries: number;
  newEnquiries: number;
  recentEnquiries: DashboardEnquiry[];
}

export interface DashboardEnquiry {
  id: string;
  candidateName: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    name: string;
    locality: string;
    city: string;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>(
    "/dashboard/summary"
  );

  return response.data;
}