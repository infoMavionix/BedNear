import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

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

// Candidate routes
router.post("/", createEnquiry); // Existing enquiry endpoint
router.post("/action", createEnquiryAction); // Interested, visit, call, WhatsApp
router.get("/mine", getMyEnquiries);

// Owner routes
router.get("/", getEnquiries);
router.patch("/:id", updateEnquiry);

export default router;