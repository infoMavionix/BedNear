
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// --------------------------------------------------
// JWT AUTHENTICATION
// --------------------------------------------------

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Please log in again.",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      message: "Invalid authentication token.",
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured.");

    res.status(500).json({
      message: "Server authentication is not configured.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;

    const userId =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.userId === "string"
          ? payload.userId
          : undefined;

    if (!userId) {
      res.status(401).json({
        message: "Invalid authentication token.",
      });
      return;
    }

    (req as AuthenticatedRequest).userId = userId;

    next();
  } catch {
    res.status(401).json({
      message: "Please log in again.",
    });
  }
};

// --------------------------------------------------
// APPROVED OWNER VERIFICATION MIDDLEWARE
// --------------------------------------------------

export const requireApprovedOwner: AuthenticatedHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Please log in again.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
        isVerified: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "User account not found.",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: "Your account is inactive. Please contact support.",
      });
      return;
    }

    // Only OWNER accounts can access owner APIs.
    if (user.role !== "OWNER") {
      res.status(403).json({
        message: "You are not authorized to access owner resources.",
      });
      return;
    }

    // Block pending owners.
    if (user.verificationStatus === "PENDING_REVIEW") {
      res.status(403).json({
        code: "OWNER_VERIFICATION_PENDING",
        verificationStatus: user.verificationStatus,
        message:
          "Your account is still under verification. You can access the owner dashboard after admin approval.",
      });
      return;
    }

    // Block rejected owners.
    if (user.verificationStatus === "REJECTED") {
      res.status(403).json({
        code: "OWNER_VERIFICATION_REJECTED",
        verificationStatus: user.verificationStatus,
        message:
          "Your verification documents were rejected. Please contact BedNear support.",
      });
      return;
    }

    // Require both approval indicators.
    if (
      user.verificationStatus !== "APPROVED" ||
      user.isVerified !== true
    ) {
      res.status(403).json({
        code: "OWNER_NOT_VERIFIED",
        verificationStatus: user.verificationStatus,
        message:
          "Your owner account has not been approved yet.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("[Owner Verification Middleware]", error);

    res.status(500).json({
      message: "Unable to verify owner account.",
    });
  }
};

export default authMiddleware;
