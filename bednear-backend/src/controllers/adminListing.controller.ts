
import { z } from "zod";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

// GET /api/v1/admin/listings/pending
export const getPendingListings = asyncHandler(async (_req, res) => {
  const listings = await prisma.listing.findMany({
    where: {
      status: "PENDING",
    },

    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessName: true,
          isActive: true,
          isVerified: true,
          verificationStatus: true,
        },
      },

      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      rooms: {
        include: {
          beds: true,
        },
      },

      amenities: {
        include: {
          amenity: true,
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

        orderBy: {
          createdAt: "desc",
        },
      },
    },

    orderBy: {
      submittedAt: "asc",
    },
  });

  return res.json({
    listings,
  });
});

// PATCH /api/v1/admin/listings/:id/approve
export const approveListing = asyncHandler(async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);

  const existing = await prisma.listing.findFirst({
    where: {
      id,
      status: "PENDING",
    },

    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,

      owner: {
        select: {
          id: true,
          name: true,
          isActive: true,
          isVerified: true,
          verificationStatus: true,
        },
      },

      _count: {
        select: {
          images: true,
        },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({
      message: "Pending PG listing not found.",
    });
  }

  // ------------------------------------------
  // STEP 1: VERIFY OWNER ACCOUNT
  // ------------------------------------------

  if (!existing.owner.isActive) {
    return res.status(400).json({
      code: "OWNER_ACCOUNT_INACTIVE",
      message:
        "This PG cannot be published because the owner account is inactive.",
    });
  }

  if (
    existing.owner.verificationStatus !== "APPROVED" ||
    existing.owner.isVerified !== true
  ) {
    return res.status(400).json({
      code: "OWNER_NOT_VERIFIED",
      verificationStatus: existing.owner.verificationStatus,
      message:
        "The owner registration must be approved before publishing this PG.",
    });
  }

  // ------------------------------------------
  // STEP 2: VERIFY LATEST LISTING DOCUMENTS
  // ------------------------------------------

  const documents = await prisma.verificationDocument.findMany({
    where: {
      listingId: id,
    },

    select: {
      type: true,
      status: true,
      createdAt: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  // Latest document of each type is considered
  // its current version.
  const latestByType = new Map<string, string>();

  for (const document of documents) {
    if (!latestByType.has(document.type)) {
      latestByType.set(document.type, document.status);
    }
  }

  if (latestByType.get("OWNER_IDENTITY") !== "VERIFIED") {
    return res.status(400).json({
      code: "LISTING_OWNER_IDENTITY_NOT_VERIFIED",
      message:
        "Owner identity document attached to this PG listing must be verified before publishing.",
    });
  }

  const propertyDocumentVerified = [
    "PROPERTY_OWNERSHIP",
    "AUTHORIZATION_LETTER",
  ].some(
    (type) => latestByType.get(type) === "VERIFIED"
  );

  if (!propertyDocumentVerified) {
    return res.status(400).json({
      code: "PROPERTY_DOCUMENT_NOT_VERIFIED",
      message:
        "Verify at least one property ownership document or authorization letter before publishing this PG.",
    });
  }

  // ------------------------------------------
  // STEP 3: CHECK PROPERTY PHOTOS
  // ------------------------------------------

  if (existing._count.images === 0) {
    return res.status(400).json({
      message:
        "Upload at least one PG property photo before publishing.",
    });
  }

  // ------------------------------------------
  // STEP 4: CHECK MAP COORDINATES
  // ------------------------------------------

  if (
    existing.latitude == null ||
    existing.longitude == null
  ) {
    return res.status(400).json({
      message:
        "PG map coordinates are required before publishing.",
    });
  }

  // ------------------------------------------
  // STEP 5: PUBLISH LISTING
  // ------------------------------------------

  const listing = await prisma.listing.update({
    where: {
      id: existing.id,
    },

    data: {
      status: "PUBLISHED",
      rejectionReason: null,
    },
  });

  return res.json({
    message: `PG "${existing.name}" approved and published.`,
    listing,
  });
});

// PATCH /api/v1/admin/listings/:id/reject
// Request body:
// { "reason": "Incorrect property address..." }
export const rejectListing = asyncHandler(async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);

  const bodySchema = z.object({
    reason: z
      .string()
      .trim()
      .min(
        5,
        "Please provide a rejection reason of at least 5 characters."
      )
      .max(1000),
  });

  const { reason } = bodySchema.parse(req.body);

  const existing = await prisma.listing.findFirst({
    where: {
      id,
      status: "PENDING",
    },

    select: {
      id: true,
      name: true,
    },
  });

  if (!existing) {
    return res.status(404).json({
      message: "Pending PG listing not found.",
    });
  }

  const listing = await prisma.listing.update({
    where: {
      id: existing.id,
    },

    data: {
      status: "DRAFT",
      rejectionReason: reason,
    },
  });

  return res.json({
    message: `PG "${existing.name}" returned to draft for correction.`,
    listing,
  });
});
