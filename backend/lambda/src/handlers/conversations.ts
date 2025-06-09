import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryDatabase } from '../lib/database';
import { randomUUID } from 'crypto';

export async function handleConversations(
  event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  try {
    // Extract conversation ID from path if present
    const pathMatch = path.match(/^\/api\/conversations\/([^\/]+)$/);
    const conversationId = pathMatch ? pathMatch[1] : null;

    switch (method) {
      case 'GET':
        if (conversationId) {
          // GET /api/conversations/:id
          return await getConversation(conversationId, corsHeaders);
        } else {
          // GET /api/conversations
          return await getConversations(corsHeaders);
        }

      case 'POST':
        if (conversationId) {
          // POST /api/conversations/:id/messages (handle in future)
          return {
            statusCode: 501,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Messages endpoint not implemented yet' }),
          };
        } else {
          // POST /api/conversations
          return await createConversation(event, corsHeaders);
        }

      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }
  } catch (error) {
    console.error('Conversations handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: String(error),
      }),
    };
  }
}

async function getConversation(
  conversationId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Query conversation with participants
    const conversationQuery = `
      SELECT c.*, 
             json_agg(
               json_build_object(
                 'personaId', cp.persona_id,
                 'role', cp.role,
                 'isRevealed', cp.is_revealed,
                 'joinedAt', cp.joined_at,
                 'lastActiveAt', cp.last_active_at
               )
             ) as participants
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await queryDatabase(conversationQuery, [conversationId]);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Conversation not found'
        }),
      };
    }
    
    const conversation = result.rows[0];
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          topic: conversation.topic,
          description: conversation.description,
          status: conversation.status,
          participants: conversation.participants || [],
          createdAt: conversation.created_at,
          messageCount: conversation.message_count,
          totalCharacters: conversation.total_characters,
          topicTags: conversation.topic_tags,
        },
      }),
    };
    
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch conversation',
        message: String(error)
      }),
    };
  }
}

async function getConversations(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Query all conversations with basic info
    const conversationsQuery = `
      SELECT c.id, c.title, c.topic, c.description, c.status, 
             c.created_at, c.message_count, c.topic_tags,
             COUNT(cp.persona_id) as participant_count
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      GROUP BY c.id, c.title, c.topic, c.description, c.status, c.created_at, c.message_count, c.topic_tags
      ORDER BY c.created_at DESC
      LIMIT 50
    `;
    
    const result = await queryDatabase(conversationsQuery);
    
    const conversations = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      topic: row.topic,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      messageCount: row.message_count,
      participantCount: parseInt(row.participant_count) || 0,
      topicTags: row.topic_tags || [],
    }));
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        conversations,
      }),
    };
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch conversations',
        message: String(error)
      }),
    };
  }
}

async function createConversation(
  event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    const { title, topic, description, selectedPersonas, goals, topicTags } = body;

    // Basic validation
    if (!title?.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Title is required' }),
      };
    }

    if (!topic?.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Topic is required' }),
      };
    }

    if (!selectedPersonas || selectedPersonas.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'At least one persona must be selected' }),
      };
    }

    // Create conversation in database
    const conversationId = randomUUID();
    const createdBy = '550e8400-e29b-41d4-a716-446655440001'; // Demo user Alice, in production this would come from auth context
    
    // Insert conversation
    const insertConversationQuery = `
      INSERT INTO conversations (
        id, title, topic, description, status, goal, 
        topic_tags, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const conversationResult = await queryDatabase(insertConversationQuery, [
      conversationId,
      title.trim(),
      topic.trim(),
      description?.trim() || '',
      'active',
      goals?.trim() || null,
      topicTags || [],
      createdBy
    ]);
    
    const conversation = conversationResult.rows[0];
    
    // Insert conversation participants
    for (let i = 0; i < selectedPersonas.length; i++) {
      const personaId = selectedPersonas[i];
      const role = i === 0 ? 'initiator' : 'responder';
      
      const insertParticipantQuery = `
        INSERT INTO conversation_participants (
          conversation_id, persona_id, role, is_revealed, joined_at, last_active_at
        ) VALUES ($1, $2, $3, false, NOW(), NOW())
      `;
      
      await queryDatabase(insertParticipantQuery, [conversationId, personaId, role]);
    }
    
    console.log('Conversation created successfully:', conversationId);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          topic: conversation.topic,
          description: conversation.description,
          status: conversation.status,
          goal: conversation.goal,
          topicTags: conversation.topic_tags,
          createdAt: conversation.created_at,
          participants: selectedPersonas,
        },
      }),
    };

  } catch (error) {
    console.error('Error creating conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to create conversation',
        message: String(error),
      }),
    };
  }
}