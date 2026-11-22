
import { Request } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

type AuthenticatedRequest = Request & {
  userId?: string;
};

const checkoutSchema = z.object({
  listingId: z.string().min(1, "Please select a PG."),
  planCode: z.string().trim().min(2).max(40),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY"]),
});

function getUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}

// Shared subscription response structure for checkout queries.
const checkoutInclude = {
  listing: {
    select: {
      id: true,
      name: true,
    },
  },
  payments: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
} satisfies Prisma.SubscriptionInclude;

type CheckoutSubscription = Prisma.SubscriptionGetPayload<{
  include: typeof checkoutInclude;
}>;

type CheckoutResult =
  | {
      type: "ACTIVE";
      subscription: CheckoutSubscription;
    }
  | {
      type: "CONFLICT";
      subscription: CheckoutSubscription;
    }
  | {
      type: "SUCCESS";
      subscription: CheckoutSubscription;
      reused: boolean;
    };

// GET /api/v1/subscriptions/plans
export const getSubscriptionPlans = asyncHandler(
  async (_req, res) => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      plans,
      billingCycles: [
        { code: "MONTHLY", label: "Monthly", durationDays: 30 },
        { code: "QUARTERLY", label: "Quarterly", durationDays: 90 },
      ],
    });
  }
);

// GET /api/v1/subscriptions/my
export const getMySubscriptions = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
      },
      include: {
        listing: {
          select: {
            id: true,
            name: true,
            city: true,
            locality: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ subscriptions });
  }
);

// POST /api/v1/subscriptions/checkout
// Creates a pending subscription and payment record.
// Reuses an existing pending checkout for the same PG,
// plan and billing cycle.
export const createSubscriptionCheckout = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const parsed = checkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid subscription selection.",
        errors: parsed.error.flatten(),
      });
    }

    const { listingId, planCode, billingCycle } = parsed.data;

    // Confirm that this PG belongs to the logged-in owner.
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!listing) {
      return res.status(404).json({
        message: "PG listing not found for this owner.",
      });
    }

    // Always read current pricing from the database.
    const selectedPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        code: planCode,
        isActive: true,
      },
    });

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid or inactive subscription plan.",
      });
    }

    if (selectedPlan.code === "FREE_TRIAL" || selectedPlan.monthlyPrice <= 0 || selectedPlan.quarterlyPrice <= 0) {
      return res.status(400).json({
        message: "Free trials must be activated through the free-trial endpoint.",
      });
    }

    // Calculate amount using server-side pricing.
    const amount =
      billingCycle === "MONTHLY"
        ? selectedPlan.monthlyPrice
        : selectedPlan.quarterlyPrice;

    // Retry serialization conflicts caused by simultaneous requests.
    let result: CheckoutResult | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await prisma.$transaction(
          async (tx): Promise<CheckoutResult> => {
            const now = new Date();

            // Check whether this PG already has an active subscription.
            const activeSubscription =
              await tx.subscription.findFirst({
                where: {
                  userId,
                  listingId,
                  status: "ACTIVE",
                  expiresAt: {
                    gt: now,
                  },
                },
                include: checkoutInclude,
              });

            if (activeSubscription) {
              return {
                type: "ACTIVE",
                subscription: activeSubscription,
              };
            }

            // Find the latest pending checkout for this PG.
            const pendingSubscription =
              await tx.subscription.findFirst({
                where: {
                  userId,
                  listingId,
                  status: "PENDING",
                },
                include: checkoutInclude,
                orderBy: {
                  createdAt: "desc",
                },
              });

            if (pendingSubscription) {
              // Same plan and billing cycle: reuse existing checkout.
              if (
                pendingSubscription.planCode === planCode &&
                pendingSubscription.billingCycle === billingCycle
              ) {
                return {
                  type: "SUCCESS",
                  subscription: pendingSubscription,
                  reused: true,
                };
              }

              // Different plan or billing cycle: require resolution first.
              return {
                type: "CONFLICT",
                subscription: pendingSubscription,
              };
            }

            // No active or pending subscription: create a new checkout.
            const subscription =
              await tx.subscription.create({
                data: {
                  userId,
                  listingId,
                  planCode,
                  planName: selectedPlan.name,
                  billingCycle,
                  amount,
                  currency: "INR",
                  status: "PENDING",
                  payments: {
                    create: {
                      amount,
                      currency: "INR",
                      status: "PENDING",
                      provider: null,
                    },
                  },
                },
                include: checkoutInclude,
              });

            return {
              type: "SUCCESS",
              subscription,
              reused: false,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          }
        );

        break;
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        if (isSerializationConflict && attempt < 3) {
          continue;
        }

        throw error;
      }
    }

    if (!result) {
      return res.status(409).json({
        message:
          "Checkout could not be completed. Please try again.",
      });
    }

    // An active subscription already exists.
    if (result.type === "ACTIVE") {
      return res.status(409).json({
        message:
          "This PG already has an active subscription. Use the renewal or upgrade flow.",
        subscriptionId: result.subscription.id,
      });
    }

    // A different pending checkout already exists.
    if (result.type === "CONFLICT") {
      return res.status(409).json({
        message:
          "A pending checkout already exists for this PG with a different plan or billing cycle. Please complete or cancel the existing checkout before selecting another plan.",
        existingSubscription: {
          id: result.subscription.id,
          planCode: result.subscription.planCode,
          planName: result.subscription.planName,
          billingCycle: result.subscription.billingCycle,
          amount: result.subscription.amount,
          status: result.subscription.status,
        },
      });
    }

    // New or reused pending checkout.
    return res.status(result.reused ? 200 : 201).json({
      message: result.reused
        ? "An existing pending checkout was found and reused."
        : "Subscription checkout created. Payment gateway setup is required before payment can be completed.",
      checkoutReady: false,
      paymentGatewayConfigured: false,
      reused: result.reused,
      subscription: result.subscription,
    });
  }
);

// POST /api/v1/subscriptions/:subscriptionId/cancel
// Cancels an unpaid pending subscription and its pending payment records.
export const cancelPendingSubscription = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);
    const { subscriptionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    if (!subscriptionId || typeof subscriptionId !== "string") {
      return res.status(400).json({
        message: "A valid subscription ID is required.",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Owners can cancel only their own subscriptions.
        const subscription = await tx.subscription.findFirst({
          where: {
            id: subscriptionId,
            userId,
          },
          include: {
            payments: {
              select: {
                id: true,
                status: true,
                providerOrderId: true,
              },
            },
          },
        });

        if (!subscription) {
          return {
            type: "NOT_FOUND" as const,
          };
        }

        // Only pending subscriptions can be cancelled.
        if (subscription.status !== "PENDING") {
          return {
            type: "INVALID_STATUS" as const,
            status: subscription.status,
          };
        }

        // Never cancel a subscription that has a successful payment.
        const hasSuccessfulPayment = subscription.payments.some(
          (payment) => payment.status === "SUCCESS"
        );

        if (hasSuccessfulPayment) {
          return {
            type: "PAYMENT_SUCCESS" as const,
          };
        }

        // A gateway order may still be payable externally.
        // Once a gateway is integrated, its order must be cancelled
        // with the provider before allowing local cancellation.
        const hasProviderOrder = subscription.payments.some(
          (payment) => Boolean(payment.providerOrderId)
        );

        if (hasProviderOrder) {
          return {
            type: "GATEWAY_ORDER_EXISTS" as const,
          };
        }

        // Conditional update prevents cancelling a record that
        // another request has already changed.
        const updateResult = await tx.subscription.updateMany({
          where: {
            id: subscriptionId,
            userId,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
          },
        });

        if (updateResult.count !== 1) {
          return {
            type: "INVALID_STATUS" as const,
            status: subscription.status,
          };
        }

        // Preserve payment history and mark pending payments cancelled.
        await tx.payment.updateMany({
          where: {
            subscriptionId,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
          },
        });

        const cancelledSubscription =
          await tx.subscription.findUnique({
            where: {
              id: subscriptionId,
            },
            include: {
              listing: {
                select: {
                  id: true,
                  name: true,
                },
              },
              payments: {
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          });

        return {
          type: "SUCCESS" as const,
          subscription: cancelledSubscription,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    if (result.type === "NOT_FOUND") {
      return res.status(404).json({
        message: "Subscription not found.",
      });
    }

    if (result.type === "INVALID_STATUS") {
      return res.status(409).json({
        message:
          "Only pending subscriptions can be cancelled.",
        currentStatus: result.status,
      });
    }

    if (result.type === "PAYMENT_SUCCESS") {
      return res.status(409).json({
        message:
          "This subscription has a successful payment and cannot be cancelled through this endpoint.",
      });
    }

    if (result.type === "GATEWAY_ORDER_EXISTS") {
      return res.status(409).json({
        message:
          "A payment gateway order exists for this subscription. Cancel the order with the payment provider before cancelling this subscription.",
      });
    }

    return res.status(200).json({
      message: "Pending subscription cancelled successfully.",
      subscription: result.subscription,
    });
  }
);

// GET /api/v1/subscriptions/trial-eligibility?listingId=...
export const getFreeTrialEligibility = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const listingId =
      typeof req.query.listingId === "string"
        ? req.query.listingId
        : "";

    if (!listingId) {
      return res.status(400).json({
        message: "A valid listingId is required.",
      });
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true },
    });

    if (!listing) {
      return res.status(404).json({
        message: "PG listing not found for this owner.",
      });
    }

    const previousTrial = await prisma.subscription.findFirst({
      where: { listingId, planCode: "FREE_TRIAL" },
      select: { id: true },
    });

    return res.json({
      eligible: !previousTrial,
      message: previousTrial
        ? "This PG listing has already used its free trial."
        : "This PG listing is eligible for a 30-day free trial.",
    });
  }
);

// POST /api/v1/subscriptions/trial
// One free 30-day trial per PG listing. No payment record or Razorpay order.
export const activateFreeTrial = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const parsed = z.object({
      listingId: z.string().min(1),
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Please select a valid PG listing.",
        errors: parsed.error.flatten(),
      });
    }

    const { listingId } = parsed.data;

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true, name: true },
    });

    if (!listing) {
      return res.status(404).json({
        message: "PG listing not found for this owner.",
      });
    }

    try {
      const subscription = await prisma.$transaction(
        async (tx) => {
          const previousTrial = await tx.subscription.findFirst({
            where: { listingId, planCode: "FREE_TRIAL" },
            select: { id: true },
          });

          if (previousTrial) {
            throw new Error("FREE_TRIAL_ALREADY_USED");
          }

          const existingSubscription = await tx.subscription.findFirst({
            where: {
              userId,
              listingId,
              status: { in: ["ACTIVE", "PENDING"] },
            },
            select: { id: true },
          });

          if (existingSubscription) {
            throw new Error("SUBSCRIPTION_ALREADY_EXISTS");
          }

          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + 30);

          return tx.subscription.create({
            data: {
              userId,
              listingId,
              planCode: "FREE_TRIAL",
              planName: "Free Trial",
              billingCycle: "MONTHLY",
              amount: 0,
              currency: "INR",
              status: "ACTIVE",
              startsAt: now,
              expiresAt,
            },
            include: {
              listing: {
                select: { id: true, name: true },
              },
              payments: {
                orderBy: { createdAt: "desc" },
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return res.status(201).json({
        message: "Your 30-day free trial has been activated successfully.",
        subscription,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "FREE_TRIAL_ALREADY_USED") {
        return res.status(409).json({
          message: "This PG listing has already used its free trial.",
        });
      }

      if (error instanceof Error && error.message === "SUBSCRIPTION_ALREADY_EXISTS") {
        return res.status(409).json({
          message: "This PG already has an active subscription or pending checkout.",
        });
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return res.status(409).json({
          message: "The trial request is being processed. Please refresh and try again.",
        });
      }

      throw error;
    }
  }
);

// GET /api/v1/admin/subscriptions
export const getAdminSubscriptions = asyncHandler(
  async (req, res) => {
    const page = Math.max(
      1,
      Number.parseInt(String(req.query.page || "1"), 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(String(req.query.limit || "10"), 10) || 10
      )
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : "ALL";

    const validStatuses = [
      "PENDING",
      "ACTIVE",
      "EXPIRED",
      "CANCELLED",
      "FAILED",
    ];

    if (status !== "ALL" && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid subscription status.",
      });
    }

    const where = {
      ...(status !== "ALL"
        ? {
            status: status as
              | "PENDING"
              | "ACTIVE"
              | "EXPIRED"
              | "CANCELLED"
              | "FAILED",
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                user: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                listing: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          listing: {
            select: {
              id: true,
              name: true,
              city: true,
              locality: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    return res.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);





// GET /api/v1/admin/subscriptions/summary
export const getAdminSubscriptionSummary = asyncHandler(
  async (_req, res) => {
    const now = new Date();

    // First day of the current month
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [
      totalSubscriptions,
      activeSubscriptions,
      pendingSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      failedSubscriptions,
      successfulPayments,
      monthlyPayments,
    ] = await Promise.all([
      // Total subscriptions
      prisma.subscription.count(),

      // Active subscriptions that have not expired
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          expiresAt: {
            gt: now,
          },
        },
      }),

      // Pending subscriptions
      prisma.subscription.count({
        where: {
          status: "PENDING",
        },
      }),

      // Expired subscriptions, including active records
      // whose expiry date has passed
      prisma.subscription.count({
        where: {
          OR: [
            {
              status: "EXPIRED",
            },
            {
              status: "ACTIVE",
              expiresAt: {
                lte: now,
              },
            },
          ],
        },
      }),

      // Cancelled subscriptions
      prisma.subscription.count({
        where: {
          status: "CANCELLED",
        },
      }),

      // Failed subscriptions
      prisma.subscription.count({
        where: {
          status: "FAILED",
        },
      }),

      // All successful payments
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),

      // Successful payments for the current month
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          paidAt: {
            gte: monthStart,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return res.json({
      success: true,

      summary: {
        totalSubscriptions,
        activeSubscriptions,
        pendingSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        failedSubscriptions,

        // Total successful payment revenue
        totalRevenue: successfulPayments._sum.amount ?? 0,

        successfulPaymentCount:
          successfulPayments._count.id,

        // Current month revenue
        monthlyRevenue: monthlyPayments._sum.amount ?? 0,

        monthlyPaymentCount:
          monthlyPayments._count.id,

        currency: "INR",
      },
    });
  }
);
