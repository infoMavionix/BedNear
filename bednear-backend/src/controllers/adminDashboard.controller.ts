
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export const getAdminDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      registeredUsers,
      activeOwners,
      publishedListings,
      pendingListings,
      totalEnquiries,
      activeSubscriptions,
      successfulPayments,
      recentUsers,
      recentListings,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: { in: ["OWNER", "CANDIDATE"] } },
      }),

      prisma.user.count({
        where: { role: "OWNER", isActive: true },
      }),

      prisma.listing.count({
        where: { status: "PUBLISHED" },
      }),

      prisma.listing.count({
        where: { status: "PENDING" },
      }),

      prisma.enquiry.count(),

      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),

      prisma.payment.groupBy({
        by: ["currency"],
        where: { status: "SUCCESS" },
        _sum: { amount: true },
        _count: { id: true },
      }),

      prisma.user.findMany({
        where: { role: { in: ["OWNER", "CANDIDATE"] } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      prisma.listing.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          locality: true,
          status: true,
          createdAt: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    res.status(200).json({
      message: "Admin dashboard statistics retrieved successfully.",
      stats: {
        registeredUsers,
        activeOwners,
        publishedListings,
        pendingListings,
        totalEnquiries,
        activeSubscriptions,
      },
      revenue: successfulPayments.map((payment) => ({
        currency: payment.currency,
        successfulPaymentCount: payment._count.id,
        totalAmount: payment._sum.amount ?? 0,
      })),
      recentUsers,
      recentListings,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
