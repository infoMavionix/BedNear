
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(""),
  status: z.enum([
    "ALL",
    "PENDING",
    "SUCCESS",
    "FAILED",
    "REFUNDED",
    "CANCELLED",
  ]).default("ALL"),
});

export const getAdminPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid payment filters.",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { page, limit, search, status } = parsed.data;

    const where = {
      ...(status !== "ALL" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { providerOrderId: { contains: search, mode: "insensitive" as const } },
              { providerPaymentId: { contains: search, mode: "insensitive" as const } },
              { receipt: { contains: search, mode: "insensitive" as const } },
              {
                subscription: {
                  OR: [
                    { planName: { contains: search, mode: "insensitive" as const } },
                    {
                      user: {
                        name: { contains: search, mode: "insensitive" as const },
                      },
                    },
                    {
                      user: {
                        email: { contains: search, mode: "insensitive" as const },
                      },
                    },
                    {
                      listing: {
                        name: { contains: search, mode: "insensitive" as const },
                      },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [payments, total, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          subscription: {
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.payment.count({ where }),

      prisma.payment.groupBy({
        by: ["status", "currency"],
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    res.status(200).json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: summary.map((item) => ({
        status: item.status,
        currency: item.currency,
        totalAmount: item._sum.amount ?? 0,
        count: item._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
};
