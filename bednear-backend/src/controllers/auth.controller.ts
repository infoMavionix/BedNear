
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs from "fs/promises";

import {
  OwnerVerificationStatus,
  VerificationDocumentType,
} from "@prisma/client";

import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(10).max(20),
  businessName: z.string().trim().min(2).max(150),
  ownerType: z.enum(["Individual Owner", "Company"]),
  address: z.string().trim().min(5).max(300),
  locality: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
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

type RegistrationFiles = {
  ownerIdentity?: Express.Multer.File[];
  pgLicense?: Express.Multer.File[];
};

function getUploadedFiles(req: Request): Express.Multer.File[] {
  const files = req.files as RegistrationFiles | undefined;

  return [
    ...(files?.ownerIdentity ?? []),
    ...(files?.pgLicense ?? []),
  ];
}

async function removeUploadedFiles(files: Express.Multer.File[]) {
  await Promise.all(
    files.map((file) =>
      fs.unlink(file.path).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          console.error("Could not remove uploaded file:", error);
        }
      })
    )
  );
}

function getVerificationMessage(status: OwnerVerificationStatus): string {
  switch (status) {
    case OwnerVerificationStatus.PENDING_REVIEW:
      return "Your account is still under verification. You can access the owner dashboard after admin approval.";

    case OwnerVerificationStatus.UNDER_REVIEW:
      return "Your documents are currently being reviewed by our admin team.";

    case OwnerVerificationStatus.REJECTED:
      return "Your owner verification was rejected. Please contact BedNear support.";

    case OwnerVerificationStatus.RESUBMISSION_REQUIRED:
      return "Your documents require correction. Please contact BedNear support for resubmission instructions.";

    case OwnerVerificationStatus.APPROVED:
      return "Your account is approved.";

    default:
      return "Your account verification is pending.";
  }
}

// POST /api/v1/auth/register
export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const uploadedFiles = getUploadedFiles(req);

    try {
      const parsed = registerSchema.safeParse(req.body);

      if (!parsed.success) {
        await removeUploadedFiles(uploadedFiles);

        return res.status(400).json({
          message: parsed.error.issues[0]?.message ?? "Invalid registration details.",
          errors: parsed.error.flatten(),
        });
      }

      const data = parsed.data;

      const ownerIdentity = (
        req.files as RegistrationFiles | undefined
      )?.ownerIdentity?.[0];

      const pgLicense = (
        req.files as RegistrationFiles | undefined
      )?.pgLicense?.[0];

      if (!ownerIdentity || !pgLicense) {
        await removeUploadedFiles(uploadedFiles);

        return res.status(400).json({
          message:
            "Owner identity proof and PG licence document are required.",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (existingUser) {
        await removeUploadedFiles(uploadedFiles);

        return res.status(409).json({
          message: "Email already registered.",
        });
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            passwordHash,
            phone: data.phone,
            businessName: data.businessName,
            role: "OWNER",
            isActive: true,
            isVerified: false,
            verificationStatus:
              OwnerVerificationStatus.PENDING_REVIEW,

            ownerProfile: {
              create: {
                ownerType: data.ownerType,
                address: data.address,
                locality: data.locality,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
              },
            },

            verificationDocuments: {
              create: [
                {
                  type: VerificationDocumentType.OWNER_IDENTITY,
                  originalName: ownerIdentity.originalname,
                  storageKey: ownerIdentity.filename,
                  mimeType: ownerIdentity.mimetype,
                  fileSize: ownerIdentity.size,
                },
                {
                  type: VerificationDocumentType.PG_LICENSE,
                  originalName: pgLicense.originalname,
                  storageKey: pgLicense.filename,
                  mimeType: pgLicense.mimetype,
                  fileSize: pgLicense.size,
                },
              ],
            },
          },

          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessName: true,
            role: true,
            verificationStatus: true,
            isVerified: true,
            ownerProfile: true,
          },
        });
      });

      return res.status(201).json({
        message:
          "Registration submitted successfully. Your account is pending admin verification.",
        user,
      });
    } catch (error) {
      await removeUploadedFiles(uploadedFiles);
      throw error;
    }
  }
);

// POST /api/v1/auth/login
export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Please enter a valid email address and password.",
      });
    }

    const data = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (
      !user ||
      !(await bcrypt.compare(data.password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        code: "ACCOUNT_INACTIVE",
        message: "Your account is inactive. Please contact support.",
      });
    }

    // Only approved owners may log in to the owner dashboard.
    if (
      user.role === "OWNER" &&
      user.verificationStatus !== OwnerVerificationStatus.APPROVED
    ) {
      return res.status(403).json({
        code: "OWNER_VERIFICATION_REQUIRED",
        verificationStatus: user.verificationStatus,
        message: getVerificationMessage(user.verificationStatus),
      });
    }

    if (
      user.role === "OWNER" &&
      !user.isVerified
    ) {
      return res.status(403).json({
        code: "OWNER_VERIFICATION_REQUIRED",
        verificationStatus: user.verificationStatus,
        message: "Your owner account has not completed verification.",
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
        isVerified: true,
        verificationStatus: true,

        ownerProfile: {
          select: {
            id: true,
            ownerType: true,
            address: true,
            locality: true,
            city: true,
            state: true,
            pincode: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        verificationDocuments: {
          select: {
            id: true,
            type: true,
            status: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            reviewNote: true,
            reviewedAt: true,
            createdAt: true,
          },
        },
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

    return res.status(200).json({
      user,
      verificationMessage:
        user.role === "OWNER"
          ? getVerificationMessage(user.verificationStatus)
          : null,
    });
  }
);
