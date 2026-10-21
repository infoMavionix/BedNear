
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const enquiryUpdateInput = z.object({
  status: z.enum(["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED"]).optional(),
  ownerNotes: z.string().max(3000).nullable().optional(),
  preferredVisitAt: z.coerce.date().nullable().optional(),
});

const publicEnquiryInput = z.object({
  listingId: z.string().min(1),
  candidateName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  email: z.string().email().optional(),
  message: z.string().max(2000).optional(),
});

export const getEnquiries = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;

  const enquiries = await prisma.enquiry.findMany({
    where: { ownerId },
    include: {
      listing: {
        select: { id: true, name: true, locality: true, monthlyRent: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ enquiries });
});

export const updateEnquiry = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;
  const id = z.string().min(1).parse(req.params.id);
  const data = enquiryUpdateInput.parse(req.body);

  const existing = await prisma.enquiry.findFirst({
    where: { id, ownerId },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Enquiry not found." });
  }

  const enquiry = await prisma.enquiry.update({
    where: { id },
    data,
    include: {
      listing: { select: { id: true, name: true, locality: true, monthlyRent: true } },
    },
  });

  return res.json({ enquiry });
});

export const createPublicEnquiry = asyncHandler(
  async (req: Request, res: Response) => {
    const data = publicEnquiryInput.parse(req.body);

    const listing = await prisma.listing.findFirst({
      where: { id: data.listingId, status: "PUBLISHED" },
      select: { id: true, ownerId: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Published PG not found." });
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        candidateName: data.candidateName,
        phone: data.phone,
        email: data.email,
        message: data.message,
        listingId: listing.id,
        ownerId: listing.ownerId,
      },
      select: { id: true, createdAt: true },
    });

    return res.status(201).json({
      message: "Enquiry submitted successfully.",
      enquiryId: enquiry.id,
      createdAt: enquiry.createdAt,
    });
  }
);
