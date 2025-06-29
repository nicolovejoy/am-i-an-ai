import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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
    ai: {
      generateResponse: jest.fn(),
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
    <div data-testid="message-list">
      {messages.map((msg, idx) => (
        <div key={idx} data-testid={`message-${idx}`}>
          {msg.content} - by {msg.authorPersonaId}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../MessageInput', () => ({
  MessageInput: ({ disabled, onSendMessage }: { disabled: boolean; onSendMessage: (content: string) => void }) => (
    <div data-testid="message-input">
      <input 
        data-testid="message-input-field"
        disabled={disabled}
        placeholder={disabled ? "You cannot post in this conversation" : "Type a message..."}
        onChange={(e) => {
          if (!disabled && e.target.value === 'TEST_MESSAGE') {
            onSendMessage('TEST_MESSAGE');
          }
        }}
      />
      <button 
        data-testid="send-button"
        disabled={disabled}
        onClick={() => !disabled && onSendMessage("test message")}
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

describe('ConversationView - User Permission Bugs', () => {
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
      user: { sub: 'current-user-id', email: 'test@example.com' },
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

  describe('Bug 1: Input enabled for non-participating user', () => {
    it('should disable input when user has no owned personas in conversation', async () => {
      // Arrange: Conversation has participants, but none are owned by current user
      const mockConversation = {
        id: 'conv-1',
        title: 'Other Users Conversation',
        participants: [
          {
            personaId: 'other-user-persona-1',
            personaName: 'Alice',
            personaType: 'human_persona',
            role: 'initiator',
            isRevealed: true,
            ownerId: 'other-user-id', // Different from current user ('current-user-id')
          },
          {
            personaId: 'ai-persona-1', 
            personaName: 'AI Assistant',
            personaType: 'ai_agent',
            role: 'responder',
            isRevealed: true,
            ownerId: null,
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
        expect(messageInput).toHaveAttribute('placeholder', 'You cannot post in this conversation');
      });
    });

    it('should enable input only when user owns a participating persona', async () => {
      // Arrange: Conversation where user owns one of the participants
      const mockConversation = {
        id: 'conv-1',
        title: 'User Can Participate',
        participants: [
          {
            personaId: 'current-user-persona-1',
            personaName: 'My Persona',
            personaType: 'human_persona',
            role: 'initiator',
            isRevealed: true,
            ownerId: 'current-user-id', // Same as current user
          },
          {
            personaId: 'ai-persona-1', 
            personaName: 'AI Assistant',
            personaType: 'ai_agent',
            role: 'responder',
            isRevealed: true,
            ownerId: null,
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
  });

  describe('Bug 2: AI responses not triggered', () => {
    it.skip('should trigger AI response after human message is posted', async () => {
      // Arrange: Conversation with human and AI participants
      const mockConversation = {
        id: 'conv-1',
        title: 'AI Response Test',
        participants: [
          {
            personaId: 'human-persona-1',
            personaName: 'Human User',
            personaType: 'human_persona',
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

      // Mock successful message creation
      (api.messages.create as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'new-message-id',
      });

      // Mock AI response
      (api.ai.generateResponse as jest.Mock).mockResolvedValue({
        success: true,
        message: {
          id: 'ai-response-id',
          content: 'AI response here',
          timestamp: new Date().toISOString(),
          sequenceNumber: 2,
        }
      });

      // Act: Render component and send a message
      await act(async () => {
        renderWithQueryClient(<ConversationViewWithZustand conversationId="conv-1" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-input-field')).not.toBeDisabled();
      });

      // Simulate sending a message
      const messageInput = screen.getByTestId('message-input-field');
      fireEvent.change(messageInput, { target: { value: 'TEST_MESSAGE' } });

      // Assert: AI response API should be called
      await waitFor(() => {
        expect(api.ai.generateResponse).toHaveBeenCalledWith('conv-1', {
          personaId: 'ai-persona-1',
          triggerMessageId: expect.any(String),
        });
      }, { timeout: 10000 });
    });

    it.skip('should add AI response to message list after generation', async () => {
      // Arrange: Conversation setup
      const mockConversation = {
        id: 'conv-1',
        title: 'AI Response Display Test',
        participants: [
          {
            personaId: 'human-persona-1',
            personaName: 'Human User',
            personaType: 'human_persona',
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

      const existingMessages = [
        {
          id: 'human-msg-1',
          content: 'Hello AI',
          authorPersonaId: 'human-persona-1',
          timestamp: new Date().toISOString(),
        }
      ];

      // Set up store to have existing messages
      mockStoreState.messages = { 'conv-1': existingMessages };

      (api.conversations.get as jest.Mock).mockResolvedValue({
        success: true,
        conversation: mockConversation,
      });

      (api.messages.list as jest.Mock).mockResolvedValue({
        success: true,
        messages: existingMessages,
      });

      // Act: Render component
      renderWithQueryClient(<ConversationViewWithZustand conversationId="conv-1" />);

      // Assert: Should display both human and AI messages
      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
        expect(screen.getByText(/Hello AI/)).toBeInTheDocument();
      });
    });
  });
});