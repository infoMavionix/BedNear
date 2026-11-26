
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";

import {
  getProfile,
  updateProfile,
  changePassword,
  getMyFavorites,
  saveFavorite,
  removeFavorite,
} from "../controllers/profile.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/password", changePassword);

// Candidate saved PGs
router.get("/favorites", getMyFavorites);
router.post("/favorites/:listingId", saveFavorite);
router.delete("/favorites/:listingId", removeFavorite);

export default router;
