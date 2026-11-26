
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
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


// --------------------------------------------------
// SAVED PG / FAVORITES
// --------------------------------------------------

async function validateCandidate(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || user.role !== "CANDIDATE") {
    return false;
  }

  return true;
}

// GET /api/v1/profile/favorites
export const getMyFavorites = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    if (!(await validateCandidate(userId))) {
      return res.status(403).json({
        message: "Only active candidates can access saved PGs.",
      });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        listing: {
          status: "PUBLISHED",
        },
      },
      include: {
        listing: {
          include: {
            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },
            amenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Saved PGs fetched successfully.",
      favorites,
    });
  }
);

// POST /api/v1/profile/favorites/:listingId
export const saveFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    if (!(await validateCandidate(userId))) {
      return res.status(403).json({
        message: "Only active candidates can save PGs.",
      });
    }

    const listingId = z.string().min(1).parse(req.params.listingId);

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      return res.status(404).json({
        message: "Published PG not found.",
      });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      create: {
        userId,
        listingId,
      },
      update: {},
      include: {
        listing: true,
      },
    });

    return res.status(200).json({
      message: "PG saved successfully.",
      isSaved: true,
      favorite,
    });
  }
);

// DELETE /api/v1/profile/favorites/:listingId
export const removeFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    if (!(await validateCandidate(userId))) {
      return res.status(403).json({
        message: "Only active candidates can remove saved PGs.",
      });
    }

    const listingId = z.string().min(1).parse(req.params.listingId);

    await prisma.favorite.deleteMany({
      where: {
        userId,
        listingId,
      },
    });

    return res.status(200).json({
      message: "PG removed from saved listings.",
      isSaved: false,
    });
  }
);
