
import { useEffect, useMemo, useState } from "react";

import {
  Check,
  CreditCard,
  Crown,
  Building2,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  LoaderCircle,
  ArrowRight,
  RefreshCw,
  XCircle,
} from "lucide-react";

import {
  cancelOwnerSubscription,
  createSubscription,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getOwnerPGs,
  getOwnerSubscriptions,
  getSubscriptionPlans,
  type BillingCycle,
  type OwnerPG,
  type OwnerSubscription,
  type SubscriptionPlan,
} from "../../services/subscription.service";

import "./Subscriptions.css";

// Razorpay Checkout response
type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

// Razorpay Checkout options
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
  handler: (response: RazorpaySuccessResponse) => void;
};

// Razorpay Checkout instance
type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (
    event: "payment.failed",
    callback: (response: RazorpayFailureResponse) => void
  ) => void;
};

// Razorpay global window declaration
declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "Not started";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status: string) {
  return `subscription-status subscription-status-${status.toLowerCase()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
}

export default function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [listings, setListings] = useState<OwnerPG[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    OwnerSubscription[]
  >([]);

  const [cancellingId, setCancellingId] = useState<string | null>(
    null
  );

  const [selectedListingId, setSelectedListingId] = useState("");
  const [selectedPlanCode, setSelectedPlanCode] = useState("GROWTH");

  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("MONTHLY");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load subscription information
  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const [
          planData,
          listingData,
          subscriptionData,
        ] = await Promise.all([
          getSubscriptionPlans(),
          getOwnerPGs(),
          getOwnerSubscriptions(),
        ]);

        if (!mounted) return;

        setPlans(planData);
        setListings(listingData);
        setSubscriptions(subscriptionData);

        if (listingData.length > 0) {
          setSelectedListingId(listingData[0].id);
        }
      } catch (err: unknown) {
        if (!mounted) return;

        setError(
          getErrorMessage(
            err,
            "Unable to load subscription information."
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlan = useMemo(
    () =>
      plans.find(
        (plan) => plan.planCode === selectedPlanCode
      ),
    [plans, selectedPlanCode]
  );

  const selectedListing = useMemo(
    () =>
      listings.find(
        (listing) => listing.id === selectedListingId
      ),
    [listings, selectedListingId]
  );

  const existingActiveSubscription = useMemo(
    () =>
      subscriptions.find(
        (subscription) =>
          subscription.listingId === selectedListingId &&
          subscription.status === "ACTIVE" &&
          subscription.expiresAt &&
          new Date(subscription.expiresAt).getTime() >
            Date.now()
      ),
    [subscriptions, selectedListingId]
  );

  const price = selectedPlan
    ? billingCycle === "MONTHLY"
      ? selectedPlan.monthlyPrice
      : selectedPlan.quarterlyPrice
    : 0;

  // Refresh subscription history
  async function refreshSubscriptions() {
    const updatedSubscriptions = await getOwnerSubscriptions();
    setSubscriptions(updatedSubscriptions);
  }

  // Continue to Razorpay payment
  async function handleContinue() {
    setError("");
    setSuccess("");

    if (!selectedListingId) {
      setError("Please select a PG listing first.");
      return;
    }

    if (!selectedPlan) {
      setError("Please select a subscription plan.");
      return;
    }

    if (existingActiveSubscription) {
      setError(
        "This PG already has an active subscription. You can choose another PG or renew after expiry."
      );
      return;
    }

    // Check whether Razorpay Checkout script is loaded
    if (!window.Razorpay) {
      setError(
        "Razorpay Checkout could not be loaded. Please refresh the page and try again."
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create or retrieve pending subscription
      const subscriptionResponse = await createSubscription({
        listingId: selectedListingId,
        planCode: selectedPlan.planCode,
        billingCycle,
      });

      const subscriptionId =
        subscriptionResponse.subscription?.id;

      if (!subscriptionId) {
        throw new Error(
          "Subscription was created, but its ID was not returned by the server."
        );
      }

      // Refresh history so the pending record is visible
      await refreshSubscriptions();

      // 2. Request Razorpay order from backend
      const order = await createRazorpayOrder(subscriptionId);

      if (!order.orderId || !order.keyId) {
        throw new Error(
          "Unable to create Razorpay payment order."
        );
      }

      // 3. Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "BedNear",
        description: `${selectedPlan.planName} Subscription - ${order.listingName}`,
        order_id: order.orderId,

        prefill: {
          name: order.ownerName || "",
          email: order.ownerEmail || "",
          contact: order.ownerPhone || "",
        },

        notes: {
          subscriptionId: order.subscriptionId,
          listingName: order.listingName,
          plan: selectedPlan.planCode,
          billingCycle,
        },

        theme: {
          color: "#7029e8",
        },

        modal: {
          confirm_close: true,

          ondismiss: () => {
            setSubmitting(false);
            setSuccess(
              "Payment window closed. Your subscription remains pending until payment is verified. You can try again from this page."
            );
          },
        },

        // 4. Razorpay returns payment details
        handler: (paymentResponse) => {
          void (async () => {
            try {
              setError("");
              setSuccess(
                "Payment received. Verifying your payment..."
              );

              // 5. Verify payment on backend
              const verificationResponse =
                await verifyRazorpayPayment({
                  subscriptionId: order.subscriptionId,
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                });

              setSuccess(
                verificationResponse.message ||
                  "Payment verified and subscription activated successfully."
              );

              // 6. Refresh subscription history
              await refreshSubscriptions();
            } catch (verificationError: unknown) {
              setError(
                getErrorMessage(
                  verificationError,
                  "Payment was received, but verification could not be completed. Please contact support before trying another payment."
                )
              );

              setSuccess("");

              // Refresh history to show the latest server status
              try {
                await refreshSubscriptions();
              } catch {
                // Keep the original verification error visible.
              }
            } finally {
              setSubmitting(false);
            }
          })();
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle failed payment attempts
      razorpayInstance.on(
        "payment.failed",
        (paymentResponse) => {
          const description =
            paymentResponse.error?.description;

          setError(
            description
              ? `Payment failed: ${description}`
              : "Payment failed. Please try again."
          );

          setSuccess("");
          setSubmitting(false);

          void refreshSubscriptions().catch(() => {
            // Do not replace the payment error with a refresh error.
          });
        }
      );

      razorpayInstance.open();
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Unable to start the payment. Please try again."
        )
      );

      setSuccess("");
      setSubmitting(false);

      try {
        await refreshSubscriptions();
      } catch {
        // Keep the original error visible.
      }
    }
  }

  // Cancel a pending subscription
  async function handleCancelSubscription(
    subscription: OwnerSubscription
  ) {
    if (subscription.status !== "PENDING") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel the pending ${subscription.planName} subscription for ${
        subscription.listing?.name ?? "this PG"
      }?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setCancellingId(subscription.id);

    try {
      const response = await cancelOwnerSubscription(
        subscription.id
      );

      setSuccess(
        response?.message ??
          "Subscription cancelled successfully."
      );

      await refreshSubscriptions();
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Unable to cancel this subscription."
        )
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="subscription-loading">
        <LoaderCircle
          className="subscription-spin"
          size={28}
        />
        <p>Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      {/* Page heading */}
      <header className="subscription-heading">
        <div>
          <div className="subscription-eyebrow">
            <span />
            BEDNEAR OWNER SERVICES
          </div>

          <h1>Plans &amp; Subscriptions</h1>

          <p>
            Choose a plan for each PG and manage its subscription
            from one place.
          </p>
        </div>

        <div className="subscription-heading-icon">
          <Crown size={28} />
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div
          className="subscription-alert subscription-alert-error"
          role="alert"
        >
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          className="subscription-alert subscription-alert-success"
          role="status"
        >
          <ShieldCheck size={19} />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Select PG */}
      <section className="subscription-section">
        <div className="subscription-section-heading">
          <div>
            <h2>1. Select your PG</h2>
            <p>
              Each PG has its own separate subscription.
            </p>
          </div>

          <Building2 size={22} />
        </div>

        {listings.length === 0 ? (
          <div className="subscription-empty">
            <Building2 size={30} />
            <h3>No PG listings found</h3>

            <p>
              Add a PG listing before purchasing a subscription.
            </p>

            <a href="/listings/new">Add your first PG</a>
          </div>
        ) : (
          <div className="subscription-pg-select-wrap">
            <label htmlFor="subscription-pg">
              Choose PG listing
            </label>

            <select
              id="subscription-pg"
              value={selectedListingId}
              onChange={(event) => {
                setSelectedListingId(event.target.value);
                setError("");
                setSuccess("");
              }}
            >
              {listings.map((listing) => (
                <option
                  key={listing.id}
                  value={listing.id}
                >
                  {listing.name} — {listing.locality},{" "}
                  {listing.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedListing && (
          <div className="subscription-selected-pg">
            <div className="subscription-pg-icon">
              <Building2 size={21} />
            </div>

            <div>
              <strong>{selectedListing.name}</strong>
              <span>
                {selectedListing.locality},{" "}
                {selectedListing.city}
              </span>
            </div>

            <span className="subscription-pg-status">
              {selectedListing.status}
            </span>
          </div>
        )}

        {existingActiveSubscription && (
          <div className="subscription-active-notice">
            <ShieldCheck size={19} />

            <div>
              <strong>
                This PG already has an active plan
              </strong>

              <span>
                {existingActiveSubscription.planName} · Expires{" "}
                {formatDate(
                  existingActiveSubscription.expiresAt
                )}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 2. Billing cycle */}
      <section className="subscription-section">
        <div className="subscription-section-heading">
          <div>
            <h2>2. Choose billing cycle</h2>
            <p>Select how often you want to pay.</p>
          </div>

          <CalendarDays size={22} />
        </div>

        <div className="subscription-billing-toggle">
          <button
            type="button"
            className={
              billingCycle === "MONTHLY" ? "active" : ""
            }
            onClick={() => {
              setBillingCycle("MONTHLY");
              setError("");
              setSuccess("");
            }}
          >
            Monthly
            <span>Pay every month</span>
          </button>

          <button
            type="button"
            className={
              billingCycle === "QUARTERLY" ? "active" : ""
            }
            onClick={() => {
              setBillingCycle("QUARTERLY");
              setError("");
              setSuccess("");
            }}
          >
            Quarterly
            <span>Pay every 3 months</span>
          </button>
        </div>
      </section>

      {/* 3. Select plan */}
      <section className="subscription-section">
        <div className="subscription-section-heading">
          <div>
            <h2>3. Select your plan</h2>
            <p>
              Choose the features that suit your PG business.
            </p>
          </div>

          <Sparkles size={22} />
        </div>

        <div className="subscription-plans-grid">
          {plans.map((plan) => {
            const planPrice =
              billingCycle === "MONTHLY"
                ? plan.monthlyPrice
                : plan.quarterlyPrice;

            const selected =
              selectedPlanCode === plan.planCode;

            return (
              <article
                key={plan.planCode}
                className={`subscription-plan-card ${
                  selected ? "selected" : ""
                } ${
                  plan.planCode === "GROWTH"
                    ? "popular"
                    : ""
                }`}
              >
                {plan.planCode === "GROWTH" && (
                  <div className="subscription-popular-label">
                    MOST POPULAR
                  </div>
                )}

                <div className="subscription-plan-top">
                  <div>
                    <span className="subscription-plan-kicker">
                      BEDNEAR {plan.planCode}
                    </span>

                    <h3>{plan.planName}</h3>
                  </div>

                  <div className="subscription-plan-icon">
                    {plan.planCode === "PREMIUM" ? (
                      <Crown size={22} />
                    ) : plan.planCode === "GROWTH" ? (
                      <Sparkles size={22} />
                    ) : (
                      <Building2 size={22} />
                    )}
                  </div>
                </div>

                <div className="subscription-plan-price">
                  <strong>{formatMoney(planPrice)}</strong>

                  <span>
                    /{" "}
                    {billingCycle === "MONTHLY"
                      ? "month"
                      : "quarter"}
                  </span>
                </div>

                {billingCycle === "QUARTERLY" && (
                  <p className="subscription-quarterly-note">
                    Covers 3 months
                  </p>
                )}

                <div className="subscription-plan-divider" />

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={
                    selected
                      ? "subscription-select-plan selected"
                      : "subscription-select-plan"
                  }
                  onClick={() => {
                    setSelectedPlanCode(plan.planCode);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {selected ? "Selected plan" : "Choose plan"}

                  {selected && <Check size={17} />}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. Checkout summary */}
      <section className="subscription-checkout">
        <div className="subscription-checkout-title">
          <div className="subscription-checkout-icon">
            <CreditCard size={22} />
          </div>

          <div>
            <h2>Checkout summary</h2>
            <p>Review your selection before continuing.</p>
          </div>
        </div>

        <div className="subscription-summary-details">
          <div>
            <span>PG listing</span>
            <strong>
              {selectedListing?.name ?? "Not selected"}
            </strong>
          </div>

          <div>
            <span>Selected plan</span>
            <strong>
              {selectedPlan?.planName ?? "Not selected"}
            </strong>
          </div>

          <div>
            <span>Billing cycle</span>
            <strong>
              {billingCycle === "MONTHLY"
                ? "Monthly"
                : "Quarterly"}
            </strong>
          </div>

          <div>
            <span>Subscription amount</span>
            <strong className="subscription-total">
              {formatMoney(price)}
            </strong>
          </div>
        </div>

        <div className="subscription-checkout-bottom">
          <p>
            <ShieldCheck size={16} />
            Your subscription remains pending until payment is
            verified by BedNear.
          </p>

          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={
              submitting ||
              !selectedListing ||
              !selectedPlan ||
              Boolean(existingActiveSubscription)
            }
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="subscription-spin"
                  size={18}
                />
                Processing payment...
              </>
            ) : (
              <>
                Continue to payment
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        <p className="subscription-payment-note">
          Secure payment powered by Razorpay. Your subscription
          will be activated only after successful server-side
          payment verification.
        </p>
      </section>

      {/* 5. Subscription history */}
      <section className="subscription-section subscription-history">
        <div className="subscription-section-heading">
          <div>
            <h2>Subscription history</h2>
            <p>
              Previous and current plans for all your PGs.
            </p>
          </div>

          <button
            type="button"
            className="subscription-refresh-btn"
            title="Refresh subscription history"
            onClick={() => {
              setError("");
              void refreshSubscriptions().catch((err: unknown) => {
                setError(
                  getErrorMessage(
                    err,
                    "Unable to refresh subscription history."
                  )
                );
              });
            }}
            disabled={submitting || cancellingId !== null}
          >
            <RefreshCw size={21} />
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="subscription-history-empty">
            No subscription records yet.
          </div>
        ) : (
          <div className="subscription-history-table-wrap">
            <table className="subscription-history-table">
              <thead>
                <tr>
                  <th>PG name</th>
                  <th>Plan</th>
                  <th>Billing</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      {subscription.listing?.name ??
                        "PG listing"}
                    </td>

                    <td>{subscription.planName}</td>

                    <td>
                      {subscription.billingCycle === "MONTHLY"
                        ? "Monthly"
                        : "Quarterly"}
                    </td>

                    <td>
                      {formatMoney(subscription.amount)}
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          subscription.status
                        )}
                      >
                        {subscription.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(subscription.expiresAt)}
                    </td>

                    <td>
                      {subscription.status === "PENDING" ? (
                        <button
                          type="button"
                          className="subscription-cancel-btn"
                          onClick={() =>
                            void handleCancelSubscription(
                              subscription
                            )
                          }
                          disabled={
                            cancellingId !== null || submitting
                          }
                        >
                          {cancellingId === subscription.id ? (
                            <>
                              <LoaderCircle
                                size={14}
                                className="subscription-spin"
                              />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle size={15} />
                              Cancel
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="subscription-no-action">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
