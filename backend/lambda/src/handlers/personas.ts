import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryDatabase } from "../lib/database";
import { AuthenticatedEvent } from '../middleware/cognito-auth';

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
          return await deletePersona(personaId, corsHeaders);
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
  _event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  // TODO: Implement persona creation
  return {
    statusCode: 501,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Persona creation not implemented yet" }),
  };
}

async function updatePersona(
  _personaId: string,
  _event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  // TODO: Implement persona update
  return {
    statusCode: 501,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Persona update not implemented yet" }),
  };
}

async function deletePersona(
  _personaId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  // TODO: Implement persona deletion
  return {
    statusCode: 501,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Persona deletion not implemented yet" }),
  };
}
