import express from "express";
import * as authController from "../controllers/authController";
import { validateBody } from "../middleware/validation";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from "../validation/authSchema";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Public routes
router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);
router.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  authController.verifyEmail
);

// Protected routes
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
