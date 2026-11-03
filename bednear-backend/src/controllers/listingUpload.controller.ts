
import { Request } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/async-handler";
import { getStoredFilePath, deleteStoredFile } from "../config/storage";

type AuthenticatedRequest = Request & {
  userId?: string;
};

function getOwnerId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}

const documentTypeSchema = z.enum([
  "OWNER_IDENTITY",
  "PROPERTY_OWNERSHIP",
  "AUTHORIZATION_LETTER",
]);

// POST /api/v1/listings/:id/photos
export const uploadListingPhotos = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);
  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const id = z.string().min(1).parse(req.params.id);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    return res.status(400).json({ message: "Select at least one photo." });
  }

  const listing = await prisma.listing.findFirst({
    where: { id, ownerId },
    select: { id: true, status: true },
  });

  if (!listing) {
    files.forEach((file) => deleteStoredFile(file.filename));
    return res.status(404).json({ message: "PG listing not found." });
  }

 if (!["DRAFT", "PUBLISHED"].includes(listing.status)) {
  files.forEach((file) => deleteStoredFile(file.filename));

  return res.status(400).json({
    message: "Photos cannot be uploaded while this PG is pending admin review.",
  });
}
  try {
    const existingCount = await prisma.listingImage.count({
      where: { listingId: id },
    });

    if (existingCount + files.length > 10) {
      files.forEach((file) => deleteStoredFile(file.filename));
      return res.status(400).json({
        message: "A PG can have a maximum of 10 photos.",
      });
    }

    const images = await prisma.$transaction(
      files.map((file, index) =>
        prisma.listingImage.create({
          data: {
            listingId: id,
            storageKey: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            altText: `PG property photo ${existingCount + index + 1}`,
            sortOrder: existingCount + index,
            isCover: existingCount === 0 && index === 0,
            url: `/api/v1/listings/${id}/images/${file.filename}/file`,
          },
        })
      )
    );

    return res.status(201).json({
      message: "Property photos uploaded successfully.",
      images,
    });
  } catch (error) {
    files.forEach((file) => deleteStoredFile(file.filename));
    throw error;
  }
});

// POST /api/v1/listings/:id/documents
// Multipart fields: type, file
export const uploadListingDocument = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);
  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const id = z.string().min(1).parse(req.params.id);
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Please select a document." });
  }

  const parsedType = documentTypeSchema.safeParse(req.body.type);

  if (!parsedType.success) {
    deleteStoredFile(file.filename);
    return res.status(400).json({
      message:
        "Document type must be OWNER_IDENTITY, PROPERTY_OWNERSHIP or AUTHORIZATION_LETTER.",
    });
  }

  const listing = await prisma.listing.findFirst({
    where: { id, ownerId },
    select: { id: true, status: true },
  });

  if (!listing) {
    deleteStoredFile(file.filename);
    return res.status(404).json({ message: "PG listing not found." });
  }

  if (listing.status !== "DRAFT") {
    deleteStoredFile(file.filename);
    return res.status(400).json({
      message: "Documents can only be uploaded while the PG is in Draft.",
    });
  }

  try {
    // Keep every upload as a separate record so the admin can
    // inspect the latest version and its review history.
    const document = await prisma.verificationDocument.create({
      data: {
        type: parsedType.data,
        originalName: path.basename(file.originalname),
        storageKey: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        ownerId,
        listingId: id,
        status: "PENDING",
      },
      select: {
        id: true,
        type: true,
        status: true,
        originalName: true,
        reviewNote: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Verification document uploaded successfully.",
      document,
    });
  } catch (error) {
    deleteStoredFile(file.filename);
    throw error;
  }
});

// GET /api/v1/listings/:id/images/:imageId/file
// Owner-only image retrieval. Public candidate access will be
// added separately for published listings.
// GET /api/v1/listings/:id/images/:storageKey/file
// Owner-only image retrieval.
export const getOwnerListingImage = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return res.status(401).json({
      message: "Please log in again.",
    });
  }

  const id = z.string().min(1).parse(req.params.id);
  const storageKey = z.string().min(1).parse(req.params.storageKey);

  const image = await prisma.listingImage.findFirst({
    where: {
      storageKey,
      listingId: id,
      listing: {
        ownerId,
      },
    },
  });

  if (!image) {
    return res.status(404).json({
      message: "Property image not found.",
    });
  }

  const filePath = getStoredFilePath(image.storageKey);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "Image file not found.",
    });
  }

  res.setHeader(
    "Content-Type",
    image.mimeType ?? "application/octet-stream"
  );
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");

  return res.sendFile(filePath);
});

// GET /api/v1/listings/:id/documents/:documentId/file
// Owner-only private document retrieval.
export const getOwnerListingDocument = asyncHandler(async (req, res) => {
  const ownerId = getOwnerId(req);
  if (!ownerId) {
    return res.status(401).json({ message: "Please log in again." });
  }

  const id = z.string().min(1).parse(req.params.id);
  const documentId = z.string().min(1).parse(req.params.documentId);

  const document = await prisma.verificationDocument.findFirst({
    where: {
      id: documentId,
      listingId: id,
      ownerId,
    },
  });

  if (!document) {
    return res.status(404).json({ message: "Document not found." });
  }

  const filePath = getStoredFilePath(document.storageKey);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Document file not found." });
  }

  res.setHeader("Content-Type", document.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(document.originalName)}"`
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");

  return res.sendFile(filePath);
});
