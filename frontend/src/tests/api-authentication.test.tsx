/**
 * Test suite for API authentication in conversation creation flow
 * This test should validate that authentication headers are properly included
 * in API requests when creating new conversations
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import NewConversationPage from '@/app/conversations/new/page';
import { cognitoService } from '@/services/cognito';
import '@testing-library/jest-dom';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

// Mock fetch to capture API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Authentication in Conversation Creation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Mock authenticated user
    (cognitoService.getCurrentUser as jest.Mock).mockResolvedValue({
      userId: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true,
    });
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue('mock-jwt-token');

    // Default mock responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/personas')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ personas: [] }),
        });
      }
      if (url.includes('/api/conversations')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            conversation: {
              id: 'test-conv-id',
              title: 'Test Conversation',
              created_at: new Date().toISOString(),
            }
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  test('should include authentication headers when fetching personas', async () => {
    renderWithProviders(<NewConversationPage />);

    // Wait for personas to be fetched
    await waitFor(() => {
      const personasCalls = mockFetch.mock.calls.filter(call => 
        call[0].includes('/api/personas')
      );
      expect(personasCalls.length).toBeGreaterThan(0);
    });

    // Check that the personas API call included authentication header
    const personasCall = mockFetch.mock.calls.find(call => 
      call[0].includes('/api/personas')
    );
    expect(personasCall).toBeDefined();
    expect(personasCall[1]).toHaveProperty('headers');
    expect(personasCall[1].headers).toHaveProperty('Authorization');
    expect(personasCall[1].headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  test('should include authentication headers when creating a conversation', async () => {
    renderWithProviders(<NewConversationPage />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText(/Start New Conversation/i)).toBeInTheDocument();
    });

    // Fill in conversation title
    const titleInput = screen.getByLabelText(/Conversation Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Conversation' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Start Conversation/i });
    fireEvent.click(submitButton);

    // Wait for conversation creation API call
    await waitFor(() => {
      const conversationCalls = mockFetch.mock.calls.filter(call => 
        call[0].includes('/api/conversations') && call[1].method === 'POST'
      );
      expect(conversationCalls.length).toBeGreaterThan(0);
    });

    // Check that the conversation creation API call included authentication header
    const conversationCall = mockFetch.mock.calls.find(call => 
      call[0].includes('/api/conversations') && call[1].method === 'POST'
    );
    expect(conversationCall).toBeDefined();
    expect(conversationCall[1]).toHaveProperty('headers');
    expect(conversationCall[1].headers).toHaveProperty('Authorization');
    expect(conversationCall[1].headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  test('should handle 401 errors when authentication token is missing', async () => {
    // Simulate logged out state
    (cognitoService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue(null);

    // Mock 401 response
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });
    });

    renderWithProviders(<NewConversationPage />);

    // Should show error message about authentication
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  test('should handle 401 errors gracefully when token expires', async () => {
    // Mock 401 response for expired token
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Token expired' }),
      });
    });

    renderWithProviders(<NewConversationPage />);

    // Fill in conversation title
    await waitFor(() => {
      expect(screen.getByText(/Start New Conversation/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Conversation Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Conversation' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Start Conversation/i });
    fireEvent.click(submitButton);

    // Should show error message about authentication
    await waitFor(() => {
      expect(screen.getByText(/Failed to create conversation/i)).toBeInTheDocument();
    });
  });

  test('should retry with refreshed token on 401 response', async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call returns 401
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Token expired' }),
        });
      } else {
        // Subsequent calls succeed after token refresh
        return Promise.resolve({
          ok: true,
          json: async () => ({
            conversation: {
              id: 'test-conv-id',
              title: 'Test Conversation',
              created_at: new Date().toISOString(),
            }
          }),
        });
      }
    });

    // Mock token refresh
    let tokenCallCount = 0;
    (cognitoService.getIdToken as jest.Mock).mockImplementation(() => {
      tokenCallCount++;
      if (tokenCallCount === 1) {
        return Promise.resolve('expired-token');
      } else {
        return Promise.resolve('refreshed-token');
      }
    });

    renderWithProviders(<NewConversationPage />);

    // Fill in conversation title
    await waitFor(() => {
      expect(screen.getByText(/Start New Conversation/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Conversation Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Conversation' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Start Conversation/i });
    fireEvent.click(submitButton);

    // Should eventually succeed with refreshed token
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/conversations/test-conv-id');
    });

    // Verify token refresh happened
    expect(cognitoService.getIdToken).toHaveBeenCalledTimes(2);
  });
});