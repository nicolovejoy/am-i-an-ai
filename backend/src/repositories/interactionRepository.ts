import { IInteraction, Interaction } from "../models/Interaction";
import { ApplicationError } from "../middleware/errorHandler";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new interaction in DynamoDB
 */
export async function createInteraction(
  interactionData: Omit<IInteraction, "id" | "createdAt" | "updatedAt">
): Promise<IInteraction> {
  try {
    // Create a new interaction with auto-generated ID
    const newInteraction = {
      id: uuidv4(),
      ...interactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save interaction to DynamoDB using the Entity with type assertion
    await (Interaction as any).put(newInteraction);

    return newInteraction;
  } catch (error) {
    throw error;
  }
}

/**
 * Find an interaction by ID and user ID
 */
export async function findById(
  id: string,
  userId: string
): Promise<IInteraction | null> {
  try {
    // Using the Entity with type assertion
    const result = await (Interaction as any).get({
      pk: `USER#${userId}`,
      sk: `INTERACTION#${id}`,
    });

    if (result.Item) {
      return result.Item as IInteraction;
    }

    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all interactions for a user
 */
export async function findByUserId(
  userId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, any>
): Promise<{
  items: IInteraction[];
  lastEvaluatedKey?: Record<string, any>;
}> {
  try {
    // Using the Entity with type assertion
    const queryParams: any = {
      pk: `USER#${userId}`,
      beginsWith: "INTERACTION#",
      limit,
    };

    if (lastEvaluatedKey) {
      queryParams.exclusiveStartKey = lastEvaluatedKey;
    }

    const result = await (Interaction as any).query(queryParams);

    return {
      items: result.Items as IInteraction[],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all interactions for an agent
 */
export async function findByAgentId(
  agentId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, any>
): Promise<{
  items: IInteraction[];
  lastEvaluatedKey?: Record<string, any>;
}> {
  try {
    // Using the Entity with type assertion and GSI
    const queryParams: any = {
      index: "gsi1",
      pk: `AGENT#${agentId}`,
      beginsWith: "INTERACTION#",
      limit,
    };

    if (lastEvaluatedKey) {
      queryParams.exclusiveStartKey = lastEvaluatedKey;
    }

    const result = await (Interaction as any).query(queryParams);

    return {
      items: result.Items as IInteraction[],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update an interaction
 */
export async function updateInteraction(
  id: string,
  userId: string,
  updates: Partial<IInteraction>
): Promise<IInteraction> {
  try {
    // Prepare update expression and attribute values
    const existingInteraction = await findById(id, userId);
    if (!existingInteraction) {
      throw new ApplicationError("Interaction not found", 404);
    }

    // Include updatedAt in updates
    const updatedFields = {
      ...updates,
      updatedAt: new Date(),
    };

    // Update in DynamoDB
    const updateParams = {
      pk: `USER#${userId}`,
      sk: `INTERACTION#${id}`,
      ...updatedFields,
    };

    await (Interaction as any).update(updateParams);

    // Return the updated interaction
    const updatedInteraction = await findById(id, userId);
    if (!updatedInteraction) {
      throw new ApplicationError("Failed to retrieve updated interaction", 500);
    }

    return updatedInteraction;
  } catch (error) {
    throw error;
  }
}

/**
 * Add a message to an interaction
 */
export async function addMessage(
  id: string,
  userId: string,
  message: { sender: "user" | "agent"; content: string; timestamp: Date }
): Promise<IInteraction> {
  try {
    const interaction = await findById(id, userId);
    if (!interaction) {
      throw new ApplicationError("Interaction not found", 404);
    }

    // Add the message to the messages array
    const newMessages = [...interaction.messages, message];

    // Update the interaction with the new message and last message timestamp
    return updateInteraction(id, userId, {
      messages: newMessages,
      lastMessageAt: message.timestamp,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Update interaction trust score
 */
export async function updateTrustScore(
  id: string,
  userId: string,
  trustScore: number
): Promise<IInteraction> {
  try {
    if (trustScore < 0 || trustScore > 100) {
      throw new ApplicationError("Trust score must be between 0 and 100", 400);
    }

    return updateInteraction(id, userId, { trustScore });
  } catch (error) {
    throw error;
  }
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(
  id: string,
  userId: string
): Promise<void> {
  try {
    await (Interaction as any).delete({
      pk: `USER#${userId}`,
      sk: `INTERACTION#${id}`,
    });
  } catch (error) {
    throw error;
  }
}
