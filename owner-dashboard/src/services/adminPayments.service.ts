
import axios from "axios";
import { api } from "./api";

export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CANCELLED";
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  receipt: string | null;
  paidAt: string | null;
  createdAt: string;
  subscription: {
    id: string;
    planName: string;
    planCode: string;
    billingCycle: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    listing: {
      id: string;
      name: string;
      city: string;
      locality: string;
    } | null;
  };
}

export interface PaymentSummary {
  status: string;
  currency: string;
  totalAmount: number;
  count: number;
}

export interface AdminPaymentsResponse {
  payments: AdminPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: PaymentSummary[];
}

export async function getAdminPayments(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<AdminPaymentsResponse> {
  try {
    const response = await api.get<AdminPaymentsResponse>(
      "/admin/payments",
      { params }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
        "Unable to load payment transactions."
      );
    }
    throw error;
  }
}
