
import { Request } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

type AuthenticatedRequest = Request & {
  userId?: string;
};


const listingInput = z.object({
  name: z.string().trim().min(2),
  category: z.string().default("PG"),
  description: z.string().nullable().optional(),
  address: z.string().trim().min(3),
  locality: z.string().trim().min(2),
  city: z.string().default("Bengaluru"),
  state: z.string().default("Karnataka"),
  pincode: z.string().nullable().optional(),
  genderPolicy: z.string().default("Any"),
  monthlyRent: z.coerce.number().int().nonnegative().nullable().optional(),
  deposit: z.coerce.number().int().nonnegative().nullable().optional(),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
});

// CREATE: Latitude and longitude must be supplied together.
const listingInputWithCoordinates = listingInput.refine(
  (data) => (data.latitude == null) === (data.longitude == null),
  {
    message: "Latitude and longitude must be supplied together.",
    path: ["longitude"],
  }
);

// UPDATE: Make fields optional BEFORE applying coordinate validation.
// If neither coordinate is supplied, ordinary PG updates are allowed.
const listingUpdateSchema = listingInput.partial().refine(
  (data) => {
    const latitudeProvided = data.latitude !== undefined;
    const longitudeProvided = data.longitude !== undefined;

    if (latitudeProvided !== longitudeProvided) {
      return false;
    }

    if (latitudeProvided && longitudeProvided) {
      return (data.latitude == null) === (data.longitude == null);
    }

    return true;
  },
  {
    message: "Latitude and longitude must be supplied together.",
    path: ["longitude"],
  }
);


function getOwnerId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}

// Only expose document metadata to the owner.
// Never return private storage keys.
const ownerDocumentSelect = {
  id: true,
  type: true,
  status: true,
  originalName: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
} as const;

// GET /api/v1/listings
export const getListings = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }

  const listings = await prisma.listing.findMany({
    where: { ownerId },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      amenities: {
        include: {
          amenity: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      verificationDocuments: {
        select: ownerDocumentSelect,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { enquiries: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return res.json({ listings });
});

// Amenity names are stored once in Amenity and linked to PGs through ListingAmenity.
const amenitiesInputSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(40);

function normalizeAmenityNames(value: unknown): string[] {
  const parsed = amenitiesInputSchema.parse(value ?? []);

  return [
    ...new Set(
      parsed
        .map((name) => name.trim())
        .filter(Boolean)
    ),
  ];
}

function amenitySlug(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function saveListingAmenities(
  tx: Prisma.TransactionClient,
  listingId: string,
  names: string[]
) {
  await tx.listingAmenity.deleteMany({ where: { listingId } });

  for (const name of names) {
    const slug = amenitySlug(name);
    if (!slug) continue;

    // Reuse the canonical amenity if it already exists by name.
    const existingByName = await tx.amenity.findUnique({
      where: { name },
      select: { id: true },
    });

    const amenity = existingByName
      ? existingByName
      : await tx.amenity.upsert({
          where: { slug },
          create: { name, slug },
          update: {},
          select: { id: true },
        });

    await tx.listingAmenity.create({
      data: { listingId, amenityId: amenity.id },
    });
  }
}

// POST /api/v1/listings
// New listings always start as DRAFT.
export const createListing = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }

  const data = listingInputWithCoordinates.parse(req.body);
  const amenityNames = normalizeAmenityNames(req.body?.amenities);

  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        ...data,
        ownerId,
        status: "DRAFT",
      },
    });

    await saveListingAmenities(tx, created.id, amenityNames);

    return tx.listing.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        amenities: {
          include: {
            amenity: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  });

  return res.status(201).json({ listing });
});

// GET /api/v1/listings/:id
export const getListingById = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }

  const id = z.string().min(1).parse(req.params.id);

  const listing = await prisma.listing.findFirst({
    where: {
      id,
      ownerId,
    },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      enquiries: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      verificationDocuments: {
        select: ownerDocumentSelect,
        orderBy: { createdAt: "desc" },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
    },
  });

  if (!listing) {
    return res.status(404).json({
      message: "PG listing not found.",
    });
  }

  return res.json({ listing });
});

// PATCH /api/v1/listings/:id
// Owners can update listing details but cannot change status.
export const updateListing = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }

  const id = z.string().min(1).parse(req.params.id);
  const data = listingUpdateSchema.parse(req.body);
  const amenitiesProvided = Object.prototype.hasOwnProperty.call(req.body ?? {}, "amenities");
  const amenityNames = amenitiesProvided
    ? normalizeAmenityNames(req.body.amenities)
    : undefined;

  const existing = await prisma.listing.findFirst({
    where: {
      id,
      ownerId,
    },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({
      message: "PG listing not found.",
    });
  }

  const listing = await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id: existing.id },
      data: data as Prisma.ListingUpdateInput,
    });

    if (amenityNames !== undefined) {
      await saveListingAmenities(tx, existing.id, amenityNames);
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: existing.id },
      include: {
        amenities: {
          include: {
            amenity: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  });

  return res.json({ listing });
});

// PATCH /api/v1/listings/:id/submit
// Submit a draft PG for admin review.
export const submitListingForReview = asyncHandler(
  async (req, res) => {
    const ownerId = getOwnerId(req);

    if (!ownerId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const id = z.string().min(1).parse(req.params.id);

    const existing = await prisma.listing.findFirst({
      where: {
        id,
        ownerId,
      },
      select: {
        id: true,
        status: true,
        name: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "PG listing not found.",
      });
    }

    if (existing.status !== "DRAFT") {
      return res.status(400).json({
        message: "Only draft listings can be submitted for review.",
      });
    }

    // Fetch documents newest first. A rejected latest document
    // must be replaced before the owner can resubmit.
    const documents = await prisma.verificationDocument.findMany({
      where: {
        listingId: existing.id,
        ownerId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        type: true,
        status: true,
      },
    });

    const latestByType = new Map<string, string>();

    for (const document of documents) {
      if (!latestByType.has(document.type)) {
        latestByType.set(document.type, document.status);
      }
    }

    const identityStatus = latestByType.get("OWNER_IDENTITY");

    const hasIdentityDocument =
      identityStatus !== undefined && identityStatus !== "REJECTED";

    const hasPropertyDocument =
      ["PROPERTY_OWNERSHIP", "AUTHORIZATION_LETTER"].some(
        (type) => {
          const status = latestByType.get(type);
          return status !== undefined && status !== "REJECTED";
        }
      );

    if (!hasIdentityDocument) {
      return res.status(400).json({
        message:
          "Upload a valid owner identity document before submitting this PG.",
      });
    }

    if (!hasPropertyDocument) {
      return res.status(400).json({
        message:
          "Upload a property ownership document or authorization letter before submitting this PG.",
      });
    }

    // At least one property photo is required.
    const photoCount = await prisma.listingImage.count({
      where: { listingId: existing.id },
    });

    if (photoCount === 0) {
      return res.status(400).json({
        message:
          "Upload at least one PG property photo before submitting.",
      });
    }

    const listing = await prisma.listing.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    return res.json({
      message: "PG submitted for admin review.",
      listing,
    });
  }
);

// DELETE /api/v1/listings/:id
export const deleteListing = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }

  const id = z.string().min(1).parse(req.params.id);

  const existing = await prisma.listing.findFirst({
    where: { id, ownerId },
    select: { id: true, name: true },
  });

  if (!existing) {
    return res.status(404).json({
      message: "PG listing not found.",
    });
  }

  await prisma.$transaction(async (tx) => {
    const rooms = await tx.room.findMany({
      where: { listingId: existing.id },
      select: { id: true },
    });

    const roomIds = rooms.map((room) => room.id);

    if (roomIds.length > 0) {
      await tx.bed.deleteMany({
        where: { roomId: { in: roomIds } },
      });
    }

    await tx.room.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.favorite.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.listingAmenity.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.listingImage.deleteMany({
      where: { listingId: existing.id },
    });

    await tx.enquiry.deleteMany({
      where: { listingId: existing.id },
    });

    // Verification documents are deleted automatically through
    // the Listing relation's onDelete: Cascade.
    await tx.listing.delete({
      where: { id: existing.id },
    });
  });

  return res.json({
    message: `PG "${existing.name}" deleted successfully.`,
    id: existing.id,
  });
});
