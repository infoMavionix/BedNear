import { api } from "./api";

export type BillingCycle = "MONTHLY" | "QUARTERLY";

export type SubscriptionPlan = {
  planCode: string;
  planName: string;
  description?: string | null;
  monthlyPrice: number;
  quarterlyPrice: number;
  features: string[];
};

export type OwnerPG = {
  id: string;
  name: string;
  city: string;
  locality: string;
  status: string;
};

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export type OwnerSubscription = {
  id: string;
  planCode: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  listingId: string | null;
  listing?: {
    id: string;
    name: string;
    city?: string;
    locality?: string;
  } | null;
};

export type CreateSubscriptionPayload = {
  listingId: string;
  planCode: string;
  billingCycle: BillingCycle;
};

type BackendSubscriptionPlan = {
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  quarterlyPrice: number;
  features: string[];
};

type PlansResponse = {
  plans: BackendSubscriptionPlan[];
};

type ListingsResponse = {
  listings: OwnerPG[];
};

type SubscriptionsResponse = {
  subscriptions: OwnerSubscription[];
};

export type CreateSubscriptionResponse = {
  message: string;
  checkoutReady: boolean;
  paymentGatewayConfigured: boolean;
  reused?: boolean;
  subscription: OwnerSubscription;
};

export type TrialEligibilityResponse = {
  eligible: boolean;
  message: string;
};

export type ActivateFreeTrialResponse = {
  message: string;
  subscription: OwnerSubscription;
};

export type RazorpayOrderResponse = {
  message: string;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  subscriptionId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string | null;
  listingName: string;
  orderStatus?: string;
};

export type VerifyRazorpayPaymentPayload = {
  subscriptionId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyRazorpayPaymentResponse = {
  message: string;
  subscription: OwnerSubscription;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await api.get<PlansResponse>("/subscriptions/plans");

  return (response.data.plans ?? []).map((plan) => ({
    planCode: plan.code,
    planName: plan.name,
    description: plan.description,
    monthlyPrice: Number(plan.monthlyPrice),
    quarterlyPrice: Number(plan.quarterlyPrice),
    features: plan.features ?? [],
  }));
}

export async function getOwnerPGs(): Promise<OwnerPG[]> {
  const response = await api.get<ListingsResponse>("/listings");
  return response.data.listings ?? [];
}

export async function getOwnerSubscriptions(): Promise<OwnerSubscription[]> {
  const response = await api.get<SubscriptionsResponse>("/subscriptions/my");
  return response.data.subscriptions ?? [];
}

export async function getFreeTrialEligibility(
  listingId: string
): Promise<TrialEligibilityResponse> {
  const response = await api.get<TrialEligibilityResponse>(
    "/subscriptions/trial-eligibility",
    { params: { listingId } }
  );
  return response.data;
}

export async function activateFreeTrial(
  listingId: string
): Promise<ActivateFreeTrialResponse> {
  const response = await api.post<ActivateFreeTrialResponse>(
    "/subscriptions/trial",
    { listingId }
  );
  return response.data;
}

export async function createSubscription(
  payload: CreateSubscriptionPayload
): Promise<CreateSubscriptionResponse> {
  const response = await api.post<CreateSubscriptionResponse>(
    "/subscriptions/checkout",
    payload
  );
  return response.data;
}

export async function createRazorpayOrder(
  subscriptionId: string
): Promise<RazorpayOrderResponse> {
  const response = await api.post<RazorpayOrderResponse>(
    `/subscriptions/${subscriptionId}/order`
  );
  return response.data;
}

export async function verifyRazorpayPayment(
  payload: VerifyRazorpayPaymentPayload
): Promise<VerifyRazorpayPaymentResponse> {
  const response = await api.post<VerifyRazorpayPaymentResponse>(
    "/subscriptions/verify",
    payload
  );
  return response.data;
}

export async function cancelOwnerSubscription(subscriptionId: string) {
  const response = await api.post(
    `/subscriptions/${subscriptionId}/cancel`
  );
  return response.data;
}
