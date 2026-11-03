import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware";
import adminMiddleware from "../middleware/admin.middleware";

import {
  getPendingListings,
  approveListing,
  rejectListing,
} from "../controllers/adminListing.controller";

import { getAdminDashboardStats } from "../controllers/adminDashboard.controller";

import {
  getAdminUsers,
  updateAdminUserStatus,
} from "../controllers/adminUser.controller";

import {
  getAdminEnquiries,
  updateAdminEnquiry,
} from "../controllers/adminEnquiry.controller";


import { getAdminListingImage } from "../controllers/adminListingImage.controller";

import {
  getAdminVerificationDocument,
  reviewVerificationDocument,
  getAdminListingImageFile,
} from "../controllers/adminVerification.controller";

const router = Router();

// All routes below require a valid ADMIN account.
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get("/dashboard/stats", getAdminDashboardStats);

// PG listing approvals
router.get("/listings/pending", getPendingListings);
router.patch("/listings/:id/approve", approveListing);
router.patch("/listings/:id/reject", rejectListing);

// Owners and candidates
router.get("/users", getAdminUsers);
router.patch("/users/:id/status", updateAdminUserStatus);

// Platform-wide enquiries
router.get("/enquiries", getAdminEnquiries);
router.patch("/enquiries/:id", updateAdminEnquiry);

// Verification document review
router.get(
  "/documents/:documentId/file",
  getAdminVerificationDocument
);

router.patch(
  "/documents/:documentId/review",
  reviewVerificationDocument
);

router.get(
  "/listings/:listingId/images/:storageKey/file",
  getAdminListingImage
);

router.get(
  "/listings/:listingId/images/:storageKey/file",
  getAdminListingImageFile
);
export default router;