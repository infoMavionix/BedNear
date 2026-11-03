import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const listUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  role: z.enum(["ALL", "OWNER", "CANDIDATE"]).optional().default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid user search or pagination parameters.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const { search, role, status, page, limit } = parsed.data;

    const where = {
      role:
        role === "ALL"
          ? { in: ["OWNER", "CANDIDATE"] as ("OWNER" | "CANDIDATE")[] }
          : role,
      ...(status === "ALL"
        ? {}
        : { isActive: status === "ACTIVE" }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              {
                businessName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessName: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              listings: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.status(200).json({
      message: "Users retrieved successfully.",
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;

    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({ message: "A valid user ID is required." });
      return;
    }

    const parsed = updateUserStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Please provide a valid account status.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: ["OWNER", "CANDIDATE"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      res.status(404).json({
        message: "Owner or candidate account not found.",
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { isActive: parsed.data.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const authenticatedUserId = (req as AuthenticatedRequest).userId;

    res.status(200).json({
      message: parsed.data.isActive
        ? "Account activated successfully."
        : "Account deactivated successfully.",
      user: updatedUser,
      changedByCurrentUser: authenticatedUserId === updatedUser.id,
    });
  } catch (error) {
    next(error);
  }
};