
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/profile.controller";

const router = Router();

// Every profile endpoint requires authentication.
router.use(authMiddleware);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/password", changePassword);

export default router;
