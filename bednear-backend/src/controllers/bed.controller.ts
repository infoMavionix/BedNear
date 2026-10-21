
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const bedInput = z.object({
  bedNumber: z.string().trim().min(1),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]).optional(),
  monthlyRent: z.coerce.number().int().nonnegative().nullable().optional(),
  roomId: z.string().min(1),
});

const bedUpdateInput = bedInput.omit({ roomId: true }).partial();

export const getBeds = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;

  const beds = await prisma.bed.findMany({
    where: { room: { listing: { ownerId } } },
    include: {
      room: {
        include: {
          listing: {
            select: { id: true, name: true, locality: true, city: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ beds });
});


export const createBed = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;
  const data = bedInput.parse(req.body);

  const room = await prisma.room.findFirst({
    where: { id: data.roomId, listing: { ownerId } },
    select: {
      id: true,
      capacity: true,
      monthlyRent: true,
    },
  });

  if (!room) {
    return res.status(404).json({
      message: "Room not found.",
    });
  }

  const count = await prisma.bed.count({
    where: { roomId: room.id },
  });

  if (count >= room.capacity) {
    return res.status(409).json({
      message: "Room bed capacity reached.",
    });
  }

  const bed = await prisma.bed.create({
    data: {
      bedNumber: data.bedNumber,
      status: "AVAILABLE",
      monthlyRent: data.monthlyRent ?? room.monthlyRent,
      roomId: room.id,
    },
    include: {
      room: {
        include: {
          listing: {
            select: {
              id: true,
              name: true,
              locality: true,
            },
          },
        },
      },
    },
  });

  return res.status(201).json({ bed });
});

export const updateBed = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;
  const id = z.string().min(1).parse(req.params.id);
  const data = bedUpdateInput.parse(req.body);

  const existing = await prisma.bed.findFirst({
    where: { id, room: { listing: { ownerId } } },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Bed not found." });
  }

  const bed = await prisma.bed.update({
    where: { id },
    data,
    include: {
      room: {
        include: { listing: { select: { id: true, name: true, locality: true } } },
      },
    },
  });

  return res.json({ bed });
});

export const deleteBed = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as AuthenticatedRequest).userId!;
  const id = z.string().min(1).parse(req.params.id);

  const bed = await prisma.bed.findFirst({
    where: { id, room: { listing: { ownerId } } },
    select: { id: true },
  });

  if (!bed) {
    return res.status(404).json({ message: "Bed not found." });
  }

  await prisma.bed.delete({ where: { id } });

  return res.json({ message: "Bed deleted successfully." });
});
