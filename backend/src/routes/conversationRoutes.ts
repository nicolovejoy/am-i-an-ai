import express from "express";
import * as conversationController from "../controllers/conversationController";
import { authenticate } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validation";
import {
  createConversationSchema,
  addMessageSchema,
  toggleArchiveSchema,
  conversationIdSchema,
} from "../validation/conversationSchema";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get("/", conversationController.getConversations);

router.post(
  "/",
  validateBody(createConversationSchema),
  conversationController.createConversation
);

router.get(
  "/:id",
  validateParams(conversationIdSchema),
  conversationController.getConversation
);

router.post(
  "/:id/messages",
  validateParams(conversationIdSchema),
  validateBody(addMessageSchema),
  conversationController.addMessage
);

router.patch(
  "/:id/archive",
  validateParams(conversationIdSchema),
  validateBody(toggleArchiveSchema),
  conversationController.toggleArchive
);

router.delete(
  "/:id",
  validateParams(conversationIdSchema),
  conversationController.deleteConversation
);

export default router;
