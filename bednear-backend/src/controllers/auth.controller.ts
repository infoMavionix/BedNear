
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(20).optional(),
  businessName: z.string().trim().max(150).optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

function createToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    subject: userId,
    expiresIn: "7d",
  });
}

// POST /api/v1/auth/register
export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
        phone: data.phone || null,
        businessName: data.businessName || null,
        role: "OWNER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        role: true,
      },
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user,
      token: createToken(user.id),
    });
  }
);

// POST /api/v1/auth/login
export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(data.password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    const {
      passwordHash: _passwordHash,
      ...safeUser
    } = user;

    return res.status(200).json({
      message: "Login successful.",
      user: safeUser,
      token: createToken(user.id),
    });
  }
);

// GET /api/v1/auth/me
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
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
    isActive: true,
  },
});

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    return res.status(200).json({ user });
  }
);
