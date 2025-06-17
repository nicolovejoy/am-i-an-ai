import { apiClient, api } from '../apiClient';
import { cognitoService } from '../cognito';

// Mock the cognito service
jest.mock('../cognito', () => ({
  cognitoService: {
    getIdToken: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Authentication Header Handling', () => {
    it('should add Authorization header when token is available', async () => {
      const mockToken = 'mock-jwt-token';
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: 'test' }),
      });

      await apiClient.get('/api/test');

      expect(cognitoService.getIdToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not add Authorization header when token is unavailable', async () => {
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue(null);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      await apiClient.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });

    it('should skip auth header when skipAuth option is true', async () => {
      const mockToken = 'mock-jwt-token';
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      await apiClient.get('/api/test', { skipAuth: true });

      expect(cognitoService.getIdToken).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });

    it('should handle auth token retrieval errors gracefully', async () => {
      (cognitoService.getIdToken as jest.Mock).mockRejectedValue(new Error('Auth error'));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      await apiClient.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('HTTP Methods', () => {
    const mockToken = 'mock-jwt-token';
    
    beforeEach(() => {
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue(mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: 'test' }),
      });
    });

    it('should make GET requests correctly', async () => {
      await apiClient.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should make POST requests with body', async () => {
      const body = { test: 'data' };
      await apiClient.post('/api/test', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make PUT requests with body', async () => {
      const body = { update: 'data' };
      await apiClient.put('/api/test/123', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should make DELETE requests', async () => {
      await apiClient.delete('/api/test/123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should make PATCH requests with body', async () => {
      const body = { patch: 'data' };
      await apiClient.patch('/api/test/123', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-ok responses with JSON error', async () => {
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue('token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ error: 'Bad request', message: 'Invalid data' }),
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow('Bad request');
    });

    it('should throw error for non-ok responses with text error', async () => {
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue('token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'text/plain']]),
        text: async () => 'Internal server error',
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow('Request failed with status 500');
    });

    it('should handle network errors', async () => {
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue('token');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      await expect(apiClient.get('/api/test')).rejects.toThrow('Network failure');
    });
  });

  describe('API Convenience Methods', () => {
    beforeEach(() => {
      (cognitoService.getIdToken as jest.Mock).mockResolvedValue('token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });
    });

    it('should call conversations endpoints correctly', async () => {
      await api.conversations.list();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations'),
        expect.any(Object)
      );

      await api.conversations.get('123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/123'),
        expect.any(Object)
      );

      await api.conversations.create({ title: 'Test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Test' }),
        })
      );
    });

    it('should call messages endpoints correctly', async () => {
      await api.messages.list('conv-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages'),
        expect.any(Object)
      );

      await api.messages.create('conv-123', { content: 'Hello' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Hello' }),
        })
      );
    });

    it('should call personas endpoints correctly', async () => {
      await api.personas.list();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas'),
        expect.any(Object)
      );

      await api.personas.get('persona-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas/persona-123'),
        expect.any(Object)
      );
    });

    it('should call admin endpoints correctly', async () => {
      await api.admin.databaseStatus();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/database-status'),
        expect.any(Object)
      );

      await api.admin.health();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });
});