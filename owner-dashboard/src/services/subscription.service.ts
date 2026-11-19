
import { api } from "./api";

// Billing cycle
export type BillingCycle = "MONTHLY" | "QUARTERLY";

// Subscription plan
export type SubscriptionPlan = {
  planCode: string;
  planName: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  features: string[];
};

// Owner PG listing
export type OwnerPG = {
  id: string;
  name: string;
  city: string;
  locality: string;
  status: string;
};

// Subscription status
export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

// Owner subscription
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

// Create subscription payload
export type CreateSubscriptionPayload = {
  listingId: string;
  planCode: string;
  billingCycle: BillingCycle;
};

// Backend plan response
type BackendSubscriptionPlan = {
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  features: string[];
};

// API responses
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

// Razorpay order response
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

// Razorpay verification payload
export type VerifyRazorpayPaymentPayload = {
  subscriptionId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

// Razorpay verification response
export type VerifyRazorpayPaymentResponse = {
  message: string;
  subscription: OwnerSubscription;
};

// GET subscription plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await api.get<PlansResponse>(
    "/subscriptions/plans"
  );

  return (response.data.plans ?? []).map((plan) => ({
    planCode: plan.code,
    planName: plan.name,
    description: plan.description,
    monthlyPrice: Number(plan.monthlyPrice),
    quarterlyPrice: Number(plan.quarterlyPrice),
    features: plan.features ?? [],
  }));
}

// GET owner PG listings
export async function getOwnerPGs(): Promise<OwnerPG[]> {
  const response = await api.get<ListingsResponse>(
    "/listings"
  );

  return response.data.listings ?? [];
}

// GET owner subscription history
export async function getOwnerSubscriptions(): Promise<OwnerSubscription[]> {
  const response = await api.get<SubscriptionsResponse>(
    "/subscriptions/my"
  );

  return response.data.subscriptions ?? [];
}

// POST create pending subscription checkout
export async function createSubscription(
  payload: CreateSubscriptionPayload
): Promise<CreateSubscriptionResponse> {
  const response = await api.post<CreateSubscriptionResponse>(
    "/subscriptions/checkout",
    payload
  );

  return response.data;
}

// POST create Razorpay order
export async function createRazorpayOrder(
  subscriptionId: string
): Promise<RazorpayOrderResponse> {
  const response = await api.post<RazorpayOrderResponse>(
    `/subscriptions/${subscriptionId}/order`
  );

  return response.data;
}

// POST verify Razorpay payment
export async function verifyRazorpayPayment(
  payload: VerifyRazorpayPaymentPayload
): Promise<VerifyRazorpayPaymentResponse> {
  const response = await api.post<VerifyRazorpayPaymentResponse>(
    "/subscriptions/verify",
    payload
  );

  return response.data;
}

// POST cancel pending subscription
export async function cancelOwnerSubscription(
  subscriptionId: string
) {
  const response = await api.post(
    `/subscriptions/${subscriptionId}/cancel`
  );

  return response.data;
}
