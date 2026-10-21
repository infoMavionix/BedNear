
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

function getUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  businessName: true,
  role: true,
  createdAt: true,
} as const;

// GET /api/v1/profile
export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    return res.status(200).json({ user });
  }
);

// PATCH /api/v1/profile
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const schema = z
      .object({
        name: z.string().trim().min(2).max(100).optional(),
        phone: z.string().trim().max(20).nullable().optional(),
        businessName: z
          .string()
          .trim()
          .max(150)
          .nullable()
          .optional(),
      })
      .strict()
      .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        { message: "Provide at least one field to update." }
      );

    const data = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelect,
    });

    return res.status(200).json({
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
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const data = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
      })
      .strict()
      .parse(req.body);

    if (data.currentPassword === data.newPassword) {
      return res.status(400).json({
        message: "New password must differ from the current password.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  }
);
