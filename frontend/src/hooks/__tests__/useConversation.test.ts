import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversation } from '../useConversation';
import { api } from '@/services/apiClient';
import { useConversationStore } from '@/store';
import React from 'react';

// Mock dependencies
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

jest.mock('@/store', () => ({
  useConversationStore: jest.fn(),
}));

describe('useConversation', () => {
  let queryClient: QueryClient;
  const mockConversationId = 'test-conv-123';

  const mockStoreFunctions = {
    setActiveConversation: jest.fn(),
    setMessages: jest.fn(),
    addMessage: jest.fn(),
    setLoadingConversation: jest.fn(),
    setLoadingMessages: jest.fn(),
    setSendingMessage: jest.fn(),
    setConversationError: jest.fn(),
    setMessageError: jest.fn(),
    messages: {},
    activeConversation: null,
    sendingMessage: false,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useConversationStore as unknown as jest.Mock).mockReturnValue(mockStoreFunctions);
  });

  describe('Authenticated API Calls', () => {
    it('should fetch conversation with authentication', async () => {
      const mockConversation = {
        id: mockConversationId,
        title: 'Test Conversation',
        participants: [],
      };

      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: mockConversation,
      });

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await waitFor(() => {
        expect(api.conversations.get).toHaveBeenCalledWith(mockConversationId);
        expect(mockStoreFunctions.setActiveConversation).toHaveBeenCalledWith(
          mockConversationId,
          mockConversation
        );
      });
    });

    it('should fetch messages with authentication', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId: mockConversationId,
          authorPersonaId: 'persona-1',
          content: 'Hello',
          timestamp: '2024-01-01T00:00:00Z',
          sequenceNumber: 1,
        },
      ];

      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: { id: mockConversationId },
      });

      (api.messages.list as jest.Mock).mockResolvedValue({
        success: true,
        messages: mockMessages,
      });

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await waitFor(() => {
        expect(api.messages.list).toHaveBeenCalledWith(mockConversationId);
        expect(mockStoreFunctions.setMessages).toHaveBeenCalled();
      });
    });

    it('should send message with authentication', async () => {
      const mockMessage = {
        content: 'Test message',
        personaId: 'persona-1',
      };

      const mockResponse = {
        success: true,
        message: {
          id: 'msg-new',
          ...mockMessage,
        },
      };

      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: { id: mockConversationId },
      });

      (api.messages.create as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await act(async () => {
        result.current.sendMessage(mockMessage);
      });

      await waitFor(() => {
        expect(api.messages.create).toHaveBeenCalledWith(
          mockConversationId,
          expect.objectContaining({
            conversationId: mockConversationId,
            authorPersonaId: mockMessage.personaId,
            content: mockMessage.content,
            type: 'text',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle conversation fetch errors', async () => {
      const errorMessage = 'Authentication failed';
      (api.conversations.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockStoreFunctions.setConversationError).toHaveBeenCalledWith(errorMessage);
        expect(result.current.conversationError).toBeTruthy();
      });
    });

    it('should handle message fetch errors', async () => {
      const errorMessage = 'Failed to fetch messages';
      
      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: { id: mockConversationId },
      });

      (api.messages.list as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockStoreFunctions.setMessageError).toHaveBeenCalledWith(errorMessage);
        expect(result.current.messagesError).toBeTruthy();
      });
    });

    it('should handle send message errors', async () => {
      const errorMessage = 'Failed to send message';
      
      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: { id: mockConversationId },
      });

      (api.messages.create as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await act(async () => {
        result.current.sendMessage({
          content: 'Test',
          personaId: 'persona-1',
        });
      });

      await waitFor(() => {
        expect(mockStoreFunctions.setMessageError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Loading States', () => {
    it('should manage loading states correctly', async () => {
      let resolveConversation: (value: any) => void;
      const conversationPromise = new Promise((resolve) => {
        resolveConversation = resolve;
      });

      (api.conversations.get as jest.Mock).mockReturnValue(conversationPromise);

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      // Should be loading initially
      expect(result.current.isLoadingConversation).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveConversation!({
          success: true,
          conversation: { id: mockConversationId },
        });
      });

      await waitFor(() => {
        expect(result.current.isLoadingConversation).toBe(false);
      });
    });
  });

  describe('Optimistic Updates', () => {
    it('should optimistically add message before API call', async () => {
      const mockStoreFunctionsWithMessages = {
        ...mockStoreFunctions,
        messages: {
          [mockConversationId]: [],
        },
      };

      (useConversationStore as unknown as jest.Mock).mockReturnValue(mockStoreFunctionsWithMessages);

      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: { id: mockConversationId },
      });

      (api.messages.create as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await act(async () => {
        result.current.sendMessage({
          content: 'Optimistic message',
          personaId: 'persona-1',
        });
      });

      // Message should be added optimistically
      expect(mockStoreFunctions.addMessage).toHaveBeenCalledWith(
        mockConversationId,
        expect.objectContaining({
          content: 'Optimistic message',
          authorPersonaId: 'persona-1',
          id: expect.stringContaining('temp-'),
        })
      );
    });
  });

  describe('Polling', () => {
    it('should poll for new messages', async () => {
      jest.useFakeTimers();

      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: { id: mockConversationId },
      });

      (api.messages.list as jest.Mock).mockResolvedValue({
        success: true,
        messages: [],
      });

      renderHook(
        () => useConversation(mockConversationId),
        { wrapper }
      );

      await waitFor(() => {
        expect(api.messages.list).toHaveBeenCalledTimes(1);
      });

      // Fast forward 5 seconds (polling interval)
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(api.messages.list).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });
});