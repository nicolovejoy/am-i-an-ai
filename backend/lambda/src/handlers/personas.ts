import { APIGatewayProxyResult } from "aws-lambda";
import { queryDatabase } from "../lib/database";
import { AuthenticatedEvent } from '../middleware/cognito-auth';
import { getUserWithSync } from '../services/userSync.js';
import { isAdmin } from '../utils/adminConfig.js';

export async function handlePersonas(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  try {
    // Extract persona ID from path if present
    const pathMatch = path.match(/^\/api\/personas\/([^/]+)$/);
    const personaId = pathMatch ? pathMatch[1] : null;

    switch (method) {
      case "GET":
        if (personaId) {
          // GET /api/personas/:id
          return await getPersona(personaId, corsHeaders);
        } else {
          // GET /api/personas
          return await getPersonas(corsHeaders);
        }

      case "POST":
        // POST /api/personas
        return await createPersona(event, corsHeaders);

      case "PUT":
        if (personaId) {
          // PUT /api/personas/:id
          return await updatePersona(personaId, event, corsHeaders);
        } else {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: "Persona ID is required for updates",
            }),
          };
        }

      case "DELETE":
        if (personaId) {
          // DELETE /api/personas/:id
          return await deletePersona(personaId, event, corsHeaders);
        } else {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: "Persona ID is required for deletion",
            }),
          };
        }

      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }
  } catch (error) {
    console.error("Personas handler error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: String(error),
      }),
    };
  }
}

async function getPersonas(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Query all personas with proper field mapping
    const personasQuery = `
      SELECT p.*
      FROM personas p
      ORDER BY p.created_at DESC
    `;

    const result = await queryDatabase(personasQuery);

    const personas = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.owner_id || null,
      personality: row.personality || {},
      knowledge: row.knowledge || [],
      communicationStyle: row.communication_style,
      modelConfig: row.model_config || null,
      systemPrompt: row.system_prompt || null,
      responseTimeRange: row.response_time_range || null,
      typingSpeed: row.typing_speed || null,
      isPublic: row.is_public,
      allowedInteractions: row.allowed_interactions || [],
      conversationCount: row.conversation_count || 0,
      totalMessages: row.total_messages || 0,
      averageRating: parseFloat(row.average_rating) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        personas,
      }),
    };
  } catch (error) {
    console.error("Error fetching personas:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch personas",
        message: String(error),
      }),
    };
  }
}

async function getPersona(
  personaId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const personaQuery = `
      SELECT p.*
      FROM personas p
      WHERE p.id = $1
    `;

    const result = await queryDatabase(personaQuery, [personaId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Persona not found",
        }),
      };
    }

    const row = result.rows[0];
    const persona = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.owner_id || null,
      personality: row.personality || {},
      knowledge: row.knowledge || [],
      communicationStyle: row.communication_style,
      modelConfig: row.model_config || null,
      systemPrompt: row.system_prompt || null,
      responseTimeRange: row.response_time_range || null,
      typingSpeed: row.typing_speed || null,
      isPublic: row.is_public,
      allowedInteractions: row.allowed_interactions || [],
      conversationCount: row.conversation_count || 0,
      totalMessages: row.total_messages || 0,
      averageRating: parseFloat(row.average_rating) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        persona,
      }),
    };
  } catch (error) {
    console.error("Error fetching persona:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch persona",
        message: String(error),
      }),
    };
  }
}

async function createPersona(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Request body is required",
        }),
      };
    }

    // Ensure user exists in database before creating persona
    const dbUser = await getUserWithSync(event.user);
    if (!dbUser) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Failed to sync user to database",
        }),
      };
    }

    const personaData = JSON.parse(event.body);
    
    // Validate persona type and user permissions
    const ALLOWED_PERSONA_TYPES = ['human_persona', 'ai_agent', 'ai_ambiguous'];
    const ADMIN_ONLY_TYPES = ['ai_agent'];
    
    if (!ALLOWED_PERSONA_TYPES.includes(personaData.type)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: `Invalid persona type. Must be one of: ${ALLOWED_PERSONA_TYPES.join(', ')}`,
        }),
      };
    }
    
    // Check if user is admin for AI agent creation
    const userIsAdmin = isAdmin(event.user, dbUser);
    if (!userIsAdmin && ADMIN_ONLY_TYPES.includes(personaData.type)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Only administrators can create AI agent personas",
        }),
      };
    }
    
    // Validate required fields
    if (!personaData.name || !personaData.type || !personaData.description) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Missing required fields: name, type, description",
        }),
      };
    }

    // Set defaults for optional fields
    const personality = personaData.personality || {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      creativity: 50,
      assertiveness: 50,
      empathy: 50,
    };
    
    const knowledge = personaData.knowledge || ['general'];
    const isPublic = personaData.isPublic !== undefined ? personaData.isPublic : true;
    const allowedInteractions = personaData.allowedInteractions || ['casual_chat'];
    const communicationStyle = personaData.communicationStyle || 'casual';

    // Insert persona into database
    const insertQuery = `
      INSERT INTO personas (
        name, type, description, owner_id, personality, knowledge,
        communication_style, model_config, system_prompt, response_time_range,
        typing_speed, is_public, allowed_interactions, conversation_count,
        total_messages, average_rating
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 0, 0.0
      ) RETURNING *
    `;

    const values = [
      personaData.name,
      personaData.type,
      personaData.description,
      dbUser.id, // Set owner_id to synced database user
      JSON.stringify(personality),
      knowledge,
      communicationStyle,
      personaData.modelConfig ? JSON.stringify(personaData.modelConfig) : null,
      personaData.systemPrompt || null,
      personaData.responseTimeRange ? JSON.stringify(personaData.responseTimeRange) : null,
      personaData.typingSpeed || null,
      isPublic,
      allowedInteractions,
    ];

    const result = await queryDatabase(insertQuery, values);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create persona');
    }

    const row = result.rows[0];
    const createdPersona = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.owner_id,
      personality: row.personality,
      knowledge: row.knowledge,
      communicationStyle: row.communication_style,
      modelConfig: row.model_config,
      systemPrompt: row.system_prompt,
      responseTimeRange: row.response_time_range,
      typingSpeed: row.typing_speed,
      isPublic: row.is_public,
      allowedInteractions: row.allowed_interactions,
      conversationCount: row.conversation_count,
      totalMessages: row.total_messages,
      averageRating: parseFloat(row.average_rating),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        persona: createdPersona,
      }),
    };
  } catch (error) {
    console.error('Error creating persona:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to create persona',
        message: String(error),
      }),
    };
  }
}

async function updatePersona(
  personaId: string,
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Request body is required",
        }),
      };
    }

    // Check if persona exists and user has permission to update it
    const checkQuery = `
      SELECT owner_id FROM personas WHERE id = $1
    `;
    const checkResult = await queryDatabase(checkQuery, [personaId]);
    
    if (checkResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Persona not found",
        }),
      };
    }

    const personaOwnerId = checkResult.rows[0].owner_id;
    if (personaOwnerId && personaOwnerId !== event.user?.id) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "You do not have permission to update this persona",
        }),
      };
    }

    const updateData = JSON.parse(event.body);
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    // Build dynamic update query based on provided fields
    if (updateData.name !== undefined) {
      updateFields.push(`name = $${valueIndex++}`);
      updateValues.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateFields.push(`description = $${valueIndex++}`);
      updateValues.push(updateData.description);
    }
    if (updateData.personality !== undefined) {
      updateFields.push(`personality = $${valueIndex++}`);
      updateValues.push(JSON.stringify(updateData.personality));
    }
    if (updateData.knowledge !== undefined) {
      updateFields.push(`knowledge = $${valueIndex++}`);
      updateValues.push(updateData.knowledge);
    }
    if (updateData.communicationStyle !== undefined) {
      updateFields.push(`communication_style = $${valueIndex++}`);
      updateValues.push(updateData.communicationStyle);
    }
    if (updateData.modelConfig !== undefined) {
      updateFields.push(`model_config = $${valueIndex++}`);
      updateValues.push(JSON.stringify(updateData.modelConfig));
    }
    if (updateData.systemPrompt !== undefined) {
      updateFields.push(`system_prompt = $${valueIndex++}`);
      updateValues.push(updateData.systemPrompt);
    }
    if (updateData.responseTimeRange !== undefined) {
      updateFields.push(`response_time_range = $${valueIndex++}`);
      updateValues.push(JSON.stringify(updateData.responseTimeRange));
    }
    if (updateData.typingSpeed !== undefined) {
      updateFields.push(`typing_speed = $${valueIndex++}`);
      updateValues.push(updateData.typingSpeed);
    }
    if (updateData.isPublic !== undefined) {
      updateFields.push(`is_public = $${valueIndex++}`);
      updateValues.push(updateData.isPublic);
    }
    if (updateData.allowedInteractions !== undefined) {
      updateFields.push(`allowed_interactions = $${valueIndex++}`);
      updateValues.push(updateData.allowedInteractions);
    }

    if (updateFields.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "No fields to update",
        }),
      };
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(personaId);

    const updateQuery = `
      UPDATE personas 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await queryDatabase(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update persona');
    }

    const row = result.rows[0];
    const updatedPersona = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.owner_id,
      personality: row.personality,
      knowledge: row.knowledge,
      communicationStyle: row.communication_style,
      modelConfig: row.model_config,
      systemPrompt: row.system_prompt,
      responseTimeRange: row.response_time_range,
      typingSpeed: row.typing_speed,
      isPublic: row.is_public,
      allowedInteractions: row.allowed_interactions,
      conversationCount: row.conversation_count,
      totalMessages: row.total_messages,
      averageRating: parseFloat(row.average_rating),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        persona: updatedPersona,
      }),
    };
  } catch (error) {
    console.error('Error updating persona:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to update persona',
        message: String(error),
      }),
    };
  }
}

async function deletePersona(
  personaId: string,
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Check if persona exists and user has permission to delete it
    const checkQuery = `
      SELECT owner_id FROM personas WHERE id = $1
    `;
    const checkResult = await queryDatabase(checkQuery, [personaId]);
    
    if (checkResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Persona not found",
        }),
      };
    }

    const personaOwnerId = checkResult.rows[0].owner_id;
    if (personaOwnerId && personaOwnerId !== event.user?.id) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "You do not have permission to delete this persona",
        }),
      };
    }

    // Check if persona is in active conversations
    const conversationCheckQuery = `
      SELECT COUNT(*) as active_conversations
      FROM conversations c
      WHERE c.participants @> $1::jsonb
      AND c.status = 'active'
    `;
    const conversationResult = await queryDatabase(conversationCheckQuery, [
      JSON.stringify([{ persona_id: personaId }])
    ]);
    
    const activeConversations = parseInt(conversationResult.rows[0].active_conversations);
    if (activeConversations > 0) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: `Cannot delete persona: it is currently in ${activeConversations} active conversation(s)`,
        }),
      };
    }

    // Perform soft delete by updating status or hard delete
    // For now, we'll do a hard delete, but in production you might want soft delete
    const deleteQuery = `
      DELETE FROM personas WHERE id = $1 RETURNING id, name
    `;
    
    const result = await queryDatabase(deleteQuery, [personaId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to delete persona');
    }

    const deletedPersona = result.rows[0];

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: `Persona "${deletedPersona.name}" has been deleted`,
        deletedPersonaId: deletedPersona.id,
      }),
    };
  } catch (error) {
    console.error('Error deleting persona:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete persona',
        message: String(error),
      }),
    };
  }
}
