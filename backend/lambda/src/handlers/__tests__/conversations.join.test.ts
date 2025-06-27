import { handleConversations } from '../conversations';
import { queryDatabase } from '../../lib/database';
import { AuthenticatedEvent, UserContext } from '../../middleware/cognito-auth';

// Mock the database module
jest.mock('../../lib/database');
const mockQueryDatabase = queryDatabase as jest.MockedFunction<typeof queryDatabase>;

describe('Conversations API - Join Endpoint Tests', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  // mockUser removed as it's not used in these join tests

  const mockUser2: UserContext = {
    id: 'user-2',
    email: 'bob@example.com',
    cognitoGroups: ['regular'],
    isAuthenticated: true,
  };

  const mockAdminUser: UserContext = {
    id: 'admin-1',
    email: 'admin@example.com',
    cognitoGroups: ['admin'],
    isAuthenticated: true,
  };

  const mockPublicConversation = {
    id: 'conv-public-1',
    title: 'Public Discussion',
    topic: 'Philosophy',
    description: 'Open to all',
    visibility: 'public',
    created_by: 'user-1',
    created_at: new Date('2024-01-01T10:00:00Z'),
    initiator_persona_id: 'persona-1',
    permission_overrides: {},
    participants: [
      {
        persona_id: 'persona-1',
        role: 'host',
        joined_at: new Date('2024-01-01T10:00:00Z'),
        is_revealed: true,
        left_at: null,
        permissions: ['read', 'write', 'moderate'],
        metadata: {}
      }
    ],
    state: {
      status: 'active',
      can_add_messages: true,
      closed_by: null,
      closed_at: null,
      close_reason: null,
      paused_at: null,
      resumed_at: null,
      restrictions: []
    },
    metadata: {
      tags: ['philosophy'],
      visibility: 'public',
      featured: false,
      priority: 'medium'
    },
    settings: {
      max_participants: 10,
      allow_late_joining: true,
      auto_close_after_hours: null,
      require_moderation: false,
      allow_anonymous: false
    },
    history: [],
    schema_version: 1,
    deleted_at: null
  };

  const mockPrivateConversation = {
    ...mockPublicConversation,
    id: 'conv-private-1',
    title: 'Private Discussion',
    visibility: 'private',
    metadata: {
      ...mockPublicConversation.metadata,
      visibility: 'private'
    }
  };

  const mockUserPersonas = [
    {
      id: 'persona-2',
      name: 'Bob User',
      type: 'human_persona',
      owner_id: 'user-2',
      is_ai_agent: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryDatabase.mockReset();
  });

  const createJoinEvent = (conversationId: string, user: UserContext = mockUser2, personaId?: string): AuthenticatedEvent => ({
    httpMethod: 'POST',
    path: `/api/conversations/${conversationId}/join`,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personaId: personaId || 'persona-2' }),
    user,
    isBase64Encoded: false,
    pathParameters: { id: conversationId },
    queryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
  });

  describe('POST /conversations/:id/join', () => {
    it('should allow joining a public conversation with valid persona', async () => {
      // Mock database calls in order:
      // 1. Get conversation, 2. Get user, 3. Get user personas, 4. Update conversation, 5. Get updated conversation
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [mockPublicConversation] }) // Get conversation
        .mockResolvedValueOnce({ rows: [{ id: 'user-2', email: 'bob@example.com', role: 'regular' }] }) // Get user
        .mockResolvedValueOnce({ rows: mockUserPersonas }) // Get user personas
        .mockResolvedValueOnce({ rows: [{ affected_rows: 1 }] }) // Update conversation
        .mockResolvedValueOnce({ rows: [{ ...mockPublicConversation, participants: [...mockPublicConversation.participants, {
          persona_id: 'persona-2',
          role: 'guest',
          joined_at: new Date(),
          is_revealed: true,
          left_at: null,
          permissions: ['read', 'write'],
          metadata: {}
        }] }] }); // Get updated conversation

      const event = createJoinEvent('conv-public-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toMatchObject({
        success: true,
        message: 'Successfully joined conversation',
        conversation: expect.objectContaining({
          id: 'conv-public-1',
          participants: expect.arrayContaining([
            expect.objectContaining({ persona_id: 'persona-2' })
          ])
        })
      });
    });

    it('should reject joining a private conversation', async () => {
      // Mock database calls
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [mockPrivateConversation] }) // Get conversation
        .mockResolvedValueOnce({ rows: [{ id: 'user-2', email: 'bob@example.com', role: 'regular' }] }) // Get user
        .mockResolvedValueOnce({ rows: mockUserPersonas }); // Get user personas

      const event = createJoinEvent('conv-private-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Forbidden',
        message: 'Cannot join private conversations'
      });
    });

    it('should reject joining with persona not owned by user', async () => {
      // Mock database calls
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [mockPublicConversation] }) // Get conversation
        .mockResolvedValueOnce({ rows: [{ id: 'user-2', email: 'bob@example.com', role: 'regular' }] }) // Get user
        .mockResolvedValueOnce({ rows: mockUserPersonas }); // Get user personas

      const event = createJoinEvent('conv-public-1', mockUser2, 'persona-not-owned');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Forbidden',
        message: 'You do not own the specified persona'
      });
    });

    it('should reject joining when already a participant', async () => {
      const conversationWithExistingParticipant = {
        ...mockPublicConversation,
        participants: [
          ...mockPublicConversation.participants,
          {
            persona_id: 'persona-2',
            role: 'guest',
            joined_at: new Date('2024-01-01T11:00:00Z'),
            is_revealed: true,
            left_at: null,
            permissions: ['read', 'write'],
            metadata: {}
          }
        ]
      };

      // Mock database calls
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [conversationWithExistingParticipant] }) // Get conversation
        .mockResolvedValueOnce({ rows: [{ id: 'user-2', email: 'bob@example.com', role: 'regular' }] }) // Get user
        .mockResolvedValueOnce({ rows: mockUserPersonas }); // Get user personas

      const event = createJoinEvent('conv-public-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Bad Request',
        message: 'Persona is already a participant in this conversation'
      });
    });

    it('should reject joining when conversation is at max participants', async () => {
      const fullConversation = {
        ...mockPublicConversation,
        state: {
          ...mockPublicConversation.state,
          status: 'active' // Ensure it's active so we get to the max participants check
        },
        settings: {
          ...mockPublicConversation.settings,
          max_participants: 1, // Already has 1 participant, so adding another should fail
          allow_late_joining: true // Ensure late joining is allowed so we get to max participants check
        }
      };

      // Mock database calls - only need first 3 calls since we fail early
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [fullConversation] }); // Get conversation

      const event = createJoinEvent('conv-public-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Bad Request',
        message: 'Conversation has reached maximum number of participants'
      });
    });

    it('should reject joining when conversation does not allow late joining', async () => {
      const noLateJoiningConversation = {
        ...mockPublicConversation,
        state: {
          ...mockPublicConversation.state,
          status: 'active' // Ensure it's active so we get to the late joining check
        },
        settings: {
          ...mockPublicConversation.settings,
          allow_late_joining: false, // This should trigger the early return
          max_participants: 10 // Ensure max participants is not a constraint
        }
      };

      // Mock database calls - only need first call since we fail early
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [noLateJoiningConversation] }); // Get conversation

      const event = createJoinEvent('conv-public-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Forbidden',
        message: 'This conversation does not allow late joining'
      });
    });

    it('should reject joining when conversation is closed', async () => {
      const closedConversation = {
        ...mockPublicConversation,
        state: {
          ...mockPublicConversation.state,
          status: 'closed', // This should trigger the early return
          can_add_messages: false
        }
      };

      // Mock database calls - only need first call since we fail early on status check
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [closedConversation] }); // Get conversation

      const event = createJoinEvent('conv-public-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Bad Request',
        message: 'Cannot join a closed conversation'
      });
    });

    it('should allow admin to join any public conversation', async () => {
      const adminPersonas = [{ 
        id: 'admin-persona-1',
        name: 'Admin',
        type: 'human_persona',
        owner_id: 'admin-1',
        is_ai_agent: false,
        created_at: new Date(),
        updated_at: new Date()
      }];

      const publicConversationForAdmin = {
        ...mockPublicConversation,
        state: {
          ...mockPublicConversation.state,
          status: 'active'
        },
        settings: {
          ...mockPublicConversation.settings,
          allow_late_joining: true,
          max_participants: 10
        },
        metadata: {
          ...mockPublicConversation.metadata,
          visibility: 'public' // Explicitly ensure it's public
        }
      };

      // Mock database calls in order:
      // 1. Get conversation, 2. Get user, 3. Get user personas, 4. Update conversation, 5. Get updated conversation
      mockQueryDatabase
        .mockResolvedValueOnce({ rows: [publicConversationForAdmin] }) // Get conversation
        .mockResolvedValueOnce({ rows: [{ id: 'admin-1', email: 'admin@example.com', role: 'admin' }] }) // Get user
        .mockResolvedValueOnce({ rows: adminPersonas }) // Get admin personas
        .mockResolvedValueOnce({ rows: [{ affected_rows: 1 }] }) // Update conversation
        .mockResolvedValueOnce({ rows: [{ ...mockPublicConversation, participants: [...mockPublicConversation.participants, {
          persona_id: 'admin-persona-1',
          role: 'moderator',
          joined_at: new Date(),
          is_revealed: true,
          left_at: null,
          permissions: ['read', 'write', 'moderate'],
          metadata: {}
        }] }] }); // Get updated conversation

      const event = createJoinEvent('conv-public-1', mockAdminUser, 'admin-persona-1');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toMatchObject({
        success: true,
        conversation: expect.objectContaining({
          participants: expect.arrayContaining([
            expect.objectContaining({ 
              persona_id: 'admin-persona-1',
              role: 'moderator' // Admin gets moderator role
            })
          ])
        })
      });
    });

    it('should return 404 for non-existent conversation', async () => {
      // Mock database calls - conversation not found, so only need first call
      mockQueryDatabase.mockResolvedValueOnce({ rows: [] }); // Conversation not found

      const event = createJoinEvent('conv-nonexistent');
      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    });

    it('should require personaId in request body', async () => {
      const event: AuthenticatedEvent = {
        httpMethod: 'POST',
        path: '/api/conversations/conv-public-1/join',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing personaId
        user: mockUser2,
        isBase64Encoded: false,
        pathParameters: { id: 'conv-public-1' },
        queryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
      };

      const response = await handleConversations(event, corsHeaders);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: 'Bad Request',
        message: 'personaId is required'
      });
    });
  });
});