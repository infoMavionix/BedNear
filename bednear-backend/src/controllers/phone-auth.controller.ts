
import { Request, Response } from "express";
import {
  randomInt,
  createHmac,
  timingSafeEqual,
} from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { deliverOtp } from "../services/otp-delivery.service";

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^\+91[6-9]\d{9}$/,
      "Enter a valid Indian mobile number."
    ),
});

const verifySchema = phoneSchema.extend({
  otp: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit OTP."),
});

// --------------------------------------------------
// OTP SECURITY HELPERS
// --------------------------------------------------

function getOtpSecret(): string {
  const secret = process.env.OTP_HASH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "OTP_HASH_SECRET must contain at least 32 characters."
    );
  }

  return secret;
}

function hashOtp(phone: string, code: string): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${phone}:${code}`)
    .digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  if (
    !/^[a-f0-9]{64}$/i.test(a) ||
    !/^[a-f0-9]{64}$/i.test(b)
  ) {
    return false;
  }

  const first = Buffer.from(a, "hex");
  const second = Buffer.from(b, "hex");

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

// --------------------------------------------------
// JWT TOKEN
// --------------------------------------------------

function createAccessToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }

  return jwt.sign({}, secret, {
    subject: userId,
    expiresIn: "7d",
  });
}

// --------------------------------------------------
// SEND OTP
// POST /api/v1/auth/send-otp
// --------------------------------------------------

export const sendPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone } = phoneSchema.parse(req.body);

    // Check existing account.
    const existingUser = await prisma.user.findFirst({
      where: { phone },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (existingUser && existingUser.role !== "CANDIDATE") {
      return res.status(409).json({
        message:
          "This number is associated with a non-candidate account. Please use the appropriate login.",
      });
    }

    if (existingUser && !existingUser.isActive) {
      return res.status(403).json({
        message: "This account is inactive.",
      });
    }

    const now = new Date();

    // Maximum five OTP requests per hour.
    const recentChallenges =
      await prisma.phoneOtpChallenge.count({
        where: {
          phone,
          createdAt: {
            gte: new Date(
              now.getTime() - 60 * 60 * 1000
            ),
          },
        },
      });

    if (recentChallenges >= 5) {
      return res.status(429).json({
        message: "Too many OTP requests. Try again later.",
      });
    }

    // 60-second resend cooldown.
    const recentRequest =
      await prisma.phoneOtpChallenge.findFirst({
        where: {
          phone,
          createdAt: {
            gte: new Date(
              now.getTime() - 60 * 1000
            ),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (recentRequest) {
      return res.status(429).json({
        message:
          "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const code = String(randomInt(100000, 1000000));

    const expiresAt = new Date(
      now.getTime() + 5 * 60 * 1000
    );

    const codeHash = hashOtp(phone, code);

    // Invalidate old challenges and create a new one.
    await prisma.$transaction([
      prisma.phoneOtpChallenge.updateMany({
        where: {
          phone,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      }),

      prisma.phoneOtpChallenge.create({
        data: {
          phone,
          codeHash,
          expiresAt,
        },
      }),
    ]);

    try {
      await deliverOtp(phone, code);
    } catch (error) {
      // Invalidate the challenge if delivery fails.
      await prisma.phoneOtpChallenge.updateMany({
        where: {
          phone,
          codeHash,
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      throw error;
    }

    return res.status(200).json({
      message: "OTP requested successfully.",
      expiresInSeconds: 300,
    });
  }
);

// --------------------------------------------------
// VERIFY OTP
// POST /api/v1/auth/verify-otp
// --------------------------------------------------

export const verifyPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp } = verifySchema.parse(req.body);

    const challenge =
      await prisma.phoneOtpChallenge.findFirst({
        where: {
          phone,
          consumedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (
      !challenge ||
      challenge.expiresAt <= new Date()
    ) {
      return res.status(400).json({
        message:
          "OTP has expired or was not requested. Request a new OTP.",
      });
    }

    if (challenge.attempts >= 5) {
      return res.status(429).json({
        message:
          "Too many incorrect attempts. Request a new OTP.",
      });
    }

    // Compare the stored OTP hash.
    const matches = safeCompare(
      challenge.codeHash,
      hashOtp(phone, otp)
    );

    if (!matches) {
      await prisma.phoneOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          attempts: {
            lt: 5,
          },
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
      });
    }

    // Consume the OTP once.
    const consumed =
      await prisma.phoneOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          attempts: {
            lt: 5,
          },
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          consumedAt: new Date(),
        },
      });

    if (consumed.count !== 1) {
      return res.status(400).json({
        message:
          "OTP is no longer valid. Request a new OTP.",
      });
    }

    // Find existing candidate.
    let user = await prisma.user.findFirst({
      where: { phone },
    });

    if (user && user.role !== "CANDIDATE") {
      return res.status(409).json({
        message:
          "This number is not registered as a candidate.",
      });
    }

    if (user && !user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    // Automatically register a new candidate.
    if (!user) {
      const digits = phone.replace(/\D/g, "");

      user = await prisma.user.create({
        data: {
          name: "BedNear Candidate",
          email: `candidate+${digits}@phone.bednear.invalid`,
          phone,
          passwordHash: "PHONE_OTP_ACCOUNT",
          role: "CANDIDATE",
          isVerified: true,
        },
      });
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isVerified: true,
        },
      });
    }

    const accessToken = createAccessToken(user.id);

    return res.status(200).json({
      message: "Mobile number verified successfully.",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  }
);
