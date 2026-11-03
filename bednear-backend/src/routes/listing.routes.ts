
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  submitListingForReview,
} from "../controllers/listing.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getListings);
router.post("/", createListing);
router.get("/:id", getListingById);

// Submit before the generic PATCH route
router.patch("/:id/submit", submitListingForReview);

router.patch("/:id", updateListing);
router.delete("/:id", deleteListing);

export default router;
