
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

import {
  getListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
} from "../controllers/listing.controller";

const router = Router();

// Every owner listing operation requires authentication.
router.use(authMiddleware);

router.get("/", getListings);
router.post("/", createListing);
router.get("/:id", getListingById);
router.patch("/:id", updateListing);
router.delete("/:id", deleteListing);

export default router;
