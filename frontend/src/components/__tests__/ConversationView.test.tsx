import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationView } from '../ConversationView';
import { api } from '@/services/apiClient';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    conversations: {
      get: jest.fn(),
    },
    personas: {
      get: jest.fn(),
    },
    messages: {
      list: jest.fn(),
    },
  },
}));

// Mock child components to simplify testing
jest.mock('../MessageList', () => ({
  MessageList: () => <div data-testid="message-list">Messages</div>,
}));

jest.mock('../MessageInput', () => ({
  MessageInput: () => <div data-testid="message-input">Message Input</div>,
}));

jest.mock('../ConversationParticipants', () => ({
  __esModule: true,
  default: () => <div data-testid="conversation-participants">Participants</div>,
}));

jest.mock('../JoinConversationButton', () => ({
  __esModule: true,
  default: () => <div data-testid="join-button">Join</div>,
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockConversation = {
  id: 'conv-1',
  title: 'Test Conversation',
  topic: 'Testing',
  description: 'A test conversation',
  status: 'active',
  participants: [
    {
      personaId: 'persona-1',
      role: 'initiator',
      isRevealed: true,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    },
  ],
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

describe('ConversationView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversation title and basic info', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('A test conversation')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    (api.conversations.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<ConversationView conversationId="conv-1" />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (api.conversations.get as jest.Mock).mockRejectedValue(new Error('Not found'));

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversation')).toBeInTheDocument();
    });
  });

  it('makes correct API calls', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(api.conversations.get).toHaveBeenCalledWith('conv-1');
      expect(api.messages.list).toHaveBeenCalledWith('conv-1');
    });
  });
});