
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Please log in again." });
    return;
  }

  const token = authorization.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured.");
    res.status(500).json({ message: "Server authentication is not configured." });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;

    // Support both the existing token's userId claim and the standard sub claim.
    const userId =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.userId === "string"
          ? payload.userId
          : undefined;

    if (!userId) {
      res.status(401).json({ message: "Invalid authentication token." });
      return;
    }

    (req as AuthenticatedRequest).userId = userId;
    next();
  } catch {
    res.status(401).json({ message: "Please log in again." });
  }
};

export default authMiddleware;
