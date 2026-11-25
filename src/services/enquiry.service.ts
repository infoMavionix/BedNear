
import { api } from "./api";

export interface CandidateEnquiry {
  id: string;
  candidateName: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "VISIT_SCHEDULED" | "CLOSED";
  preferredVisitAt: string | null;
  createdAt: string;
  listing: {
    id: string;
    name: string;
    locality: string;
    city: string;
    address: string;
    monthlyRent: number | null;
    deposit: number | null;
    status: string;
  };
}

export async function submitEnquiry(input: {
  listingId: string;
  message?: string;
  preferredVisitAt?: string;
}) {
  const { data } = await api.post("/enquiries", input);
  return data;
}

export async function getMyEnquiries(): Promise<CandidateEnquiry[]> {
  const { data } = await api.get("/enquiries/mine");
  return data.enquiries ?? [];
}
