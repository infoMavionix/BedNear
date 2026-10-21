import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  getBeds,
  createBed,
  updateBed,
  deleteBed,
} from "../controllers/bed.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", getBeds);
router.post("/", createBed);
router.patch("/:id", updateBed);
router.delete("/:id", deleteBed);

export default router;