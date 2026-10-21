
import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

type AuthenticatedRequest = Request & {
  userId?: string;
};

const listingInput = z.object({
  name: z.string().trim().min(2),
  category: z.string().default("PG"),
  description: z.string().nullable().optional(),
  address: z.string().trim().min(3),
  locality: z.string().trim().min(2),
  city: z.string().default("Bengaluru"),
  state: z.string().default("Karnataka"),
  pincode: z.string().nullable().optional(),
  genderPolicy: z.string().default("Any"),
  monthlyRent: z.coerce.number().int().nonnegative().nullable().optional(),
  deposit: z.coerce.number().int().nonnegative().nullable().optional(),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "INACTIVE"]).optional(),
});

function getOwnerId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}

// GET /api/v1/listings
export const getListings = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const listings = await prisma.listing.findMany({
    where: { ownerId },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      _count: {
        select: { enquiries: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return res.json({ listings });
});

// POST /api/v1/listings
export const createListing = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const data = listingInput.parse(req.body);

  const listing = await prisma.listing.create({
    data: {
      ...data,
      ownerId,
    },
  });

  return res.status(201).json({ listing });
});

// GET /api/v1/listings/:id
export const getListingById = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const id = z.string().min(1).parse(req.params.id);

  const listing = await prisma.listing.findFirst({
    where: {
      id,
      ownerId,
    },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      enquiries: true,
      images: true,
      amenities: {
        include: {
          amenity: true,
        },
      },
    },
  });

  if (!listing) {
    return res.status(404).json({ message: "PG listing not found." });
  }

  return res.json({ listing });
});

// PATCH /api/v1/listings/:id
export const updateListing = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const id = z.string().min(1).parse(req.params.id);
  const data = listingInput.partial().parse(req.body);

  const existing = await prisma.listing.findFirst({
    where: {
      id,
      ownerId,
    },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "PG listing not found." });
  }

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data: data as Prisma.ListingUpdateInput,
  });

  return res.json({ listing });
});

// DELETE /api/v1/listings/:id

export const deleteListing = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const id = z.string().min(1).parse(req.params.id);

  const existing = await prisma.listing.findFirst({
    where: { id, ownerId },
    select: { id: true, name: true },
  });

  if (!existing) {
    return res.status(404).json({
      message: "PG listing not found.",
    });
  }

  await prisma.$transaction(async (tx) => {
    const rooms = await tx.room.findMany({
      where: { listingId: existing.id },
      select: { id: true },
    });

    const roomIds = rooms.map((room) => room.id);

    if (roomIds.length > 0) {
      await tx.bed.deleteMany({
        where: { roomId: { in: roomIds } },
      });
    }

    await tx.room.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.favorite.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.listingAmenity.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.listingImage.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.enquiry.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.listing.delete({
      where: { id: existing.id },
    });
  });

  return res.json({
    message: `PG "${existing.name}" deleted successfully.`,
    id: existing.id,
  });
});
