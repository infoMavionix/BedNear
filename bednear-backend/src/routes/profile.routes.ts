import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/profile.controller";

const router = Router();

// All profile endpoints require a valid JWT.
router.use(authMiddleware);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/password", changePassword);

export default router;