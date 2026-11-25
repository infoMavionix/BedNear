
import { Router } from "express";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller";

import {
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../controllers/phone-auth.controller";

import authMiddleware from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

// Candidate phone authentication
router.post("/send-otp", sendPhoneOtp);
router.post("/verify-otp", verifyPhoneOtp);

// Owner registration with private verification documents
router.post(
  "/register",
  upload.fields([
    { name: "ownerIdentity", maxCount: 1 },
    { name: "pgLicense", maxCount: 1 },
  ]),
  register
);

// Owner login
router.post("/login", login);

// Authenticated user information
router.get("/me", authMiddleware, getCurrentUser);

export default router;
