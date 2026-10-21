import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import { getDashboardSummary } from "../controllers/dashboard.controller";


const router = Router();

// All dashboard endpoints require authentication.
router.use(authMiddleware);

router.get("/summary", getDashboardSummary);

export default router;