import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationViewWithZustand } from '../ConversationViewWithZustand';
import { useConversationStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';

// Mock the API client
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

// Mock the store
jest.mock('@/store', () => ({
  useConversationStore: jest.fn(),
}));

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock child components
jest.mock('../MessageList', () => ({
  MessageList: ({ messages }: { messages: any[] }) => (
    <div data-testid="message-list">Messages: {messages.length}</div>
  ),
}));

jest.mock('../MessageInput', () => ({
  MessageInput: ({ disabled, onSendMessage }: { disabled: boolean; onSendMessage: (content: string) => void }) => (
    <div data-testid="message-input">
      <input 
        data-testid="message-input-field"
        disabled={disabled}
        placeholder={disabled ? "Disabled" : "Type a message..."}
      />
      <button 
        data-testid="send-button"
        disabled={disabled}
        onClick={() => onSendMessage("test message")}
      >
        Send
      </button>
    </div>
  ),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ConversationViewWithZustand - Message Input Permissions', () => {
  let queryClient: QueryClient;
  const mockStoreState = {
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
    messageError: null,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    (useConversationStore as unknown as jest.Mock).mockReturnValue(mockStoreState);
    
    // Mock auth context with default user
    (useAuth as jest.Mock).mockReturnValue({
      user: { sub: 'user-123', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it.skip('should enable message input when user has a human participant', async () => {
    // Arrange: Mock conversation with human participant
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      participants: [
        {
          personaId: 'human-persona-1',
          personaName: 'John Doe',
          personaType: 'human',
          role: 'initiator',
          isRevealed: true,
        },
        {
          personaId: 'ai-persona-1', 
          personaName: 'AI Assistant',
          personaType: 'ai_agent',
          role: 'responder',
          isRevealed: true,
        }
      ],
    };

    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    // Act: Render the component
    await act(async () => {
      renderWithQueryClient(<ConversationViewWithZustand conversationId="conv-1" />);
    });

    // Assert: Message input should be enabled
    await waitFor(() => {
      const messageInput = screen.getByTestId('message-input-field');
      const sendButton = screen.getByTestId('send-button');
      
      expect(messageInput).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
      expect(messageInput).toHaveAttribute('placeholder', 'Type a message...');
    });
  });

  it.skip('should disable message input when user has no human participant', async () => {
    // Arrange: Mock conversation with only AI participants (user not participating)
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      participants: [
        {
          personaId: 'ai-persona-1',
          personaName: 'AI Assistant 1',
          personaType: 'ai_agent',
          role: 'initiator',
          isRevealed: true,
        },
        {
          personaId: 'ai-persona-2',
          personaName: 'AI Assistant 2', 
          personaType: 'ai_agent',
          role: 'responder',
          isRevealed: true,
        }
      ],
    };

    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    // Act: Render the component
    await act(async () => {
      renderWithQueryClient(<ConversationViewWithZustand conversationId="conv-1" />);
    });

    // Assert: Message input should be disabled
    await waitFor(() => {
      const messageInput = screen.getByTestId('message-input-field');
      const sendButton = screen.getByTestId('send-button');
      
      expect(messageInput).toBeDisabled();
      expect(sendButton).toBeDisabled();
      expect(messageInput).toHaveAttribute('placeholder', 'Disabled');
    });
  });

  it('should disable message input when participants array is empty', async () => {
    // Arrange: Mock conversation with no participants
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      participants: [],
    };

    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    // Act: Render the component
    await act(async () => {
      renderWithQueryClient(<ConversationViewWithZustand conversationId="conv-1" />);
    });

    // Assert: Message input should be disabled
    await waitFor(() => {
      const messageInput = screen.getByTestId('message-input-field');
      const sendButton = screen.getByTestId('send-button');
      
      expect(messageInput).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  it('should disable message input when personaType is missing but should be human', async () => {
    // Arrange: Mock conversation with participant missing personaType
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      participants: [
        {
          personaId: 'persona-1',
          personaName: 'John Doe',
          // personaType missing - this is the bug we're testing
          role: 'initiator',
          isRevealed: true,
        }
      ],
    };

    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    // Act: Render the component
    await act(async () => {
      renderWithQueryClient(<ConversationViewWithZustand conversationId="conv-1" />);
    });

    // Assert: Message input should be disabled due to missing personaType
    await waitFor(() => {
      const messageInput = screen.getByTestId('message-input-field');
      const sendButton = screen.getByTestId('send-button');
      
      expect(messageInput).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });
});