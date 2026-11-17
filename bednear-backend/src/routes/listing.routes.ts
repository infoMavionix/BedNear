
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

import {
  uploadPropertyPhotos,
  uploadSingleFile,
} from "../middleware/upload.middleware";

import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  submitListingForReview,
} from "../controllers/listing.controller";

import {
  uploadListingPhotos,
  uploadListingDocument,
  getOwnerListingImage,
  getOwnerListingDocument,
} from "../controllers/listingUpload.controller";

const router = Router();

router.use(authMiddleware);

// Listing CRUD
router.get("/", getListings);
router.post("/", createListing);

// Upload PG photos
router.post(
  "/:id/photos",
  uploadPropertyPhotos,
  uploadListingPhotos
);

// Upload verification documents
router.post(
  "/:id/documents",
  uploadSingleFile,
  uploadListingDocument
);

// Owner-only photo and document retrieval
router.get(
  "/:id/images/:storageKey/file",
  getOwnerListingImage
);

router.get(
  "/:id/documents/:documentId/file",
  getOwnerListingDocument
);

// Submit PG for admin review
router.patch("/:id/submit", submitListingForReview);

// Update and delete
router.patch("/:id", updateListing);
router.delete("/:id", deleteListing);

router.get("/:id", getListingById);

export default router;
