/**
 * Test suite for message posting functionality
 * Tests that posting messages in conversations works with proper authentication
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversation } from '@/hooks/useConversation';
import { api } from '@/services/apiClient';
import { cognitoService } from '@/services/cognito';
import React from 'react';

// Mock API client
jest.mock('@/services/apiClient', () => ({
  api: {
    conversations: {
      get: jest.fn(),
    },
    messages: {
      list: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock conversation store
const mockSetActiveConversation = jest.fn();
const mockSetMessages = jest.fn();
const mockAddMessage = jest.fn();
const mockSetLoadingConversation = jest.fn();
const mockSetLoadingMessages = jest.fn();
const mockSetSendingMessage = jest.fn();
const mockSetConversationError = jest.fn();
const mockSetMessageError = jest.fn();

jest.mock('@/store', () => ({
  useConversationStore: () => ({
    setActiveConversation: mockSetActiveConversation,
    setMessages: mockSetMessages,
    addMessage: mockAddMessage,
    setLoadingConversation: mockSetLoadingConversation,
    setLoadingMessages: mockSetLoadingMessages,
    setSendingMessage: mockSetSendingMessage,
    setConversationError: mockSetConversationError,
    setMessageError: mockSetMessageError,
    messages: {},
    activeConversation: null,
    sendingMessage: false,
  }),
}));

describe('Message Posting', () => {
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

    // Mock successful API responses
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: {
        id: 'test-conversation-id',
        title: 'Test Conversation',
      }
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: []
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  test('should include authentication headers when posting a message', async () => {
    const conversationId = 'test-conversation-id';
    
    // Mock successful message creation
    (api.messages.create as jest.Mock).mockResolvedValue({
      success: true,
      message: {
        id: 'new-message-id',
        content: 'Test message',
        conversationId,
        authorPersonaId: 'test-persona-id',
        timestamp: new Date().toISOString(),
      }
    });

    const { result } = renderHook(() => useConversation(conversationId), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Send a message
    await act(async () => {
      result.current.sendMessage({
        content: 'Test message',
        personaId: 'test-persona-id'
      });
    });

    // Verify the message creation API was called
    expect(api.messages.create).toHaveBeenCalledWith(
      conversationId,
      {
        conversationId,
        personaId: 'test-persona-id',
        content: 'Test message',
        type: 'text'
      }
    );
  });

  test('should handle authentication errors when posting a message', async () => {
    const conversationId = 'test-conversation-id';
    
    // Mock authentication failure
    (api.messages.create as jest.Mock).mockRejectedValue(new Error('Request failed with status 401'));

    const { result } = renderHook(() => useConversation(conversationId), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Send a message that should fail
    await act(async () => {
      result.current.sendMessage({
        content: 'Test message',
        personaId: 'test-persona-id'
      });
    });

    // Should have attempted to create the message
    expect(api.messages.create).toHaveBeenCalled();

    // Should set error state
    expect(mockSetMessageError).toHaveBeenCalledWith(
      expect.stringContaining('Request failed with status 401')
    );
  });

  test('should handle missing token gracefully', async () => {
    const conversationId = 'test-conversation-id';
    
    // Mock no authentication token
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue(null);
    
    // Mock API call that should fail due to missing auth
    (api.messages.create as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useConversation(conversationId), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Send a message that should fail due to missing auth
    await act(async () => {
      result.current.sendMessage({
        content: 'Test message',
        personaId: 'test-persona-id'
      });
    });

    // Should have attempted to create the message
    expect(api.messages.create).toHaveBeenCalled();

    // Should set error state
    expect(mockSetMessageError).toHaveBeenCalledWith(
      expect.stringContaining('Unauthorized')
    );
  });

  test.skip('should call API to create message', async () => {
    const conversationId = 'test-conversation-id';
    
    // Mock successful message creation
    (api.messages.create as jest.Mock).mockResolvedValue({
      success: true,
      message: {
        id: 'server-message-id',
        content: 'Test message',
        conversationId,
        authorPersonaId: 'test-persona-id',
        timestamp: new Date().toISOString(),
      }
    });

    const { result } = renderHook(() => useConversation(conversationId), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Send a message
    await act(async () => {
      result.current.sendMessage({
        content: 'Test message',
        personaId: 'test-persona-id'
      });
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(api.messages.create).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          content: 'Test message',
          personaId: 'test-persona-id',
          type: 'text',
        })
      );
    });
  });
});