
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import fs from "fs";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import listingRoutes from "./routes/listing.routes";
import roomRoutes from "./routes/room.routes";
import bedRoutes from "./routes/bed.routes";
import enquiryRoutes from "./routes/enquiry.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";
import authMiddleware, {
  requireApprovedOwner,
} from "./middleware/auth.middleware";

import { prisma } from "./config/prisma";
import { asyncHandler } from "./utils/async-handler";
import { getStoredFilePath } from "./config/storage";
import subscriptionRoutes from "./routes/subscription.routes";

const app = express();
const PORT = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured in the environment.");
}

// --------------------------------------------------
// Middleware
// --------------------------------------------------

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

// --------------------------------------------------
// Modular API routes
// --------------------------------------------------

 app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);

app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/beds", bedRoutes);

app.use("/api/v1/enquiries", enquiryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/health", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    service: "BedNear API",
  });
});

// --------------------------------------------------
// Public listing response mapper
// --------------------------------------------------

function mapPublicListing(listing: any, req: Request) {
  const photos = (listing.images ?? []).map((image: any) => ({
    id: image.id,
    altText: image.altText,
    isCover: image.isCover,
    url: `${req.protocol}://${req.get("host")}/api/v1/public/listings/${listing.id}/images/${image.id}/file`,
  }));

  const amenities = (listing.amenities ?? [])
    .map((item: any) => item.amenity?.name)
    .filter((name: any): name is string => typeof name === "string" && name.trim().length > 0);

  const { images, ...listingData } = listing;

  return {
    ...listingData,
    photos,
    amenities,
    image: photos.find((photo: any) => photo.isCover)?.url ?? photos[0]?.url ?? null,
  };
}

// --------------------------------------------------
// Public published PG listings
// --------------------------------------------------

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
          ? {
              city: {
                contains: city,
                mode: "insensitive",
              },
            }
          : {}),

        ...(locality
          ? {
              locality: {
                contains: locality,
                mode: "insensitive",
              },
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  locality: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  address: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        // Rooms and available beds
        rooms: {
          include: {
            beds: {
              where: {
                status: "AVAILABLE",
              },
              select: {
                id: true,
                bedNumber: true,
                status: true,
                monthlyRent: true,
              },
            },
          },
        },

        // Public PG photos only
        images: {
          select: {
            id: true,
            altText: true,
            sortOrder: true,
            isCover: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        // PG amenities
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,
    });

    const result = listings.map((listing) =>
      mapPublicListing(listing, req)
    );

    return res.json({
      listings: result,
    });
  })
);

// --------------------------------------------------
// Public PG photo retrieval
// Only photos belonging to published PGs are allowed.
// Verification documents are NOT exposed here.
// --------------------------------------------------

app.get(
  "/api/v1/public/listings/:id/images/:imageId/file",
  asyncHandler(async (req: Request, res: Response) => {
    const listingId = req.params.id;
    const imageId = req.params.imageId;

    if (
      typeof listingId !== "string" ||
      !listingId.trim() ||
      typeof imageId !== "string" ||
      !imageId.trim()
    ) {
      return res.status(400).json({
        message: "Invalid listing or image ID.",
      });
    }

    const image = await prisma.listingImage.findFirst({
      where: {
        id: imageId,
        listingId,
        listing: {
          status: "PUBLISHED",
        },
      },
      select: {
        storageKey: true,
        mimeType: true,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "Property photo not found.",
      });
    }

    const filePath = getStoredFilePath(image.storageKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Property photo file not found.",
      });
    }

    res.setHeader(
      "Content-Type",
      image.mimeType ?? "application/octet-stream"
    );

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.sendFile(filePath);
  })
);

// --------------------------------------------------
// Public details for a single published PG
// --------------------------------------------------

app.get(
  "/api/v1/public/listings/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const listingId = req.params.id;

    if (
      typeof listingId !== "string" ||
      !listingId.trim()
    ) {
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
              where: {
                status: "AVAILABLE",
              },
              select: {
                id: true,
                bedNumber: true,
                status: true,
                monthlyRent: true,
              },
            },
          },
        },

        images: {
          select: {
            id: true,
            altText: true,
            sortOrder: true,
            isCover: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
              },
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

    return res.json({
      listing: mapPublicListing(listing, req),
    });
  })
);

// --------------------------------------------------
// Protected owner contact details
// Candidate login is required.
// --------------------------------------------------

app.get(
  "/api/v1/public/listings/:id/contact",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as Request & { userId?: string }).userId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to contact the PG owner.",
      });
    }

    // Verify that the logged-in user is an active candidate.
    const candidate = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "CANDIDATE",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!candidate) {
      return res.status(403).json({
        message: "Only active candidate accounts can contact PG owners.",
      });
    }

    const listingId = req.params.id;

    if (typeof listingId !== "string" || !listingId.trim()) {
      return res.status(400).json({
        message: "Invalid PG listing ID.",
      });
    }

    // Retrieve contact details only for a published PG.
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        owner: {
          select: {
            name: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({
        message: "Published PG listing not found.",
      });
    }

    if (
      listing.owner.role !== "OWNER" ||
      !listing.owner.isActive
    ) {
      return res.status(404).json({
        message: "Owner contact details are unavailable.",
      });
    }

    if (!listing.owner.phone?.trim()) {
      return res.status(404).json({
        message: "The PG owner has not added a phone number yet.",
      });
    }

    return res.json({
      contact: {
        ownerName: listing.owner.name,
        phone: listing.owner.phone,
      },
    });
  })
);

// --------------------------------------------------
// Route matrix validation schema
// --------------------------------------------------

const routeMatrixInput = z.object({
  origin: z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  }),

  mode: z.enum(["DRIVE", "WALK"]),

  destinations: z
    .array(
      z.object({
        id: z.string().min(1),
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      })
    )
    .min(1)
    .max(25),
});

// --------------------------------------------------
// Public driving/walking route matrix
// --------------------------------------------------

app.post(
  "/api/v1/public/route-matrix",
  asyncHandler(async (req: Request, res: Response) => {
    const input = routeMatrixInput.parse(req.body);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        message: "Route service is not configured.",
      });
    }

    const googleResponse = await fetch(
      "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "originIndex,destinationIndex,status,condition,distanceMeters,duration",
        },

        body: JSON.stringify({
          origins: [
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: input.origin.latitude,
                    longitude: input.origin.longitude,
                  },
                },
              },
            },
          ],

          destinations: input.destinations.map((destination) => ({
            waypoint: {
              location: {
                latLng: {
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                },
              },
            },
          })),

          travelMode: input.mode,

          ...(input.mode === "DRIVE"
            ? {
                routingPreference: "TRAFFIC_AWARE",
              }
            : {}),
        }),
      }
    );

    if (!googleResponse.ok) {
      const details = await googleResponse.text();

      console.error("Google route matrix failed:", details);

      return res.status(502).json({
        message: "Unable to calculate routes right now.",
      });
    }

    const rawResult: unknown = await googleResponse.json();

    const elements: unknown[] = Array.isArray(rawResult)
      ? rawResult
      : [];

    const routes = input.destinations.map((destination, index) => {
      const element = elements.find(
        (item): item is {
          destinationIndex?: number;
          condition?: string;
          status?: {
            code?: number;
          };
          distanceMeters?: number;
          duration?: string;
        } =>
          typeof item === "object" &&
          item !== null &&
          "destinationIndex" in item &&
          (item as {
            destinationIndex?: number;
          }).destinationIndex === index
      );

      const seconds = element?.duration
        ? Number.parseFloat(
            element.duration.replace(/s$/, "")
          )
        : NaN;

      const routeExists =
        element?.condition === "ROUTE_EXISTS" &&
        (element.status?.code ?? 0) === 0 &&
        Number.isFinite(element.distanceMeters) &&
        Number.isFinite(seconds);

      return {
        id: destination.id,
        available: Boolean(routeExists),

        ...(routeExists
          ? {
              distanceMeters: element!.distanceMeters,
              durationSeconds: seconds,
            }
          : {}),
      };
    });

    return res.json({
      mode: input.mode,
      routes,
    });
  })
);

// --------------------------------------------------
// Unknown endpoints
// --------------------------------------------------

app.use((_req: Request, res: Response) => {
  return res.status(404).json({
    message: "API endpoint not found.",
  });
});

// --------------------------------------------------
// Centralized error handling
// --------------------------------------------------

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

     // 2. Handle custom application errors
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    if (statusCode !== null) {
      return res.status(statusCode).json({
        message:
          error instanceof Error
            ? error.message
            : "Request failed.",
      });
    }


    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
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

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `BedNear API running at http://localhost:${PORT}`
  );
});
