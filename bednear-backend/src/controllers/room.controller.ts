
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const roomInput = z.object({
  name: z.string().trim().min(1),
  roomType: z.string().trim().min(1).default("Shared"),
  capacity: z.coerce.number().int().min(1),
  monthlyRent: z.coerce.number().int().nonnegative().nullable().optional(),
  listingId: z.string().min(1),
});

const roomUpdateInput = roomInput.omit({ listingId: true }).partial();

// GET /api/v1/rooms
export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;

  const rooms = await prisma.room.findMany({
    where: { listing: { ownerId } },
    include: {
      listing: {
        select: { id: true, name: true, locality: true },
      },
      beds: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ rooms });
});

// POST /api/v1/rooms
// Create a room and its individual beds in one transaction.
export const createRoom = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = (req as AuthenticatedRequest).userId!;
    const data = roomInput.parse(req.body);

    const listing = await prisma.listing.findFirst({
      where: {
        id: data.listingId,
        ownerId,
      },
      select: { id: true },
    });

    if (!listing) {
      return res.status(404).json({
        message: "PG listing not found.",
      });
    }

    const room = await prisma.$transaction(async (tx) => {
      const createdRoom = await tx.room.create({
        data: {
          name: data.name,
          roomType: data.roomType,
          capacity: data.capacity,
          monthlyRent: data.monthlyRent ?? null,
          listingId: listing.id,
        },
      });

      await tx.bed.createMany({
        data: Array.from({ length: data.capacity }, (_, index) => ({
          bedNumber: `Bed ${index + 1}`,
          status: "AVAILABLE" as const,
          monthlyRent: data.monthlyRent ?? null,
          roomId: createdRoom.id,
        })),
      });

      return tx.room.findUniqueOrThrow({
        where: { id: createdRoom.id },
        include: {
          beds: {
            orderBy: { createdAt: "asc" },
          },
          listing: {
            select: { id: true, name: true, locality: true },
          },
        },
      });
    });

    return res.status(201).json({ room });
  }
);

// PATCH /api/v1/rooms/:id
// Update a room and create any missing numbered beds.
export const updateRoom = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = (req as AuthenticatedRequest).userId!;
    const id = z.string().min(1).parse(req.params.id);
    const data = roomUpdateInput.parse(req.body);

    const existing = await prisma.room.findFirst({
      where: {
        id,
        listing: { ownerId },
      },
      include: {
        beds: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Room not found.",
      });
    }

    const targetCapacity = data.capacity ?? existing.capacity;

    if (targetCapacity < existing.beds.length) {
      return res.status(400).json({
        message: `Capacity cannot be lower than the ${existing.beds.length} existing beds. Delete individual beds before reducing capacity.`,
      });
    }

    const existingBedNumbers = new Set(
      existing.beds.map((bed) => bed.bedNumber)
    );

    const missingBeds = Array.from(
      { length: targetCapacity },
      (_, index) => `Bed ${index + 1}`
    )
      .filter((bedNumber) => !existingBedNumbers.has(bedNumber))
      .map((bedNumber) => ({
        bedNumber,
        status: "AVAILABLE" as const,
        monthlyRent:
          data.monthlyRent !== undefined
            ? data.monthlyRent
            : existing.monthlyRent,
        roomId: existing.id,
      }));

    const room = await prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: existing.id },
        data,
      });

      if (missingBeds.length > 0) {
        await tx.bed.createMany({
          data: missingBeds,
        });
      }

      return tx.room.findUniqueOrThrow({
        where: { id: existing.id },
        include: {
          beds: {
            orderBy: { createdAt: "asc" },
          },
          listing: {
            select: { id: true, name: true, locality: true },
          },
        },
      });
    });

    return res.json({ room });
  }
);

// DELETE /api/v1/rooms/:id
export const deleteRoom = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = (req as AuthenticatedRequest).userId!;
    const id = z.string().min(1).parse(req.params.id);

    const room = await prisma.room.findFirst({
      where: {
        id,
        listing: { ownerId },
      },
      include: {
        beds: {
          select: { id: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found.",
      });
    }

    if (room.beds.length > 0) {
      return res.status(409).json({
        message: "Delete the room's beds before deleting the room.",
      });
    }

    await prisma.room.delete({
      where: { id: room.id },
    });

    return res.json({
      message: "Room deleted successfully.",
    });
  }
);
