import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

// GET /api/v1/dashboard/summary
export const getDashboardSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = (req as AuthenticatedRequest).userId;

    if (!ownerId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const [
      totalListings,
      publishedListings,
      rooms,
      beds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
      enquiries,
      newEnquiries,
      recentEnquiries,
    ] = await Promise.all([
      prisma.listing.count({
        where: { ownerId },
      }),

      prisma.listing.count({
        where: {
          ownerId,
          status: "PUBLISHED",
        },
      }),

      prisma.room.count({
        where: {
          listing: { ownerId },
        },
      }),

      prisma.bed.count({
        where: {
          room: {
            listing: { ownerId },
          },
        },
      }),

      prisma.bed.count({
        where: {
          status: "AVAILABLE",
          room: {
            listing: { ownerId },
          },
        },
      }),

      prisma.bed.count({
        where: {
          status: "OCCUPIED",
          room: {
            listing: { ownerId },
          },
        },
      }),

      prisma.bed.count({
        where: {
          status: "MAINTENANCE",
          room: {
            listing: { ownerId },
          },
        },
      }),

      prisma.enquiry.count({
        where: { ownerId },
      }),

      prisma.enquiry.count({
        where: {
          ownerId,
          status: "NEW",
        },
      }),

      prisma.enquiry.findMany({
        where: { ownerId },
        include: {
          listing: {
            select: {
              id: true,
              name: true,
              locality: true,
              city: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return res.json({
      totalListings,
      publishedListings,
      rooms,
      beds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
      enquiries,
      newEnquiries,
      recentEnquiries,
    });
  }
);