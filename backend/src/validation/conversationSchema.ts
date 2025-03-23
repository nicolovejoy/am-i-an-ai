import { z } from "zod";

// Schema for creating a new conversation
export const createConversationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  initialMessage: z.string().optional(),
});

// Schema for adding a message to a conversation
export const addMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  sender: z.enum(["user", "ai", "system"]),
});

// Schema for toggling archive status
export const toggleArchiveSchema = z.object({
  archived: z.boolean(),
});

// Schema for conversation ID parameter
export const conversationIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid conversation ID"),
});
