
import { Request, Response, NextFunction } from "express";

import { prisma } from "../config/prisma";

export const getAdminDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pendingOwnerStatuses = [
      "PENDING_REVIEW",
      "UNDER_REVIEW",
      "RESUBMISSION_REQUIRED",
    ] as const;

    const [
      registeredUsers,
      activeOwners,
      verifiedActiveOwners,
      pendingOwnerVerifications,
      approvedOwners,
      rejectedOwners,
      publishedListings,
      pendingListings,
      totalEnquiries,
      activeSubscriptions,
      successfulPayments,
      recentUsers,
      recentListings,
      recentOwnerVerifications,
    ] = await Promise.all([
      // Total registered owners and candidates
      prisma.user.count({
        where: {
          role: {
            in: ["OWNER", "CANDIDATE"],
          },
        },
      }),

      // Active owner accounts, including those awaiting verification
      prisma.user.count({
        where: {
          role: "OWNER",
          isActive: true,
        },
      }),

      // Active and fully approved owners
      prisma.user.count({
        where: {
          role: "OWNER",
          isActive: true,
          isVerified: true,
          verificationStatus: "APPROVED",
        },
      }),

      // Owners awaiting review or resubmission
      prisma.user.count({
        where: {
          role: "OWNER",
          verificationStatus: {
            in: [...pendingOwnerStatuses],
          },
        },
      }),

      // Approved owner accounts
      prisma.user.count({
        where: {
          role: "OWNER",
          verificationStatus: "APPROVED",
        },
      }),

      // Rejected owner accounts
      prisma.user.count({
        where: {
          role: "OWNER",
          verificationStatus: "REJECTED",
        },
      }),

      // Published PG listings
      prisma.listing.count({
        where: {
          status: "PUBLISHED",
        },
      }),

      // PG listings waiting for admin approval
      prisma.listing.count({
        where: {
          status: "PENDING",
        },
      }),

      // Total enquiries
      prisma.enquiry.count(),

      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),

      // Successful payments grouped by currency
      prisma.payment.groupBy({
        by: ["currency"],
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

      // Recent registered users
      prisma.user.findMany({
        where: {
          role: {
            in: ["OWNER", "CANDIDATE"],
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          verificationStatus: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),

      // Recent PG listings
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
              isVerified: true,
              verificationStatus: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),

      // Recent owner registrations requiring verification
      prisma.user.findMany({
        where: {
          role: "OWNER",
          verificationStatus: {
            in: [...pendingOwnerStatuses],
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessName: true,
          isActive: true,
          isVerified: true,
          verificationStatus: true,
          createdAt: true,

          verificationDocuments: {
            where: {
              listingId: null,
            },

            select: {
              id: true,
              type: true,
              status: true,
              originalName: true,
              reviewNote: true,
              reviewedAt: true,
            },

            orderBy: {
              createdAt: "desc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),
    ]);

    res.status(200).json({
      message: "Admin dashboard statistics retrieved successfully.",

      stats: {
        registeredUsers,
        activeOwners,
        verifiedActiveOwners,

        pendingOwnerVerifications,
        approvedOwners,
        rejectedOwners,

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
      recentOwnerVerifications,

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
