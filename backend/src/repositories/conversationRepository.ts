import { Conversation, IConversation, IMessage } from "../models/Conversation";
import { ApplicationError } from "../middleware/errorHandler";
import { v4 as uuidv4 } from "uuid";

/**
 * Get all conversations for a user
 */
export async function getConversations(
  userId: string,
  archived?: boolean
): Promise<IConversation[]> {
  try {
    let queryParams: any = {
      pk: `USER#${userId}`,
      beginsWith: "CONV#",
    };

    // If archived filter is provided, use GSI1
    if (archived !== undefined) {
      queryParams = {
        index: "gsi1",
        pk: `USER#${userId}`,
        beginsWith: `ARCHIVED#${archived ? "1" : "0"}#CONV#`,
      };
    }

    // Using the Entity with type assertion
    const result = await (Conversation as any).query(queryParams);

    return result.Items as unknown as IConversation[];
  } catch (error) {
    throw error;
  }
}

/**
 * Get a conversation by ID
 */
export async function getConversation(
  userId: string,
  id: string
): Promise<IConversation | null> {
  try {
    // Using the Entity with type assertion
    const result = await (Conversation as any).get({
      pk: `USER#${userId}`,
      sk: `CONV#${id}`,
    });

    if (!result.Item) {
      return null;
    }

    return result.Item as unknown as IConversation;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title: string,
  initialMessage?: string
): Promise<IConversation> {
  try {
    const id = uuidv4();
    const now = new Date();

    let messages: IMessage[] = [];

    if (initialMessage) {
      messages = [
        {
          content: initialMessage,
          sender: "user",
          timestamp: now,
        },
      ];
    }

    const newConversation = {
      id,
      userId,
      title,
      messages,
      lastMessageAt: now,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    // Using the Entity with type assertion
    await (Conversation as any).put(newConversation);

    return newConversation;
  } catch (error) {
    throw error;
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  userId: string,
  conversationId: string,
  content: string,
  sender: "user" | "ai" | "system"
): Promise<IMessage> {
  try {
    // First get the conversation
    const conversation = await getConversation(userId, conversationId);
    if (!conversation) {
      throw new ApplicationError("Conversation not found", 404);
    }

    // Create the new message
    const message: IMessage = {
      content,
      sender,
      timestamp: new Date(),
    };

    // Prepare the update
    const now = new Date();
    const messages = [...conversation.messages, message];

    // Using the Entity with type assertion
    await (Conversation as any).update({
      pk: `USER#${userId}`,
      sk: `CONV#${conversationId}`,
      messages,
      lastMessageAt: now,
      updatedAt: now,
    });

    return message;
  } catch (error) {
    throw error;
  }
}

/**
 * Toggle conversation archive status
 */
export async function toggleArchive(
  userId: string,
  conversationId: string,
  archived: boolean
): Promise<IConversation> {
  try {
    // Get the existing conversation
    const conversation = await getConversation(userId, conversationId);
    if (!conversation) {
      throw new ApplicationError("Conversation not found", 404);
    }

    const now = new Date();

    // Update the conversation using the Entity with type assertion
    await (Conversation as any).update({
      pk: `USER#${userId}`,
      sk: `CONV#${conversationId}`,
      isArchived: archived,
      updatedAt: now,
    });

    // Get and return the updated conversation
    const updatedConversation = await getConversation(userId, conversationId);
    if (!updatedConversation) {
      throw new ApplicationError("Conversation not found after update", 500);
    }

    return updatedConversation;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    // Using the Entity with type assertion
    await (Conversation as any).delete({
      pk: `USER#${userId}`,
      sk: `CONV#${conversationId}`,
    });
  } catch (error) {
    throw error;
  }
}
