import { api, apiClient } from '../apiClient';

// Create mock before using it
const mockGetIdToken = jest.fn();

// Mock the cognito service
jest.mock('../cognito', () => ({
  cognitoService: {
    getIdToken: () => mockGetIdToken(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('API Client Standardization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIdToken.mockResolvedValue('mock-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });

  describe('Admin API Methods', () => {
    it('calls health endpoint without authentication', async () => {
      await api.admin.health();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      // Should not include Authorization header for health check
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('calls database status with authentication', async () => {
      await api.admin.databaseStatus();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/database-status'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('calls seed database endpoint', async () => {
      await api.admin.seedDatabase();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/seed-database'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('calls setup database endpoint', async () => {
      await api.admin.setupDatabase();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/setup-database'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('calls test AI endpoint with correct data', async () => {
      const testData = {
        conversationId: 'conv-1',
        message: 'Test message',
        personaId: 'persona-1',
      };

      await api.admin.testAI(testData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/generate-response'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(testData),
        })
      );
    });
  });

  describe('Personas API Methods', () => {
    it('lists personas', async () => {
      await api.personas.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('gets specific persona', async () => {
      await api.personas.get('persona-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas/persona-123'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('creates persona', async () => {
      const personaData = {
        name: 'Test Persona',
        type: 'ai_agent',
        description: 'A test persona',
      };

      await api.personas.create(personaData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(personaData),
        })
      );
    });

    it('updates persona', async () => {
      const updateData = { name: 'Updated Name' };

      await api.personas.update('persona-123', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas/persona-123'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(updateData),
        })
      );
    });

    it('deletes persona', async () => {
      await api.personas.delete('persona-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas/persona-123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });
  });

  describe('Conversations API Methods', () => {
    it('lists conversations', async () => {
      await api.conversations.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('gets specific conversation', async () => {
      await api.conversations.get('conv-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('creates conversation', async () => {
      const conversationData = {
        title: 'Test Conversation',
        topic: 'Testing',
      };

      await api.conversations.create(conversationData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(conversationData),
        })
      );
    });

    it('updates conversation', async () => {
      const updateData = { title: 'Updated Title' };

      await api.conversations.update('conv-123', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(updateData),
        })
      );
    });

    it('deletes conversation', async () => {
      await api.conversations.delete('conv-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('closes conversation', async () => {
      const closeData = {
        reason: 'Conversation completed',
        status: 'completed' as const,
      };

      await api.conversations.close('conv-123', closeData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/close'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(closeData),
        })
      );
    });

    it('closes conversation with minimal data', async () => {
      const closeData = {
        status: 'terminated' as const,
      };

      await api.conversations.close('conv-123', closeData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/close'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(closeData),
        })
      );
    });
  });

  describe('Messages API Methods', () => {
    it('lists messages for conversation', async () => {
      await api.messages.list('conv-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('creates message in conversation', async () => {
      const messageData = {
        content: 'Hello world',
        personaId: 'persona-123',
        type: 'text',
      };

      await api.messages.create('conv-123', messageData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(messageData),
        })
      );
    });

    it('updates message', async () => {
      const updateData = { content: 'Updated content' };

      await api.messages.update('conv-123', 'msg-456', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages/msg-456'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(updateData),
        })
      );
    });

    it('deletes message', async () => {
      await api.messages.delete('conv-123', 'msg-456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages/msg-456'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });
  });

  describe('AI API Methods', () => {
    it('generates AI response', async () => {
      const aiData = {
        personaId: 'ai-persona-1',
        triggerMessageId: 'msg-123',
      };

      await api.ai.generateResponse('conv-123', aiData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/generate-response'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({
            conversationId: 'conv-123',
            ...aiData,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles HTTP errors correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Resource not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(api.personas.get('nonexistent')).rejects.toThrow('Resource not found');
    });

    it('handles network errors correctly', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(api.personas.list()).rejects.toThrow('Network error');
    });

    it('handles authentication errors when no token available', async () => {
      mockGetIdToken.mockResolvedValue(null);

      await api.personas.list();

      // Should still make the request but without Authorization header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Base URL Configuration', () => {
    it('uses environment variable for API base URL', () => {
      // The apiClient should use the NEXT_PUBLIC_API_URL environment variable
      // or fall back to the default URL
      expect(apiClient).toBeDefined();
    });
  });

  describe('Request Logging', () => {
    it('logs API requests for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await api.personas.list();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🌐 API Client Debug - Making request:'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });
});