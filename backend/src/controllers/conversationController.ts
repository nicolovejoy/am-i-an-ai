import { Request, Response, NextFunction } from "express";
import { ApplicationError } from "../middleware/errorHandler";
import * as conversationRepository from "../repositories/conversationRepository";

/**
 * Get all conversations for the authenticated user
 * GET /api/conversations
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const archived =
      req.query.archived === "true"
        ? true
        : req.query.archived === "false"
        ? false
        : undefined;

    // Get conversations from repository
    const conversations = await conversationRepository.getConversations(
      userId!,
      archived
    );

    res.status(200).json({
      status: "success",
      data: {
        conversations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific conversation by ID
 * GET /api/conversations/:id
 */
export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Find conversation through repository
    const conversation = await conversationRepository.getConversation(
      userId!,
      id
    );

    if (!conversation) {
      throw new ApplicationError("Conversation not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 * POST /api/conversations
 */
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { title, initialMessage } = req.body;

    // Create conversation through repository
    const conversation = await conversationRepository.createConversation(
      userId!,
      title,
      initialMessage
    );

    res.status(201).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a message to a conversation
 * POST /api/conversations/:id/messages
 */
export const addMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content, sender } = req.body;

    // Validate sender
    if (!["user", "ai", "system"].includes(sender)) {
      throw new ApplicationError("Invalid sender type", 400);
    }

    // Add message through repository
    const message = await conversationRepository.addMessage(
      userId!,
      id,
      content,
      sender as "user" | "ai" | "system"
    );

    res.status(200).json({
      status: "success",
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive/unarchive a conversation
 * PATCH /api/conversations/:id/archive
 */
export const toggleArchive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { archived } = req.body;

    // Toggle archive through repository
    const conversation = await conversationRepository.toggleArchive(
      userId!,
      id,
      archived
    );

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a conversation
 * DELETE /api/conversations/:id
 */
export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Delete conversation through repository
    await conversationRepository.deleteConversation(userId!, id);

    res.status(200).json({
      status: "success",
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
