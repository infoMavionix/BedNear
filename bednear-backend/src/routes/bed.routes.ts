import { Router } from "express";
import authMiddleware, {
  requireApprovedOwner,
} from "../middleware/auth.middleware";

import {
  getBeds,
  createBed,
  updateBed,
  deleteBed,
} from "../controllers/bed.controller";

const router = Router();

// Only authenticated and approved PG owners can manage beds.
router.use(authMiddleware, requireApprovedOwner);

router.get("/", getBeds);
router.post("/", createBed);
router.patch("/:id", updateBed);
router.delete("/:id", deleteBed);

export default router;