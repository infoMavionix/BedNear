import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { getStoredFilePath } from "../config/storage";

export const getAdminListingImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const listingId = Array.isArray(req.params.listingId)
  ? req.params.listingId[0]
  : req.params.listingId;

const storageKey = Array.isArray(req.params.storageKey)
  ? req.params.storageKey[0]
  : req.params.storageKey;

if (!listingId || !storageKey) {
  res.status(400).json({ message: "Invalid listing image parameters." });
  return;
}

    const image = await prisma.listingImage.findFirst({
      where: {
        listingId,
        storageKey,
      },
    });

    if (!image) {
      res.status(404).json({ message: "Listing image not found." });
      return;
    }

    const filePath = getStoredFilePath(image.storageKey);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: "Image file not found in storage." });
      return;
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!image.mimeType || !allowedMimeTypes.includes(image.mimeType)) {
      res.status(415).json({ message: "Unsupported image format." });
      return;
    }

    res.setHeader("Content-Type", image.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(image.originalName || "pg-photo")}"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    res.sendFile(filePath);
  } catch (error) {
    console.error("Admin listing image error:", error);
    res.status(500).json({ message: "Unable to load listing image." });
  }
};