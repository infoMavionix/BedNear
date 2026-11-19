import { Router } from "express";
import authMiddleware, {
  requireApprovedOwner,
} from "../middleware/auth.middleware";

import { getDashboardSummary } from "../controllers/dashboard.controller";

const router = Router();

// Dashboard access is restricted to approved owners.
router.use(authMiddleware, requireApprovedOwner);

router.get("/summary", getDashboardSummary);

export default router;