import { z } from "zod";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";

const enquiryUpdateInput = z
  .object({
    status: z
      .enum(["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED"])
      .optional(),
    ownerNotes: z.string().max(3000).nullable().optional(),
    preferredVisitAt: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.ownerNotes !== undefined ||
      data.preferredVisitAt !== undefined,
    { message: "Provide at least one field to update." }
  );

// GET /api/v1/admin/enquiries
export const getAdminEnquiries = asyncHandler(async (req, res) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const status = req.query.status;

  const validStatuses = [
    "NEW",
    "CONTACTED",
    "VISIT_SCHEDULED",
    "CLOSED",
  ] as const;

  if (
    typeof status === "string" &&
    status !== "ALL" &&
    !validStatuses.includes(status as (typeof validStatuses)[number])
  ) {
    return res.status(400).json({
      message: "Invalid enquiry status filter.",
    });
  }

  const enquiries = await prisma.enquiry.findMany({
    where: {
      ...(typeof status === "string" && status !== "ALL"
        ? { status: status as (typeof validStatuses)[number] }
        : {}),
      ...(search
        ? {
            OR: [
              {
                candidateName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                listing: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                owner: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const counts = await prisma.enquiry.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const summary = {
    total: counts.reduce((sum, item) => sum + item._count._all, 0),
    new: counts.find((item) => item.status === "NEW")?._count._all ?? 0,
    contacted:
      counts.find((item) => item.status === "CONTACTED")?._count._all ?? 0,
    visits:
      counts.find((item) => item.status === "VISIT_SCHEDULED")?._count._all ??
      0,
    closed:
      counts.find((item) => item.status === "CLOSED")?._count._all ?? 0,
  };

  return res.json({
    enquiries,
    summary,
  });
});

// PATCH /api/v1/admin/enquiries/:id
export const updateAdminEnquiry = asyncHandler(async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);
  const data = enquiryUpdateInput.parse(req.body);

  const existing = await prisma.enquiry.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({
      message: "Enquiry not found.",
    });
  }

  const enquiry = await prisma.enquiry.update({
    where: { id },
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return res.json({
    message: "Enquiry updated successfully.",
    enquiry,
  });
});