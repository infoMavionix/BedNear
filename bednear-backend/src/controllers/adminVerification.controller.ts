
import { Request } from "express";
import { z } from "zod";
import fs from "fs";

import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { getStoredFilePath } from "../config/storage";

type AuthenticatedRequest = Request & {
  userId?: string;
};

// GET /api/v1/admin/documents/:documentId/file
// Only authenticated admins can retrieve verification documents.
export const getAdminVerificationDocument = asyncHandler(
  async (req, res) => {
    const documentId = z.string().min(1).parse(req.params.documentId);

    const document = await prisma.verificationDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        storageKey: true,
        originalName: true,
        mimeType: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        message: "Verification document not found.",
      });
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(document.mimeType)) {
      return res.status(415).json({
        message: "This document format cannot be previewed.",
      });
    }

    const filePath = getStoredFilePath(document.storageKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "The stored document file could not be found.",
      });
    }

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.originalName)}"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    return res.sendFile(filePath);
  }
);

// PATCH /api/v1/admin/documents/:documentId/review
//
// Body:
// { "status": "VERIFIED" }
//
// or
//
// { "status": "REJECTED", "reviewNote": "Document is unclear..." }
//
// Supports:
// 1. Owner registration documents (listingId = null)
// 2. PG listing verification documents (listingId != null)
export const reviewVerificationDocument = asyncHandler(
  async (req, res) => {
    const documentId = z.string().min(1).parse(req.params.documentId);

    const bodySchema = z
      .object({
        status: z.enum(["VERIFIED", "REJECTED"]),
        reviewNote: z.string().trim().max(1000).optional(),
      })
      .superRefine((data, context) => {
        if (data.status === "REJECTED" && !data.reviewNote?.trim()) {
          context.addIssue({
            code: "custom",
            path: ["reviewNote"],
            message: "A rejection reason is required.",
          });
        }
      });

    const { status, reviewNote } = bodySchema.parse(req.body);

    const adminId = (req as AuthenticatedRequest).userId;

    if (!adminId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const existing = await prisma.verificationDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        ownerId: true,
        type: true,
        status: true,
        listingId: true,
        listing: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Verification document not found.",
      });
    }

    // ------------------------------------------
    // CASE 1: OWNER REGISTRATION DOCUMENT
    // ------------------------------------------

    if (!existing.listingId) {
      const allowedOwnerDocumentTypes = [
        "OWNER_IDENTITY",
        "PG_LICENSE",
      ];

      if (!allowedOwnerDocumentTypes.includes(existing.type)) {
        return res.status(400).json({
          message: "Invalid owner registration document type.",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update the reviewed document.
        const document = await tx.verificationDocument.update({
          where: { id: documentId },
          data: {
            status,
            reviewNote:
              status === "REJECTED"
                ? reviewNote!.trim()
                : reviewNote?.trim() || null,
            reviewedAt: new Date(),
          },
          select: {
            id: true,
            ownerId: true,
            type: true,
            status: true,
            originalName: true,
            reviewNote: true,
            reviewedAt: true,
            updatedAt: true,
          },
        });

        if (status === "REJECTED") {
          // A rejected registration document blocks the owner.
          const owner = await tx.user.update({
            where: { id: existing.ownerId },
            data: {
              isVerified: false,
              verificationStatus: "REJECTED",
            },
            select: {
              id: true,
              name: true,
              email: true,
              isVerified: true,
              verificationStatus: true,
            },
          });

          return {
            document,
            owner,
            approved: false,
          };
        }

        // Check both mandatory owner registration documents.
        const ownerDocuments =
          await tx.verificationDocument.findMany({
            where: {
              ownerId: existing.ownerId,
              listingId: null,
              type: {
                in: ["OWNER_IDENTITY", "PG_LICENSE"],
              },
            },
            select: {
              type: true,
              status: true,
            },
          });

        const identityVerified = ownerDocuments.some(
          (item) =>
            item.type === "OWNER_IDENTITY" &&
            item.status === "VERIFIED"
        );

        const licenseVerified = ownerDocuments.some(
          (item) =>
            item.type === "PG_LICENSE" &&
            item.status === "VERIFIED"
        );

        const allDocumentsVerified =
          identityVerified && licenseVerified;

        const owner = await tx.user.update({
          where: { id: existing.ownerId },
          data: allDocumentsVerified
            ? {
                isVerified: true,
                verificationStatus: "APPROVED",
              }
            : {
                isVerified: false,
                verificationStatus: "UNDER_REVIEW",
              },
          select: {
            id: true,
            name: true,
            email: true,
            isVerified: true,
            verificationStatus: true,
          },
        });

        return {
          document,
          owner,
          approved: allDocumentsVerified,
        };
      });

      return res.json({
        message: result.approved
          ? "Document verified. All required owner documents are approved. Owner account is now approved."
          : "Document verified. Waiting for the remaining owner registration document to be verified.",
        document: result.document,
        owner: result.owner,
      });
    }

    // ------------------------------------------
    // CASE 2: PG LISTING DOCUMENT
    // ------------------------------------------

    if (!existing.listing) {
      return res.status(404).json({
        message: "Associated PG listing not found.",
      });
    }

    if (existing.listing.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only documents belonging to pending PG listings can be reviewed.",
      });
    }

    const document = await prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status,
        reviewNote:
          status === "REJECTED"
            ? reviewNote!.trim()
            : reviewNote?.trim() || null,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        ownerId: true,
        type: true,
        status: true,
        originalName: true,
        reviewNote: true,
        reviewedAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      message:
        status === "VERIFIED"
          ? "PG listing verification document approved."
          : "PG listing verification document rejected.",
      document,
    });
  }
);

// GET /api/v1/admin/listings/:listingId/images/:storageKey/file
// Only authenticated admins can retrieve photos of pending PG listings.
export const getAdminListingImageFile = asyncHandler(
  async (req, res) => {
    const listingId = z.string().min(1).parse(req.params.listingId);
    const storageKey = z.string().min(1).parse(req.params.storageKey);

    const image = await prisma.listingImage.findFirst({
      where: {
        listingId,
        storageKey,
        listing: {
          status: "PENDING",
        },
      },
      select: {
        id: true,
        storageKey: true,
        mimeType: true,
        originalName: true,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "Listing image not found.",
      });
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!image.mimeType || !allowedMimeTypes.includes(image.mimeType)) {
      return res.status(415).json({
        message: "Unsupported image format.",
      });
    }

    const filePath = getStoredFilePath(image.storageKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "The stored listing image could not be found.",
      });
    }

    res.setHeader("Content-Type", image.mimeType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    return res.sendFile(filePath);
  }
);
