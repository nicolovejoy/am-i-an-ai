/**
 * Test suite for API client authentication
 * This test validates that authentication headers are properly included
 * in all API requests
 */

import { apiClient, api } from '@/services/apiClient';
import { cognitoService } from '@/services/cognito';

// Mock fetch to capture API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ success: true, data: 'test-data' }),
    });
  });


  test('should include authentication headers when token is available', async () => {
    // Mock successful token retrieval
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue('mock-jwt-token');

    await api.personas.list();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/personas'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  test('should include authentication headers when creating a conversation', async () => {
    // Mock successful token retrieval
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue('mock-jwt-token');

    const conversationData = {
      title: 'Test Conversation',
      selectedPersonas: ['persona-1', 'persona-2'],
      createdBy: 'test-user'
    };

    await api.conversations.create(conversationData);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(conversationData),
      })
    );
  });

  test('should make requests without auth headers when token is not available', async () => {
    // Mock no token available
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue(null);

    await api.personas.list();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/personas'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Should NOT include Authorization header
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers).not.toHaveProperty('Authorization');
  });

  test('should handle 401 errors gracefully when token expires', async () => {
    // Mock token available but expired
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue('expired-token');

    // Mock 401 response for expired token
    mockFetch.mockRejectedValue(new Error('Request failed with status 401'));

    await expect(api.conversations.create({ title: 'Test' })).rejects.toThrow('Request failed with status 401');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer expired-token',
        }),
      })
    );
  });

  test('should skip auth headers for public endpoints', async () => {
    await apiClient.get('/api/health', { skipAuth: true });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/health'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Should NOT include Authorization header even if token is available
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers).not.toHaveProperty('Authorization');
  });

  test('should handle cognito service errors gracefully', async () => {
    // Mock cognito service throwing an error
    (cognitoService.getIdToken as jest.Mock).mockRejectedValue(new Error('Cognito error'));

    await api.personas.list();

    // Should still make the request without auth headers
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/personas'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Should NOT include Authorization header when cognito fails
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers).not.toHaveProperty('Authorization');
  });
});