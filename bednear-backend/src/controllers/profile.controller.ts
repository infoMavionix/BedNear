import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

function getUserId(req: Request) {
  return (req as AuthenticatedRequest).userId;
}

// GET /api/v1/profile
export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Profile not found." });
    }

    return res.json({ user });
  }
);

// PATCH /api/v1/profile
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const data = z
      .object({
        name: z.string().trim().min(2).optional(),
        phone: z.string().trim().nullable().optional(),
        businessName: z.string().trim().nullable().optional(),
      })
      .refine((value) => Object.keys(value).length > 0, {
        message: "Provide at least one field to update.",
      })
      .parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        role: true,
      },
    });

    return res.json({
      message: "Profile updated successfully.",
      user,
    });
  }
);

// PATCH /api/v1/profile/password
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const data = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
      .parse(req.body);

    if (data.currentPassword === data.newPassword) {
      return res.status(400).json({
        message: "New password must differ from the current password.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      !user ||
      !(await bcrypt.compare(data.currentPassword, user.passwordHash))
    ) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(data.newPassword, 12),
      },
    });

    return res.json({ message: "Password updated successfully." });
  }
);