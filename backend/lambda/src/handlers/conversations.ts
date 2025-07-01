import { APIGatewayProxyResult } from 'aws-lambda';
import { queryDatabase } from '../lib/database';
import { randomUUID } from 'crypto';
import { createAIOrchestrator, ConversationContext, MessageContext, PersonaProfile } from '../services/aiOrchestrator';
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
      case 'GET': {
        if (conversationId) {
          // Check if this is a messages endpoint
          const messagesMatch = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
          if (messagesMatch) {
            // GET /api/conversations/:id/messages
            return await getMessages(conversationId, corsHeaders);
          } else {
            // GET /api/conversations/:id
            return await getConversation(conversationId, event, corsHeaders);
          }
        } else {
          // GET /api/conversations
          return await getConversations(event, corsHeaders);
        }
      }

      case 'POST': {
        if (conversationId) {
          // Handle messages endpoint
          const messagesMatch = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
          if (messagesMatch) {
            // POST /api/conversations/:id/messages
            return await createMessage(conversationId, event, corsHeaders);
          } 
          // Handle close conversation endpoint
          const closeMatch = path.match(/^\/api\/conversations\/([^/]+)\/close$/);
          if (closeMatch) {
            // POST /api/conversations/:id/close
            return await closeConversation(conversationId, event, corsHeaders);
          }
          
          // Handle join conversation endpoint
          const joinMatch = path.match(/^\/api\/conversations\/([^/]+)\/join$/);
          if (joinMatch) {
            // POST /api/conversations/:id/join
            return await joinConversation(conversationId, event, corsHeaders);
          }
          
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Not Found' }),
          };
        } else {
          // POST /api/conversations
          return await createConversation(event, corsHeaders);
        }
      }

      case 'PUT':
        if (conversationId) {
          // PUT /api/conversations/:id
          return await updateConversation(conversationId, event, corsHeaders);
        } else {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Not Found' }),
          };
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
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const { transformUserContext, getUserPersonas } = await import('../utils/permissions');
    const { PermissionEngine } = await import('../permissions/PermissionEngine');
    
    const user = transformUserContext(event.user);
    const userPersonas = await getUserPersonas(user.id);
    const permissionEngine = new PermissionEngine();
    
    // Query conversation with full details for permission checking
    const conversationQuery = `
      SELECT 
        c.id, c.title, c.topic, c.description, c.status, c.metadata,
        c.can_add_messages, c.initiator_persona_id, c.created_at, c.updated_at,
        c.close_reason, c.closed_by, c.closed_at, c.message_count, c.total_characters, c.topic_tags,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'personaId', cp.persona_id,
              'personaName', COALESCE(p.name, 'Unknown'),
              'personaType', COALESCE(p.type, 'human'),
              'ownerId', p.owner_id,
              'role', cp.role,
              'joinedAt', cp.joined_at,
              'isRevealed', cp.is_revealed
            )
          ) FILTER (WHERE cp.persona_id IS NOT NULL),
          '[]'::jsonb
        ) as participants
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN personas p ON cp.persona_id = p.id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.topic, c.description, c.status, c.metadata,
               c.can_add_messages, c.initiator_persona_id, c.created_at, c.updated_at,
               c.close_reason, c.closed_by, c.closed_at, c.message_count, c.total_characters, 
               c.topic_tags
    `;
    
    const result = await queryDatabase(conversationQuery, [conversationId]);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Conversation not found'
        }),
      };
    }
    
    const row = result.rows[0];
    const conversation = {
      id: row.id,
      title: row.title,
      topic: row.topic,
      description: row.description,
      participants: row.participants || [],
      metadata: row.metadata || {},
      settings: {},
      constraints: {},
      goal: {},
      status: row.status,
      can_add_messages: row.can_add_messages,
      initiator_persona_id: row.initiator_persona_id,
      permission_overrides: {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
    
    // Check if user can view this conversation
    const canView = await permissionEngine.canUserViewConversation(user, conversation, userPersonas);
    if (!canView) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'You do not have permission to view this conversation'
        }),
      };
    }
    
    // Get full permissions for this conversation
    const permissions = await permissionEngine.evaluatePermissions({
      user,
      action: 'all',
      resource: conversation,
      resourceType: 'conversation',
      metadata: { userPersonas },
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        conversation: {
          id: conversation.id,
          title: conversation.title,
          topic: conversation.topic,
          description: conversation.description,
          status: conversation.status,
          canAddMessages: conversation.can_add_messages,
          closeReason: row.close_reason,
          closedBy: row.closed_by,
          closedAt: row.closed_at,
          participants: conversation.participants,
          createdAt: conversation.created_at,
          messageCount: row.message_count,
          totalCharacters: row.total_characters,
          topicTags: row.topic_tags,
        },
        permissions: permissions.permissions,
      }),
    };
    
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch conversation',
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
}

async function getConversations(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const { transformUserContext, getUserPersonas } = await import('../utils/permissions');
    const { PermissionEngine } = await import('../permissions/PermissionEngine');
    
    const user = transformUserContext(event.user);
    const userPersonas = await getUserPersonas(user.id);
    
    const permissionEngine = new PermissionEngine();
    
    // Query all conversations with full details for permission checking
    const conversationsQuery = `
      SELECT 
        c.id, c.title, c.topic, c.description, c.status, c.metadata,
        c.can_add_messages, c.initiator_persona_id, c.created_at, c.updated_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'personaId', cp.persona_id,
              'personaName', COALESCE(p.name, 'Unknown'),
              'personaType', COALESCE(p.type, 'human'),
              'ownerId', p.owner_id,
              'role', cp.role,
              'joinedAt', cp.joined_at,
              'isRevealed', cp.is_revealed
            )
          ) FILTER (WHERE cp.persona_id IS NOT NULL),
          '[]'::jsonb
        ) as participants,
        c.message_count,
        c.topic_tags
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN personas p ON cp.persona_id = p.id
      GROUP BY c.id, c.title, c.topic, c.description, c.status, c.metadata,
               c.can_add_messages, c.initiator_persona_id, c.created_at, c.updated_at, 
               c.message_count, c.topic_tags
      ORDER BY c.created_at DESC
      LIMIT 100
    `;
    
    const result = await queryDatabase(conversationsQuery);
    
    // Filter conversations based on permissions
    const accessibleConversations = [];
    
    for (const row of result.rows) {
      const conversation = {
        id: row.id,
        title: row.title,
        topic: row.topic,
        description: row.description,
        participants: row.participants || [],
        metadata: row.metadata || {},
        settings: {},
        constraints: {},
        goal: {},
        status: row.status,
        can_add_messages: row.can_add_messages,
        initiator_persona_id: row.initiator_persona_id,
        permission_overrides: {},
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      };
      
      // Check if user can view this conversation
      const canView = await permissionEngine.canUserViewConversation(user, conversation, userPersonas);
      
      if (canView) {
        // Get full permissions for this conversation
        const permissions = await permissionEngine.evaluatePermissions({
          user,
          action: 'all',
          resource: conversation,
          resourceType: 'conversation',
          metadata: { userPersonas },
        });
        
        accessibleConversations.push({
          id: conversation.id,
          title: conversation.title,
          topic: conversation.topic,
          description: conversation.description,
          status: conversation.status,
          createdAt: conversation.created_at,
          messageCount: row.message_count || 0,
          topicTags: row.topic_tags || [],
          participantCount: conversation.participants.length,
          permissions: permissions.permissions,
        });
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        conversations: accessibleConversations,
        total: accessibleConversations.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

async function createConversation(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    console.log('createConversation called with user:', event.user.id);
    
    if (!event.body) {
      console.log('No request body provided');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    console.log('Request body parsed:', JSON.stringify(body, null, 2));
    
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

    // Validate that user owns all selected personas (except AI personas)
    const personasQuery = `
      SELECT id, name, type, owner_id 
      FROM personas 
      WHERE id = ANY($1::uuid[])
    `;
    
    const personasResult = await queryDatabase(personasQuery, [selectedPersonas]);
    const foundPersonas = personasResult.rows;
    
    // Check if all personas exist
    if (foundPersonas.length !== selectedPersonas.length) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'One or more selected personas do not exist' }),
      };
    }
    
    // Check ownership - user must own human personas
    for (const persona of foundPersonas) {
      if (persona.type === 'human_persona' && persona.owner_id !== event.user.id) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: `You do not own the persona: ${persona.name}` }),
        };
      }
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
    console.log('createMessage called:', { conversationId, userId: event.user?.id });
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

    // Permission checks
    const { transformUserContext, getUserPersonas } = await import('../utils/permissions');
    const { PermissionEngine } = await import('../permissions/PermissionEngine');
    
    const user = transformUserContext(event.user);
    const userPersonas = await getUserPersonas(user.id);
    const permissionEngine = new PermissionEngine();

    // Get conversation details for permission checking
    const conversationQuery = `
      SELECT 
        c.id, c.title, c.topic, c.description, c.status, c.metadata,
        c.can_add_messages, c.initiator_persona_id, c.created_at, c.updated_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'personaId', cp.persona_id,
              'role', cp.role,
              'joinedAt', cp.joined_at,
              'isRevealed', cp.is_revealed
            )
          ) FILTER (WHERE cp.persona_id IS NOT NULL),
          '[]'::jsonb
        ) as participants
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.topic, c.description, c.status, c.metadata,
               c.can_add_messages, c.initiator_persona_id, c.created_at, c.updated_at
    `;
    
    const convResult = await queryDatabase(conversationQuery, [conversationId]);
    
    if (convResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }
    
    const row = convResult.rows[0];
    const conversation = {
      id: row.id,
      title: row.title,
      topic: row.topic,
      description: row.description,
      participants: row.participants || [],
      metadata: row.metadata || {},
      settings: {},
      constraints: {},
      goal: {},
      status: row.status,
      can_add_messages: row.can_add_messages,
      initiator_persona_id: row.initiator_persona_id,
      permission_overrides: {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };

    // Debug conversation and user info
    console.log('Message creation debug:', {
      conversationId,
      personaId,
      userId: user.id,
      conversationParticipants: conversation.participants,
      userPersonas: userPersonas.map(p => ({ id: p.id, name: p.name }))
    });

    // Check if user can post a message as this persona
    const canPost = await permissionEngine.canUserPostMessage(user, conversation, personaId, userPersonas);
    if (!canPost) {
      // Get more specific error reason
      const permissions = await permissionEngine.evaluatePermissions({
        user,
        action: 'addMessage',
        resource: conversation,
        resourceType: 'conversation',
        metadata: { userPersonas, personaId },
      });
      
      console.log('Permission denied:', {
        reason: permissions.reason,
        permissions: permissions.permissions,
        personaId,
        userOwnsPersona: userPersonas.some(p => p.id === personaId)
      });
      
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: permissions.reason || 'You do not have permission to post messages to this conversation'
        }),
      };
    }

    // The permission engine already checked if conversation allows messages
    // No need for additional state checking here

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
    console.log('About to trigger AI responses for conversation:', conversation.id);
    console.log('Conversation participants count:', conversation.participants?.length || 0);
    console.log('First participant:', conversation.participants?.[0]);

    // Trigger AI responses asynchronously (don't block the response)
    try {
      // Use async execution that doesn't block the response but completes within Lambda timeout
      triggerAIResponses(conversation, {
        id: message.id,
        conversationId: message.conversation_id,
        authorPersonaId: message.author_persona_id,
        content: message.content,
        type: message.type,
        sequenceNumber: message.sequence_number,
        timestamp: message.timestamp,
        metadata: message.metadata,
      }).catch(error => {
        console.error('=== AI RESPONSE ERROR ===');
        console.error('Error triggering AI responses:', error);
        console.error('Stack trace:', error.stack);
        // Don't fail the message creation - log and continue
      });
    } catch (error) {
      console.error('Error starting AI response trigger:', error);
    }

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

async function closeConversation(
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
    const { reason, status = 'completed' } = body;

    // Validate status
    const validStatuses = ['completed', 'terminated'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Invalid status. Must be completed or terminated' 
        }),
      };
    }

    // Check if conversation exists and is not already closed
    const checkQuery = `
      SELECT id, status, can_add_messages
      FROM conversations
      WHERE id = $1
    `;
    
    const checkResult = await queryDatabase(checkQuery, [conversationId]);
    
    if (checkResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }
    
    const conversation = checkResult.rows[0];
    
    if (!conversation.can_add_messages) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Conversation is already closed',
          currentStatus: conversation.status
        }),
      };
    }

    // Close the conversation
    const userId = event.user.id;
    const closeQuery = `
      UPDATE conversations 
      SET status = $1,
          can_add_messages = false,
          close_reason = $2,
          closed_by = $3,
          closed_at = NOW(),
          ended_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await queryDatabase(closeQuery, [
      status,
      reason || null,
      userId,
      conversationId
    ]);
    
    const updatedConversation = result.rows[0];
    
    console.log('Conversation closed successfully:', conversationId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        conversation: {
          id: updatedConversation.id,
          status: updatedConversation.status,
          canAddMessages: updatedConversation.can_add_messages,
          closeReason: updatedConversation.close_reason,
          closedBy: updatedConversation.closed_by,
          closedAt: updatedConversation.closed_at,
        },
      }),
    };

  } catch (error) {
    console.error('Error closing conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to close conversation',
        message: String(error),
      }),
    };
  }
}

async function updateConversation(
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
    const { title, topic, description, status, canAddMessages } = body;

    // Check if conversation exists
    const checkQuery = `
      SELECT id FROM conversations WHERE id = $1
    `;
    
    const checkResult = await queryDatabase(checkQuery, [conversationId]);
    
    if (checkResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }

    if (topic !== undefined) {
      updates.push(`topic = $${paramIndex++}`);
      values.push(topic.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description?.trim() || '');
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'paused', 'completed', 'terminated'];
      if (!validStatuses.includes(status)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
          }),
        };
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (canAddMessages !== undefined) {
      updates.push(`can_add_messages = $${paramIndex++}`);
      values.push(canAddMessages);
    }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No valid fields to update' }),
      };
    }

    // Add conversation ID as last parameter
    values.push(conversationId);

    const updateQuery = `
      UPDATE conversations 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await queryDatabase(updateQuery, values);
    const updatedConversation = result.rows[0];
    
    console.log('Conversation updated successfully:', conversationId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        conversation: {
          id: updatedConversation.id,
          title: updatedConversation.title,
          topic: updatedConversation.topic,
          description: updatedConversation.description,
          status: updatedConversation.status,
          canAddMessages: updatedConversation.can_add_messages,
          closeReason: updatedConversation.close_reason,
          closedBy: updatedConversation.closed_by,
          closedAt: updatedConversation.closed_at,
        },
      }),
    };

  } catch (error) {
    console.error('Error updating conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to update conversation',
        message: String(error),
      }),
    };
  }
}

async function joinConversation(
  conversationId: string,
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { personaId } = body;

    if (!personaId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'personaId is required',
        }),
      };
    }

    // Get conversation
    const conversationResult = await queryDatabase(`
      SELECT * FROM conversations 
      WHERE id = $1 AND deleted_at IS NULL
    `, [conversationId]);

    if (conversationResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Conversation not found',
        }),
      };
    }

    const conversation = conversationResult.rows[0];

    // Check if conversation is active
    if (conversation.state?.status !== 'active') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Cannot join a closed conversation',
        }),
      };
    }

    // Check if conversation allows late joining
    if (conversation.settings?.allow_late_joining === false) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'This conversation does not allow late joining',
        }),
      };
    }

    // Check if conversation is at max participants
    const currentParticipantCount = conversation.participants?.length || 0;
    const maxParticipants = conversation.settings?.max_participants;
    if (maxParticipants && currentParticipantCount >= maxParticipants) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Conversation has reached maximum number of participants',
        }),
      };
    }

    // Check if persona is already a participant
    const isAlreadyParticipant = conversation.participants?.some(
      (p: any) => p.persona_id === personaId && !p.left_at
    );
    if (isAlreadyParticipant) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Persona is already a participant in this conversation',
        }),
      };
    }

    // Get user from database
    const userResult = await queryDatabase(`
      SELECT id, email, role FROM users WHERE id = $1
    `, [event.user.id]);

    if (userResult.rows.length === 0) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'User not found in database',
        }),
      };
    }

    const user = userResult.rows[0];

    // Get user's personas
    const personasResult = await queryDatabase(`
      SELECT * FROM personas WHERE owner_id = $1 AND deleted_at IS NULL
    `, [user.id]);

    const userPersonas = personasResult.rows;

    // Check if user owns the persona
    const ownedPersona = userPersonas.find((p: any) => p.id === personaId);
    if (!ownedPersona) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'You do not own the specified persona',
        }),
      };
    }

    // Import PermissionEngine and check permissions
    const { PermissionEngine } = await import('../permissions/PermissionEngine');
    const permissionEngine = new PermissionEngine();

    // Check if conversation is private and user is not admin
    if (conversation.metadata?.visibility === 'private' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Cannot join private conversations',
        }),
      };
    }

    // Determine participant role based on user role
    const participantRole = user.role === 'admin' ? 'moderator' : 'guest';
    const participantPermissions = user.role === 'admin' 
      ? ['read', 'write', 'moderate'] 
      : ['read', 'write'];

    // Add user as participant
    const newParticipant = {
      persona_id: personaId,
      role: participantRole,
      joined_at: new Date(),
      is_revealed: true,
      left_at: null,
      permissions: participantPermissions,
      metadata: {}
    };

    const updatedParticipants = [...(conversation.participants || []), newParticipant];

    // Add history entry
    const historyEntry = {
      timestamp: new Date(),
      action: 'participant_added',
      actor: {
        id: user.id,
        type: 'user',
        name: user.email
      },
      target: personaId,
      details: { 
        persona_id: personaId,
        role: participantRole,
        joined_via: 'join_endpoint'
      }
    };

    const updatedHistory = [...(conversation.history || []), historyEntry];

    // Update conversation in database
    await queryDatabase(`
      UPDATE conversations 
      SET participants = $1, history = $2, updated_at = NOW()
      WHERE id = $3
    `, [JSON.stringify(updatedParticipants), JSON.stringify(updatedHistory), conversationId]);

    // Get updated conversation
    const updatedConversationResult = await queryDatabase(`
      SELECT * FROM conversations WHERE id = $1
    `, [conversationId]);

    const updatedConversation = updatedConversationResult.rows[0];

    // Get permissions for the updated conversation
    const permissionResult = await permissionEngine.evaluatePermissions({
      user,
      action: 'view',
      resource: updatedConversation,
      resourceType: 'conversation'
    });

    const permissions = permissionResult.permissions;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Successfully joined conversation',
        conversation: updatedConversation,
        permissions,
      }),
    };

  } catch (error) {
    console.error('Error joining conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to join conversation',
      }),
    };
  }
}

/**
 * Trigger AI responses for a conversation after a new message
 */
async function triggerAIResponses(
  conversation: any,
  newMessage: MessageContext
): Promise<void> {
  try {
    console.log('=== TRIGGER AI RESPONSES START ===');
    console.log('Triggering AI responses for conversation:', conversation.id);
    console.log('New message:', newMessage);
    
    // Get all personas in the conversation
    const personaIds = conversation.participants.map((p: any) => p.personaId || p.persona_id);
    
    console.log('Conversation participants:', conversation.participants);
    console.log('Extracted persona IDs:', personaIds);
    
    if (personaIds.length === 0) {
      console.log('No participants found in conversation');
      return;
    }

    // Fetch persona details
    const personasQuery = `
      SELECT id, name, type, description, personality, knowledge, 
             communication_style, model_config, system_prompt, allowed_interactions
      FROM personas 
      WHERE id = ANY($1::uuid[])
    `;
    
    const personasResult = await queryDatabase(personasQuery, [personaIds]);
    console.log('Found personas from database:', personasResult.rows.map((r: any) => ({ id: r.id, name: r.name, type: r.type })));
    
    const personas: PersonaProfile[] = personasResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      personality: row.personality,
      knowledge: row.knowledge,
      communicationStyle: row.communication_style,
      modelConfig: row.model_config,
      systemPrompt: row.system_prompt,
      allowedInteractions: row.allowed_interactions
    }));

    // Convert conversation to context format
    const conversationContext: ConversationContext = {
      id: conversation.id,
      title: conversation.title,
      topic: conversation.topic,
      status: conversation.status,
      participants: conversation.participants,
      messageCount: 0 // Will be calculated by orchestrator if needed
    };

    // Analyze AI response triggers
    const orchestrator = createAIOrchestrator();
    const triggers = await orchestrator.analyzeAIResponseTriggers(
      conversationContext,
      newMessage,
      personas
    );

    console.log(`Found ${triggers.length} AI response triggers:`, triggers.map(t => ({
      personaId: t.personaId,
      shouldRespond: t.shouldRespond,
      reason: t.triggerReason
    })));

    // Schedule AI responses
    for (const trigger of triggers) {
      if (trigger.shouldRespond) {
        console.log(`Scheduling AI response for persona ${trigger.personaId} with delay ${trigger.responseDelay}ms`);
        
        setTimeout(async () => {
          try {
            await generateAIResponse(conversation.id, trigger.personaId, newMessage.id);
          } catch (error) {
            console.error(`Error generating AI response for persona ${trigger.personaId}:`, error);
          }
        }, trigger.responseDelay);
      }
    }

  } catch (error) {
    console.error('Error in triggerAIResponses:', error);
    throw error;
  }
}

/**
 * Generate a single AI response
 */
async function generateAIResponse(
  conversationId: string,
  personaId: string,
  triggerMessageId: string
): Promise<void> {
  try {
    console.log(`Generating AI response for persona ${personaId} in conversation ${conversationId}`);
    
    // Call the AI handler to generate response
    const { handleAI } = await import('./ai');
    
    // Create a mock event for the AI handler
    const aiEvent = {
      httpMethod: 'POST',
      path: '/api/ai/generate-response',
      pathParameters: { conversationId },
      body: JSON.stringify({
        conversationId,
        personaId,
        triggerMessageId
      }),
      headers: {},
      requestContext: {},
      user: { id: 'system', role: 'admin' } // System-generated request
    } as any;

    const result = await handleAI(aiEvent, {});
    
    if (result.statusCode === 200) {
      console.log(`AI response generated successfully for persona ${personaId}`);
    } else {
      console.error(`AI response generation failed for persona ${personaId}:`, result.body);
    }

  } catch (error) {
    console.error(`Error generating AI response for persona ${personaId}:`, error);
    throw error;
  }
}