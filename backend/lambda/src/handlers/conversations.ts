import { APIGatewayProxyResult } from 'aws-lambda';
import { queryDatabase } from '../lib/database';
import { randomUUID } from 'crypto';
import { AuthenticatedEvent } from '../middleware/cognito-auth';

export async function handleConversations(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  try {
    // Extract conversation ID from path if present
    const pathMatch = path.match(/^\/api\/conversations\/([^/]+)/);
    const conversationId = pathMatch ? pathMatch[1] : null;

    switch (method) {
      case 'GET':
        if (conversationId) {
          // Check if this is a messages endpoint
          const messagesMatch = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
          if (messagesMatch) {
            // GET /api/conversations/:id/messages
            return await getMessages(conversationId, corsHeaders);
          } else {
            // GET /api/conversations/:id
            return await getConversation(conversationId, corsHeaders);
          }
        } else {
          // GET /api/conversations
          return await getConversations(event, corsHeaders);
        }

      case 'POST':
        if (conversationId) {
          // Handle messages endpoint
          const messagesMatch = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
          if (messagesMatch) {
            // POST /api/conversations/:id/messages
            return await createMessage(conversationId, event, corsHeaders);
          } else {
            return {
              statusCode: 404,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Not Found' }),
            };
          }
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
  _event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // TODO: Filter conversations by user when user-specific conversations are implemented
    // const userId = event.user.id; // Available for future use
    
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
  event: AuthenticatedEvent,
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
    const createdBy = event.user.id; // Use authenticated user ID
    
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

async function getMessages(
  conversationId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Query messages with persona information
    // Use LEFT JOIN to include messages even if persona is missing/deleted
    // Add filtering for visible, non-archived, approved messages
    const messagesQuery = `
      SELECT m.*, 
             COALESCE(p.name, 'Unknown User') as author_name,
             COALESCE(p.type, 'human') as author_type
      FROM messages m
      LEFT JOIN personas p ON m.author_persona_id = p.id
      WHERE m.conversation_id = $1
        AND m.is_visible = true
        AND m.is_archived = false
        AND m.moderation_status = 'approved'
      ORDER BY m.sequence_number ASC
    `;
    
    const result = await queryDatabase(messagesQuery, [conversationId]);
    
    const messages = result.rows.map((row: any) => ({
      id: row.id,
      conversationId: row.conversation_id,
      authorPersonaId: row.author_persona_id,
      authorName: row.author_name,
      authorType: row.author_type,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      sequenceNumber: row.sequence_number,
      isEdited: row.is_edited,
      editedAt: row.edited_at,
      replyToMessageId: row.reply_to_message_id,
      metadata: row.metadata,
      moderationStatus: row.moderation_status,
      isVisible: row.is_visible,
      isArchived: row.is_archived,
    }));
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        messages,
      }),
    };
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch messages',
        message: String(error)
      }),
    };
  }
}

async function createMessage(
  conversationId: string,
  event: AuthenticatedEvent,
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
    const { content, personaId, type = 'text' } = body;

    // Basic validation
    if (!content?.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Content is required' }),
      };
    }

    if (!personaId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Persona ID is required' }),
      };
    }

    // Get the next sequence number
    const sequenceQuery = `
      SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_sequence
      FROM messages
      WHERE conversation_id = $1
    `;
    
    const sequenceResult = await queryDatabase(sequenceQuery, [conversationId]);
    const nextSequence = sequenceResult.rows[0].next_sequence;

    // Calculate metadata
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // 200 WPM average

    // Insert message
    const messageId = randomUUID();
    const insertMessageQuery = `
      INSERT INTO messages (
        id, conversation_id, author_persona_id, content, type,
        sequence_number, metadata, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const metadata = {
      wordCount,
      characterCount,
      readingTime,
      complexity: 0.5, // Default complexity, could be calculated
    };
    
    const result = await queryDatabase(insertMessageQuery, [
      messageId,
      conversationId,
      personaId,
      content.trim(),
      type,
      nextSequence,
      JSON.stringify(metadata)
    ]);
    
    const message = result.rows[0];
    
    // Update conversation statistics
    // Calculate actual message count based on visible, non-archived, approved messages
    const updateConversationQuery = `
      UPDATE conversations 
      SET message_count = (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = $2
          AND m.is_visible = true
          AND m.is_archived = false
          AND m.moderation_status = 'approved'
      ),
      total_characters = total_characters + $1
      WHERE id = $2
    `;
    
    await queryDatabase(updateConversationQuery, [characterCount, conversationId]);
    
    // Update participant last active
    const updateParticipantQuery = `
      UPDATE conversation_participants
      SET last_active_at = NOW()
      WHERE conversation_id = $1 AND persona_id = $2
    `;
    
    await queryDatabase(updateParticipantQuery, [conversationId, personaId]);
    
    console.log('Message created successfully:', messageId);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        messageId: message.id,
        message: {
          id: message.id,
          conversationId: message.conversation_id,
          authorPersonaId: message.author_persona_id,
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          sequenceNumber: message.sequence_number,
          metadata: message.metadata,
        },
      }),
    };

  } catch (error) {
    console.error('Error creating message:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to create message',
        message: String(error),
      }),
    };
  }
}