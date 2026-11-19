
import { Request } from "express";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

type AuthenticatedRequest = Request & {
  userId?: string;
};

function getUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

const verifySchema = z.object({
  subscriptionId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// POST /api/v1/subscriptions/:subscriptionId/order
export const createRazorpayOrder = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);
   const subscriptionId = Array.isArray(req.params.subscriptionId)
  ? req.params.subscriptionId[0]
  : req.params.subscriptionId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
      include: {
        listing: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          where: {
            status: "PENDING",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found.",
      });
    }

    if (subscription.status !== "PENDING") {
      return res.status(409).json({
        message: "This subscription is not pending.",
      });
    }

    const payment = subscription.payments[0];

    if (!payment) {
      return res.status(404).json({
        message: "Pending payment record not found.",
      });
    }

    const razorpay = getRazorpayClient();

    // Reuse an existing Razorpay order rather than
    // creating another order for the same payment.
    if (payment.providerOrderId) {
      if (payment.provider !== "RAZORPAY") {
        return res.status(409).json({
          message: "This payment uses a different provider.",
        });
      }

      const existingOrder = await razorpay.orders.fetch(
        payment.providerOrderId
      );

      return res.json({
        message: "Existing Razorpay order retrieved.",
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: payment.providerOrderId,
        amount: payment.amount * 100,
        currency: payment.currency,
        subscriptionId: subscription.id,
        ownerName: subscription.user.name,
        ownerEmail: subscription.user.email,
        ownerPhone: subscription.user.phone,
        listingName: subscription.listing?.name ?? "BedNear PG",
        orderStatus: existingOrder.status,
      });
    }

    const receipt = payment.receipt ?? `bn_${payment.id}`;

    // Database stores whole rupees.
    // Razorpay expects paise.
    const amountInPaise = payment.amount * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: payment.currency,
      receipt,
      notes: {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        ownerId: userId,
      },
    });

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        provider: "RAZORPAY",
        providerOrderId: order.id,
        receipt,
      },
    });

    return res.status(201).json({
      message: "Razorpay order created successfully.",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subscriptionId: subscription.id,
      ownerName: subscription.user.name,
      ownerEmail: subscription.user.email,
      ownerPhone: subscription.user.phone,
      listingName: subscription.listing?.name ?? "BedNear PG",
    });
  }
);

// POST /api/v1/subscriptions/verify
export const verifyRazorpayPayment = asyncHandler(
  async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const parsed = verifySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payment verification details.",
        errors: parsed.error.flatten(),
      });
    }

    const {
      subscriptionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(503).json({
        message: "Payment verification is not configured.",
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
      include: {
        payments: {
          where: {
            providerOrderId: razorpay_order_id,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found.",
      });
    }

    const payment = subscription.payments[0];

    if (!payment || payment.provider !== "RAZORPAY") {
      return res.status(400).json({
        message: "Razorpay payment order not found.",
      });
    }

    // Verify the signature using the order ID stored
    // in our database, not an untrusted order ID alone.
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${payment.providerOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(razorpay_signature, "hex");
    const generatedBuffer = Buffer.from(generatedSignature, "hex");

    const signatureValid =
      receivedBuffer.length === generatedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, generatedBuffer);

    if (!signatureValid) {
      return res.status(400).json({
        message: "Payment signature verification failed.",
      });
    }

    const razorpay = getRazorpayClient();

    // Verify payment status directly with Razorpay.
    const gatewayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      gatewayPayment.order_id !== payment.providerOrderId ||
      gatewayPayment.amount !== payment.amount * 100 ||
      gatewayPayment.currency !== payment.currency ||
      gatewayPayment.status !== "captured"
    ) {
      return res.status(409).json({
        message:
          "Payment has not been captured or its details do not match.",
        paymentStatus: gatewayPayment.status,
      });
    }

    const now = new Date();

    const durationDays =
      subscription.billingCycle === "MONTHLY" ? 30 : 90;

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const result = await prisma.$transaction(
      async (tx) => {
        const currentPayment = await tx.payment.findUnique({
          where: {
            id: payment.id,
          },
        });

        const currentSubscription =
          await tx.subscription.findUnique({
            where: {
              id: subscriptionId,
            },
          });

        if (!currentPayment || !currentSubscription) {
          throw new Error("Payment or subscription record not found.");
        }

        // Allow safe retries of the same successful payment.
        if (
          currentPayment.status === "SUCCESS" &&
          currentPayment.providerPaymentId === razorpay_payment_id &&
          currentSubscription.status === "ACTIVE"
        ) {
          return currentSubscription;
        }

        if (
          currentPayment.status !== "PENDING" ||
          currentSubscription.status !== "PENDING"
        ) {
          throw new Error(
            "This payment or subscription has already been processed."
          );
        }

        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "SUCCESS",
            providerPaymentId: razorpay_payment_id,
            paidAt: now,
          },
        });

        return tx.subscription.update({
          where: {
            id: subscriptionId,
          },
          data: {
            status: "ACTIVE",
            startsAt: now,
            expiresAt,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return res.json({
      message: "Payment verified and subscription activated successfully.",
      subscription: result,
    });
  }
);
