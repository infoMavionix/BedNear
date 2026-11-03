
import { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type EnquiryAction =
  | "INTERESTED"
  | "CALL"
  | "WHATSAPP"
  | "VISIT";

type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "CLOSED";

const ACTIVE_ENQUIRY_STATUSES: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
];

const CONTACT_METHODS: EnquiryAction[] = [
  "INTERESTED",
  "CALL",
  "WHATSAPP",
  "VISIT",
];

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

const enquiryUpdateInput = z
  .object({
    status: z
      .enum([
        "NEW",
        "CONTACTED",
        "VISIT_SCHEDULED",
        "CLOSED",
      ])
      .optional(),

    ownerNotes: z.string().max(3000).nullable().optional(),

    preferredVisitAt: z.coerce.date().nullable().optional(),

    visitCompletedAt: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.ownerNotes !== undefined ||
      data.preferredVisitAt !== undefined ||
      data.visitCompletedAt !== undefined,
    {
      message: "Provide at least one field to update.",
    }
  );

const candidateEnquiryInput = z.object({
  listingId: z.string().min(1),
  message: z.string().trim().max(2000).optional(),
  preferredVisitAt: z.coerce.date().optional(),
});

const candidateActionInput = z
  .object({
    listingId: z.string().min(1),

    action: z.enum([
      "INTERESTED",
      "CALL",
      "WHATSAPP",
      "VISIT",
    ]),

    message: z.string().trim().max(2000).optional(),

    preferredVisitAt: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      data.action !== "VISIT" ||
      data.preferredVisitAt !== undefined,
    {
      message:
        "Please select a preferred date and time for your visit.",
      path: ["preferredVisitAt"],
    }
  );

// --------------------------------------------------
// SHARED ERROR HELPER
// --------------------------------------------------

function createHttpError(
  message: string,
  statusCode: number
) {
  return Object.assign(new Error(message), {
    statusCode,
  });
}

// --------------------------------------------------
// VALIDATE ACTIVE CANDIDATE
// --------------------------------------------------

async function getActiveCandidate(candidateId: string) {
  const candidate = await prisma.user.findUnique({
    where: {
      id: candidateId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (!candidate || !candidate.isActive) {
    throw createHttpError(
      "Your account is unavailable. Please log in again.",
      403
    );
  }

  if (candidate.role !== "CANDIDATE") {
    throw createHttpError(
      "Only candidate accounts can submit enquiries.",
      403
    );
  }

  if (!candidate.phone?.trim()) {
    throw createHttpError(
      "Please add your mobile number to your profile first.",
      400
    );
  }

  return candidate;
}

// --------------------------------------------------
// GET PUBLISHED LISTING
// --------------------------------------------------

async function getPublishedListing(listingId: string) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      ownerId: true,
    },
  });
}

// --------------------------------------------------
// CREATE OR UPDATE CANDIDATE ENQUIRY ACTION
// --------------------------------------------------

async function saveCandidateEnquiryAction(input: {
  candidateId: string;
  listingId: string;
  action: EnquiryAction;
  message?: string;
  preferredVisitAt?: Date;
}) {
  // FIX 1:
  // Directly get the candidate.
  // No undefined candidateResult variable.

  const candidate = await getActiveCandidate(
    input.candidateId
  );

  const listing = await getPublishedListing(
    input.listingId
  );

  if (!listing) {
    throw createHttpError(
      "Published PG not found.",
      404
    );
  }

  // ------------------------------------------------
  // TRANSACTION
  // ------------------------------------------------

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.enquiry.findFirst({
      where: {
        candidateId: candidate.id,
        listingId: listing.id,
        status: {
          in: ACTIVE_ENQUIRY_STATUSES,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      // FIX 2:
      // Explicitly select contactMethods.
      // Prisma Client must be regenerated after schema changes.

      select: {
        id: true,
        status: true,
        contactMethods: true,
      },
    });

    // ------------------------------------------------
    // CONTACT METHODS
    // ------------------------------------------------

    const existingMethods: EnquiryAction[] =
      existing?.contactMethods ?? [];

    const contactMethods: EnquiryAction[] = Array.from(
      new Set([
        ...existingMethods,
        input.action,
      ])
    );

    // ------------------------------------------------
    // ENQUIRY STATUS
    // ------------------------------------------------

    let status: EnquiryStatus;

    if (input.action === "VISIT") {
      status = "VISIT_SCHEDULED";
    } else if (
      input.action === "CALL" ||
      input.action === "WHATSAPP"
    ) {
      status =
        existing?.status === "VISIT_SCHEDULED"
          ? "VISIT_SCHEDULED"
          : "CONTACTED";
    } else {
      status = existing?.status ?? "NEW";
    }

    // ------------------------------------------------
    // UPDATE EXISTING ENQUIRY
    // ------------------------------------------------

    if (existing) {
      return tx.enquiry.update({
        where: {
          id: existing.id,
        },

        data: {
          contactMethods,
          status,

          ...(input.message
            ? {
                message: input.message,
              }
            : {}),

          ...(input.preferredVisitAt
            ? {
                preferredVisitAt: input.preferredVisitAt,
              }
            : {}),
        },

        include: {
          listing: {
            select: {
              id: true,
              name: true,
              locality: true,
              city: true,
              monthlyRent: true,
            },
          },
        },
      });
    }

    // ------------------------------------------------
    // CREATE NEW ENQUIRY
    // ------------------------------------------------

    return tx.enquiry.create({
      data: {
        candidateId: candidate.id,
        candidateName: candidate.name,
        phone: candidate.phone!,
        email: candidate.email,

        message: input.message || null,

        preferredVisitAt:
          input.preferredVisitAt ?? null,

        contactMethods,
        status,

        listingId: listing.id,
        ownerId: listing.ownerId,
      },

      include: {
        listing: {
          select: {
            id: true,
            name: true,
            locality: true,
            city: true,
            monthlyRent: true,
          },
        },
      },
    });
  });

  return result;
}

// --------------------------------------------------
// GET OWNER ENQUIRIES
// GET /api/v1/enquiries
// --------------------------------------------------

export const getEnquiries = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = (
      req as AuthenticatedRequest
    ).userId!;

    const owner = await prisma.user.findUnique({
      where: {
        id: ownerId,
      },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (
      !owner ||
      !owner.isActive ||
      owner.role !== "OWNER"
    ) {
      return res.status(403).json({
        message:
          "Only active owners can access this endpoint.",
      });
    }

    const enquiries = await prisma.enquiry.findMany({
      where: {
        ownerId,
      },

      include: {
        listing: {
          select: {
            id: true,
            name: true,
            locality: true,
            city: true,
            monthlyRent: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      enquiries,
    });
  }
);

// --------------------------------------------------
// UPDATE ENQUIRY
// PATCH /api/v1/enquiries/:id
// --------------------------------------------------

export const updateEnquiry = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = (
      req as AuthenticatedRequest
    ).userId!;

    const id = z.string().min(1).parse(req.params.id);

    const data = enquiryUpdateInput.parse(req.body);

    const owner = await prisma.user.findUnique({
      where: {
        id: ownerId,
      },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (
      !owner ||
      !owner.isActive ||
      owner.role !== "OWNER"
    ) {
      return res.status(403).json({
        message:
          "Only active owners can update enquiries.",
      });
    }

    const existing = await prisma.enquiry.findFirst({
      where: {
        id,
        ownerId,
      },

      select: {
        id: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Enquiry not found.",
      });
    }

    const enquiry = await prisma.enquiry.update({
      where: {
        id,
      },

      data,

      include: {
        listing: {
          select: {
            id: true,
            name: true,
            locality: true,
            city: true,
            monthlyRent: true,
          },
        },
      },
    });

    return res.json({
      message: "Enquiry updated successfully.",
      enquiry,
    });
  }
);

// --------------------------------------------------
// CREATE ENQUIRY
// POST /api/v1/enquiries
// --------------------------------------------------

export const createEnquiry = asyncHandler(
  async (req: Request, res: Response) => {
    const candidateId = (
      req as AuthenticatedRequest
    ).userId!;

    const data = candidateEnquiryInput.parse(req.body);

    const enquiry = await saveCandidateEnquiryAction({
      candidateId,
      listingId: data.listingId,

      action: data.preferredVisitAt
        ? "VISIT"
        : "INTERESTED",

      message: data.message,
      preferredVisitAt: data.preferredVisitAt,
    });

    return res.status(201).json({
      message: data.preferredVisitAt
        ? "Your visit request was submitted successfully."
        : "Your enquiry was submitted successfully.",

      enquiry,
    });
  }
);

// --------------------------------------------------
// CREATE ENQUIRY ACTION
// POST /api/v1/enquiries/action
// --------------------------------------------------

export const createEnquiryAction = asyncHandler(
  async (req: Request, res: Response) => {
    const candidateId = (
      req as AuthenticatedRequest
    ).userId!;

    const data = candidateActionInput.parse(req.body);

    const enquiry = await saveCandidateEnquiryAction({
      candidateId,
      listingId: data.listingId,
      action: data.action,
      message: data.message,
      preferredVisitAt: data.preferredVisitAt,
    });

    const messages: Record<EnquiryAction, string> = {
      INTERESTED:
        "Your interest was recorded successfully.",

      CALL:
        "Your call request was recorded successfully.",

      WHATSAPP:
        "Your WhatsApp contact was recorded successfully.",

      VISIT:
        "Your visit request was submitted successfully.",
    };

    return res.status(200).json({
      message: messages[data.action],
      enquiry,
    });
  }
);

// --------------------------------------------------
// GET CANDIDATE ENQUIRIES
// GET /api/v1/enquiries/mine
// --------------------------------------------------

export const getMyEnquiries = asyncHandler(
  async (req: Request, res: Response) => {
    const candidateId = (
      req as AuthenticatedRequest
    ).userId!;

    const candidate = await prisma.user.findUnique({
      where: {
        id: candidateId,
      },

      select: {
        role: true,
        isActive: true,
      },
    });

    if (
      !candidate ||
      !candidate.isActive ||
      candidate.role !== "CANDIDATE"
    ) {
      return res.status(403).json({
        message:
          "Only active candidates can access their enquiries.",
      });
    }

    const enquiries = await prisma.enquiry.findMany({
      where: {
        candidateId,
      },

      include: {
        listing: {
          select: {
            id: true,
            name: true,
            locality: true,
            city: true,
            address: true,
            monthlyRent: true,
            deposit: true,
            status: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      enquiries,
    });
  }
);
