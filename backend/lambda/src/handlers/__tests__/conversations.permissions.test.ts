import { handleConversations } from '../conversations';
import { queryDatabase } from '../../lib/database';
import { AuthenticatedEvent, UserContext } from '../../middleware/cognito-auth';

// Mock the database module
jest.mock('../../lib/database');
const mockQueryDatabase = queryDatabase as jest.MockedFunction<typeof queryDatabase>;

describe('Conversations API - Permission Tests', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  const mockUser: UserContext = {
    id: 'user-1',
    email: 'alice@example.com',
    cognitoGroups: ['regular'],
    isAuthenticated: true,
  };

  const mockAdminUser: UserContext = {
    id: 'admin-1',
    email: 'admin@example.com',
    cognitoGroups: ['admin'],
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /conversations', () => {
    const mockEvent = (user: UserContext = mockUser): AuthenticatedEvent => ({
      httpMethod: 'GET',
      path: '/api/conversations',
      headers: {},
      body: null,
      user,
      isBase64Encoded: false,
      pathParameters: null,
      queryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
    });

    it('should only return conversations where user is a participant', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [
          { id: 'persona-1', owner_id: 'user-1', name: 'Alice' },
          { id: 'persona-2', owner_id: 'user-1', name: 'Alice Pro' },
        ],
      });

      // Mock conversations - mix of private, public, and where user is/isn't participant
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [
          {
            id: 'conv-1',
            title: 'Private - User is participant',
            participants: [
              { personaId: 'persona-1', role: 'initiator' },
              { personaId: 'persona-99', role: 'responder' },
            ],
            metadata: { visibility: 'private' },
            status: 'active',
          },
          {
            id: 'conv-2',
            title: 'Private - User NOT participant',
            participants: [
              { personaId: 'persona-99', role: 'initiator' },
              { personaId: 'persona-100', role: 'responder' },
            ],
            metadata: { visibility: 'private' },
            status: 'active',
          },
          {
            id: 'conv-3',
            title: 'Public - User NOT participant',
            participants: [
              { personaId: 'persona-99', role: 'initiator' },
            ],
            metadata: { visibility: 'public' },
            status: 'active',
          },
          {
            id: 'conv-4',
            title: 'Public - User is participant',
            participants: [
              { personaId: 'persona-2', role: 'initiator' },
              { personaId: 'persona-99', role: 'responder' },
            ],
            metadata: { visibility: 'public' },
            status: 'active',
          },
        ],
      });

      const response = await handleConversations(mockEvent(), corsHeaders);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.conversations).toHaveLength(3); // conv-1, conv-3, conv-4
      expect(body.conversations.map((c: any) => c.id)).toEqual(['conv-1', 'conv-3', 'conv-4']);
    });

    it('should return all conversations for admin users', async () => {
      // Mock admin has no personas
      mockQueryDatabase.mockResolvedValueOnce({ rows: [] });

      // Mock conversations
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [
          {
            id: 'conv-1',
            title: 'Private conversation',
            participants: [{ personaId: 'persona-99' }],
            metadata: { visibility: 'private' },
          },
          {
            id: 'conv-2',
            title: 'Another private conversation',
            participants: [{ personaId: 'persona-100' }],
            metadata: { visibility: 'private' },
          },
          {
            id: 'conv-3',
            title: 'Public conversation',
            participants: [{ personaId: 'persona-99' }],
            metadata: { visibility: 'public' },
          },
        ],
      });

      const response = await handleConversations(mockEvent(mockAdminUser), corsHeaders);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.conversations).toHaveLength(3); // All conversations
    });

    it('should include permission metadata for each conversation', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1', name: 'Alice' }],
      });

      // Mock conversations
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [
          {
            id: 'conv-1',
            title: 'User is initiator',
            participants: [{ personaId: 'persona-1', role: 'initiator' }],
            metadata: { visibility: 'private' },
            status: 'active',
            can_add_messages: true,
            initiator_persona_id: 'persona-1',
          },
          {
            id: 'conv-2',
            title: 'User is participant but not initiator',
            participants: [
              { personaId: 'persona-99', role: 'initiator' },
              { personaId: 'persona-1', role: 'responder' },
            ],
            metadata: { visibility: 'private' },
            status: 'active',
            can_add_messages: true,
            initiator_persona_id: 'persona-99',
          },
        ],
      });

      const response = await handleConversations(mockEvent(), corsHeaders);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.conversations).toHaveLength(2);
      
      // Check permissions for initiator
      expect(body.conversations[0].permissions).toEqual({
        canView: true,
        canAddMessage: true,
        canJoin: false,
        canClose: true,
        canAddParticipant: true,
        canRemoveParticipant: true,
        canDelete: false,
      });

      // Check permissions for non-initiator participant
      expect(body.conversations[1].permissions).toEqual({
        canView: true,
        canAddMessage: true,
        canJoin: false,
        canClose: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      });
    });
  });

  describe('GET /conversations/:id', () => {
    const mockEvent = (conversationId: string, user: UserContext = mockUser): AuthenticatedEvent => ({
      httpMethod: 'GET',
      path: `/api/conversations/${conversationId}`,
      headers: {},
      body: null,
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

    it('should allow participants to view private conversations', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          title: 'Private Chat',
          participants: [
            { personaId: 'persona-1', role: 'initiator' },
            { personaId: 'persona-2', role: 'responder' },
          ],
          metadata: { visibility: 'private' },
        }],
      });

      const response = await handleConversations(mockEvent('conv-1'), corsHeaders);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.conversation.id).toBe('conv-1');
    });

    it('should deny non-participants from viewing private conversations', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          title: 'Private Chat',
          participants: [
            { personaId: 'persona-99', role: 'initiator' },
            { personaId: 'persona-100', role: 'responder' },
          ],
          metadata: { visibility: 'private' },
        }],
      });

      const response = await handleConversations(mockEvent('conv-1'), corsHeaders);
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('do not have permission');
    });

    it('should allow anyone to view public conversations', async () => {
      // Mock user has no personas
      mockQueryDatabase.mockResolvedValueOnce({ rows: [] });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          title: 'Public Discussion',
          participants: [{ personaId: 'persona-99' }],
          metadata: { visibility: 'public' },
        }],
      });

      const response = await handleConversations(mockEvent('conv-1'), corsHeaders);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.conversation.id).toBe('conv-1');
    });

    it('should include permissions in response', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          title: 'Test Conversation',
          participants: [{ personaId: 'persona-1' }],
          metadata: { visibility: 'public' },
          status: 'active',
          can_add_messages: true,
          initiator_persona_id: 'persona-1',
        }],
      });

      const response = await handleConversations(mockEvent('conv-1'), corsHeaders);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.permissions).toBeDefined();
      expect(body.permissions.canView).toBe(true);
      expect(body.permissions.canClose).toBe(true);
    });
  });

  describe('POST /conversations/:id/messages', () => {
    const mockEvent = (conversationId: string, personaId: string, user: UserContext = mockUser): AuthenticatedEvent => ({
      httpMethod: 'POST',
      path: `/api/conversations/${conversationId}/messages`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaId,
        content: 'Test message',
      }),
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

    it('should allow participants to post messages with owned personas', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          participants: [
            { personaId: 'persona-1' },
            { personaId: 'persona-2' },
          ],
          metadata: { visibility: 'private' },
          status: 'active',
          can_add_messages: true,
        }],
      });

      // Mock sequence number query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ next_sequence: 1 }],
      });

      // Mock message insertion
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'msg-1', content: 'Test message' }],
      });

      // Mock conversation stats update
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [],
      });

      const response = await handleConversations(mockEvent('conv-1', 'persona-1'), corsHeaders);
      expect(response.statusCode).toBe(201);
    });

    it('should deny posting with unowned personas', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          participants: [
            { personaId: 'persona-1' },
            { personaId: 'persona-2' },
          ],
          metadata: { visibility: 'private' },
          status: 'active',
          can_add_messages: true,
        }],
      });

      const response = await handleConversations(mockEvent('conv-1', 'persona-2'), corsHeaders);
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('User does not own this persona');
    });

    it('should deny non-participants from posting', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          participants: [
            { personaId: 'persona-99' },
            { personaId: 'persona-100' },
          ],
          metadata: { visibility: 'private' },
          status: 'active',
          can_add_messages: true,
        }],
      });

      const response = await handleConversations(mockEvent('conv-1', 'persona-1'), corsHeaders);
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('not a participant in this conversation');
    });

    it('should deny posting to closed conversations', async () => {
      // Mock user's personas
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{ id: 'persona-1', owner_id: 'user-1' }],
      });

      // Mock conversation query
      mockQueryDatabase.mockResolvedValueOnce({
        rows: [{
          id: 'conv-1',
          participants: [{ personaId: 'persona-1' }],
          metadata: { visibility: 'private' },
          status: 'completed',
          can_add_messages: false,
        }],
      });

      const response = await handleConversations(mockEvent('conv-1', 'persona-1'), corsHeaders);
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('closed for new messages');
    });
  });
});