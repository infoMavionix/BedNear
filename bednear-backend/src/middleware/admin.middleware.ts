
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "./auth.middleware";

const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    if (!userId) {
      res.status(401).json({ message: "Please log in again." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    if (user.role !== "ADMIN") {
      res.status(403).json({
        message: "Admin permission is required.",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default adminMiddleware;
