
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

const router = Router();

// Candidate phone authentication
router.post("/send-otp", sendPhoneOtp);
router.post("/verify-otp", verifyPhoneOtp);

// Existing owner authentication
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
