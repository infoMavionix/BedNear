
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import listingRoutes from "./routes/listing.routes";
import roomRoutes from "./routes/room.routes";
import bedRoutes from "./routes/bed.routes";
import enquiryRoutes from "./routes/enquiry.routes";
import dashboardRoutes from "./routes/dashboard.routes";

import prisma from "./config/prisma";
import { asyncHandler } from "./utils/async-handler";

const app = express();
const PORT = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in the environment.");
}

app.use(
  cors({
    origin: (
      process.env.CLIENT_ORIGIN || "http://localhost:5173"
    )
      .split(",")
      .map((origin) => origin.trim()),
  })
);

app.use(express.json({ limit: "1mb" }));

// Modular API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/beds", bedRoutes);
app.use("/api/v1/enquiries", enquiryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    service: "BedNear API",
  });
});

// Public published PG listings
app.get(
  "/api/v1/public/listings",
  asyncHandler(async (req: Request, res: Response) => {
    const city =
      typeof req.query.city === "string"
        ? req.query.city.trim()
        : undefined;

    const locality =
      typeof req.query.locality === "string"
        ? req.query.locality.trim()
        : undefined;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const listings = await prisma.listing.findMany({
      where: {
        status: "PUBLISHED",
        ...(city
          ? { city: { contains: city, mode: "insensitive" as const } }
          : {}),
        ...(locality
          ? {
              locality: {
                contains: locality,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                {
                  locality: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        rooms: {
          include: {
            beds: {
              where: { status: "AVAILABLE" },
            },
          },
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ listings });
  })
);

// Public details for a single published PG

app.get(
  "/api/v1/public/listings/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const listingId = req.params.id;

    if (typeof listingId !== "string" || !listingId.trim()) {
      return res.status(400).json({
        message: "Invalid listing ID.",
      });
    }

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        status: "PUBLISHED",
      },
      include: {
        rooms: {
          include: {
            beds: {
              where: { status: "AVAILABLE" },
            },
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({
        message: "PG not found.",
      });
    }

    return res.json({ listing });
  })
);

// Unknown endpoints
app.use((_req: Request, res: Response) => {
  return res.status(404).json({
    message: "API endpoint not found.",
  });
});

// Centralized error handling
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed.",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "A record with these details already exists.",
        });
      }

      if (error.code === "P2003") {
        return res.status(400).json({
          message: "Related record does not exist.",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
);

app.listen(PORT, () => {
  console.log(`BedNear API running at http://localhost:${PORT}`);
});
