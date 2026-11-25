import { api } from "./api";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export interface AdminSubscription {
  id: string;
  planCode: string;
  planName: string;
  billingCycle: "MONTHLY" | "QUARTERLY";
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  listing: {
    id: string;
    name: string;
  } | null;
  payments?: {
    id: string;
    amount: number;
    status: string;
    providerPaymentId?: string | null;
  }[];
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  quarterlyPrice: number;
  features: string[];
  isActive: boolean;
}

export interface SubscriptionSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
  currency?: string;
}
export async function getAdminSubscriptions(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const response = await api.get("/admin/subscriptions", { params });
  return response.data;
}

export async function getAdminSubscriptionSummary() {
  const response = await api.get("/admin/subscriptions/summary");
  return response.data;
}

export async function getAdminSubscriptionPlans() {
  const response = await api.get("/admin/subscription-plans");
  return response.data;
}

export async function createAdminSubscriptionPlan(payload: {
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  features: string[];
}) {
  const response = await api.post("/admin/subscription-plans", payload);
  return response.data;
}

export async function updateAdminSubscriptionPlan(
  id: string,
  payload: {
    code: string;
    name: string;
    description?: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    features: string[];
  }
) {
  const response = await api.put(`/admin/subscription-plans/${id}`, payload);
  return response.data;
}

export async function updateAdminSubscriptionPlanStatus(
  id: string,
  isActive: boolean
) {
  const response = await api.patch(`/admin/subscription-plans/${id}/status`, {
    isActive,
  });
  return response.data;
}