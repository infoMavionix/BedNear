import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

import {
  PRIVATE_UPLOAD_DIR,
  ensurePrivateUploadDirectory,
} from "../config/storage";

const allowedMimeTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    try {
      ensurePrivateUploadDirectory();
      callback(null, PRIVATE_UPLOAD_DIR);
    } catch (error) {
      callback(error as Error, "");
    }
  },

  filename: (_req, file, callback) => {
    const extension = allowedMimeTypes[file.mimetype];

    if (!extension) {
      callback(new Error("Unsupported file type."), "");
      return;
    }

    // Never use the original filename as a disk filename.
    callback(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback
) => {
  if (!allowedMimeTypes[file.mimetype]) {
    callback(
      new Error(
        "Only JPG, PNG, WebP images and PDF documents are allowed."
      )
    );
    return;
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10,
  },
});

/**
 * Use for a single uploaded file.
 * Expected multipart field name: file
 */
export const uploadSingleFile = upload.single("file");

/**
 * Use for multiple PG property photos.
 * Expected multipart field name: photos
 */
export const uploadPropertyPhotos = upload.array("photos", 10);