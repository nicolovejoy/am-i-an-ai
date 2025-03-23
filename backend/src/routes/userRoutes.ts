import express from "express";
import * as userController from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { updateProfileSchema } from "../validation/authSchema";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get("/profile", userController.getUserProfile);
router.put(
  "/profile",
  validateBody(updateProfileSchema),
  userController.updateUserProfile
);
router.delete("/account", userController.deleteUserAccount);

export default router;
