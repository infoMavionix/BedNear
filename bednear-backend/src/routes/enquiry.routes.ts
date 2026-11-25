
import { Router } from "express";

import authMiddleware, {
  requireApprovedOwner,
} from "../middleware/auth.middleware";

import {
  createEnquiry,
  createEnquiryAction,
  getMyEnquiries,
  getEnquiries,
  updateEnquiry,
} from "../controllers/enquiry.controller";

const router = Router();

// All enquiry operations require authentication.
router.use(authMiddleware);

// --------------------------------------------------
// CANDIDATE ROUTES
// --------------------------------------------------

// Candidates can create enquiries without owner approval.
router.post("/", createEnquiry);

router.post("/action", createEnquiryAction);

router.get("/mine", getMyEnquiries);

// --------------------------------------------------
// APPROVED OWNER ROUTES
// --------------------------------------------------

// Only approved owners can view and manage enquiries.
router.get(
  "/",
  requireApprovedOwner,
  getEnquiries
);

router.patch(
  "/:id",
  requireApprovedOwner,
  updateEnquiry
);

export default router;
