import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  getEnquiries,
  updateEnquiry,
  createPublicEnquiry,
} from "../controllers/enquiry.controller";

const router = Router();

// Public candidate submission must be registered before authentication.
router.post("/public", createPublicEnquiry);

router.use(authMiddleware);
router.get("/", getEnquiries);
router.patch("/:id", updateEnquiry);

export default router;