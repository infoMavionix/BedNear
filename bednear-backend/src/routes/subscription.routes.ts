
import { Router } from "express";

import authMiddleware, {
  requireApprovedOwner,
} from "../middleware/auth.middleware";

import {
  getSubscriptionPlans,
  getMySubscriptions,
  createSubscriptionCheckout,
  cancelPendingSubscription,
} from "../controllers/subscription.controller";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/subscription-payment.controller";

const router = Router();

// All subscription operations require an authenticated,
// active and admin-approved OWNER account.
router.use(authMiddleware, requireApprovedOwner);

// Available subscription plans
router.get("/plans", getSubscriptionPlans);

// Logged-in owner's subscriptions
router.get("/my", getMySubscriptions);

// Create a pending checkout
router.post("/checkout", createSubscriptionCheckout);

// Create Razorpay payment order
router.post(
  "/:subscriptionId/order",
  createRazorpayOrder
);

// Verify Razorpay payment and activate subscription
router.post(
  "/verify",
  verifyRazorpayPayment
);
// Cancel an unpaid pending subscription
router.post(
  "/:subscriptionId/cancel",
  cancelPendingSubscription
);

export default router;
