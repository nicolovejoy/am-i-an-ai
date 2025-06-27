import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ConversationView } from '../ConversationView';
import { api } from '@/services/apiClient';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    conversations: {
      get: jest.fn(),
      close: jest.fn(),
    },
    messages: {
      list: jest.fn(),
      create: jest.fn(),
    },
    personas: {
      get: jest.fn(),
    },
  },
}));

// Mock other dependencies
jest.mock('@/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    processMessage: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockApiGet = api.conversations.get as jest.MockedFunction<typeof api.conversations.get>;
const mockMessagesGet = api.messages.list as jest.MockedFunction<typeof api.messages.list>;
const mockPersonasGet = api.personas.get as jest.MockedFunction<typeof api.personas.get>;

describe('ConversationView Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock persona lookups
    mockPersonasGet.mockImplementation((id: string) => {
      const personas: Record<string, any> = {
        'persona-1': { id: 'persona-1', name: 'Alice', type: 'human_persona' },
        'persona-2': { id: 'persona-2', name: 'Bob', type: 'human_persona' },
      };
      return Promise.resolve(personas[id] || { id, name: 'Unknown', type: 'human_persona' });
    });
  });

  const mockConversation = {
    success: true,
    conversation: {
      id: 'conv-1',
      title: 'Test Conversation',
      topic: 'Testing',
      description: 'A test conversation',
      status: 'active' as const,
      participants: [
        { personaId: 'persona-1', role: 'initiator' as const, isRevealed: false, joinedAt: new Date(), lastActiveAt: new Date() },
        { personaId: 'persona-2', role: 'responder' as const, isRevealed: false, joinedAt: new Date(), lastActiveAt: new Date() },
      ],
      messageCount: 0,
      createdAt: new Date(),
      topicTags: [],
      totalCharacters: 0,
      averageResponseTime: 0,
      canAddMessages: true,
      currentTurn: 0,
      createdBy: 'user-1',
      constraints: {
        endConditions: []
      }
    },
  };

  it('should show close button when user has canClose permission', async () => {
    const conversationWithClosePermission = {
      ...mockConversation,
      permissions: {
        canView: true,
        canAddMessage: true,
        canJoin: false,
        canClose: true,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      },
    };

    mockApiGet.mockResolvedValueOnce(conversationWithClosePermission);
    mockMessagesGet.mockResolvedValueOnce({ messages: [] });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Close Conversation')).toBeInTheDocument();
    });
  });

  it('should hide close button when user lacks canClose permission', async () => {
    const conversationWithoutClosePermission = {
      ...mockConversation,
      permissions: {
        canView: true,
        canAddMessage: true,
        canJoin: false,
        canClose: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      },
    };

    mockApiGet.mockResolvedValueOnce(conversationWithoutClosePermission);
    mockMessagesGet.mockResolvedValueOnce({ messages: [] });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close Conversation')).not.toBeInTheDocument();
  });

  it('should enable message input when user has canAddMessage permission', async () => {
    const conversationWithMessagePermission = {
      ...mockConversation,
      permissions: {
        canView: true,
        canAddMessage: true,
        canJoin: false,
        canClose: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      },
    };

    mockApiGet.mockResolvedValueOnce(conversationWithMessagePermission);
    mockMessagesGet.mockResolvedValueOnce({ messages: [] });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      const messageInput = screen.getByPlaceholderText(/Type your message/i);
      expect(messageInput).not.toBeDisabled();
    });
  });

  it('should disable message input when user lacks canAddMessage permission', async () => {
    const conversationWithoutMessagePermission = {
      ...mockConversation,
      permissions: {
        canView: true,
        canAddMessage: false,
        canJoin: false,
        canClose: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      },
    };

    mockApiGet.mockResolvedValueOnce(conversationWithoutMessagePermission);
    mockMessagesGet.mockResolvedValueOnce({ messages: [] });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      const messageInput = screen.getByPlaceholderText(/Type your message/i);
      expect(messageInput).toBeDisabled();
    });
  });

  it('should fall back to canAddMessages field when permissions are not provided', async () => {
    const conversationWithoutPermissions = {
      ...mockConversation,
      // No permissions object provided
    };

    mockApiGet.mockResolvedValueOnce(conversationWithoutPermissions);
    mockMessagesGet.mockResolvedValueOnce({ messages: [] });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      const messageInput = screen.getByPlaceholderText(/Type your message/i);
      expect(messageInput).not.toBeDisabled(); // Should use canAddMessages: true from conversation
    });
  });
});