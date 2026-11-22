
import { Request } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

// Safely extract route parameter ID.
function getParamId(req: Request): string | undefined {
  const id: unknown = req.params["id"];

  if (typeof id === "string") {
    return id;
  }

  if (Array.isArray(id) && typeof id[0] === "string") {
    return id[0];
  }

  return undefined;
}

const createPlanSchema = z.object({
  code: z.string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_]+$/)
    .transform((value) => value.toUpperCase()),

  name: z.string().trim().min(2).max(80),

  description: z.string()
    .trim()
    .max(500)
    .optional()
    .nullable(),

  monthlyPrice: z.number().int().min(1),
  quarterlyPrice: z.number().int().min(1),

  features: z.array(z.string().trim().min(1)).default([]),

  isActive: z.boolean().default(true),
});

const updatePlanSchema = createPlanSchema
  .omit({ code: true })
  .partial();

const statusSchema = z.object({
  isActive: z.boolean(),
});

// GET /api/v1/admin/subscription-plans
export const getAdminSubscriptionPlans = asyncHandler(
  async (_req, res) => {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({ plans });
  }
);

// POST /api/v1/admin/subscription-plans
export const createAdminSubscriptionPlan = asyncHandler(
  async (req, res) => {
    const parsed = createPlanSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid subscription plan details.",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await prisma.subscriptionPlan.findUnique({
      where: {
        code: parsed.data.code,
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "A plan with this code already exists.",
      });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: parsed.data,
    });

    return res.status(201).json({
      message: "Subscription plan created successfully.",
      plan,
    });
  }
);

// PUT /api/v1/admin/subscription-plans/:id
export const updateAdminSubscriptionPlan = asyncHandler(
  async (req, res) => {
    const planId = getParamId(req);

    if (!planId) {
      return res.status(400).json({
        message: "A valid subscription plan ID is required.",
      });
    }

    const parsed = updatePlanSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid subscription plan details.",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Subscription plan not found.",
      });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: parsed.data,
    });

    return res.json({
      message: "Subscription plan updated successfully.",
      plan,
    });
  }
);

// PATCH /api/v1/admin/subscription-plans/:id/status
export const updateAdminSubscriptionPlanStatus = asyncHandler(
  async (req, res) => {
    const planId = getParamId(req);

    if (!planId) {
      return res.status(400).json({
        message: "A valid subscription plan ID is required.",
      });
    }

    const parsed = statusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "A valid isActive value is required.",
      });
    }

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Subscription plan not found.",
      });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        isActive: parsed.data.isActive,
      },
    });

    return res.json({
      message: `Plan ${
        plan.isActive ? "activated" : "deactivated"
      } successfully.`,
      plan,
    });
  }
);
