import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
      create: jest.fn(),
    },
    ai: {
      generateResponse: jest.fn(),
    },
  },
}));

// Mock the MessageList component
jest.mock('../MessageList', () => ({
  MessageList: ({ messages, typingPersonas }: { messages: any[]; participants: any[]; typingPersonas: Set<string> }) => (
    <div data-testid="message-list">
      <div data-testid="message-count">{messages.length}</div>
      {typingPersonas.size > 0 && <div data-testid="typing-indicator">Someone is typing...</div>}
    </div>
  ),
}));

// Mock the MessageInput component
jest.mock('../MessageInput', () => ({
  MessageInput: ({ onSendMessage, conversationStatus }: { onSendMessage: (message: string) => void; conversationStatus: string }) => (
    <div data-testid="message-input">
      <button 
        onClick={() => onSendMessage('Test message')}
        disabled={conversationStatus !== 'active'}
      >
        Send Message
      </button>
    </div>
  ),
}));

// Mock AI orchestrator
jest.mock('@/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    analyzeResponseTriggers: jest.fn().mockResolvedValue([
      {
        personaId: 'ai-persona-1',
        priority: 1,
        reason: 'Direct mention',
        suggestedDelay: 1000,
      },
    ]),
  },
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
      personaName: 'Human User',
      personaType: 'human',
      isRevealed: true,
      role: 'initiator',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    },
    {
      personaId: 'ai-persona-1',
      personaName: 'AI Assistant',
      personaType: 'ai_agent',
      isRevealed: false,
      role: 'responder',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    },
  ],
  messageCount: 2,
  currentTurn: 2,
  createdAt: new Date(),
  topicTags: ['testing'],
  totalCharacters: 100,
  averageResponseTime: 2000,
  createdBy: 'user-1',
  constraints: {
    maxMessages: undefined,
    maxDuration: undefined,
    allowedTopics: ['testing'],
    endConditions: [],
  },
};

const mockMessages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    authorPersonaId: 'persona-1',
    content: 'Hello there!',
    type: 'text',
    timestamp: new Date(),
    sequenceNumber: 1,
    isEdited: false,
    metadata: {},
    moderationStatus: 'approved',
    isVisible: true,
    isArchived: false,
  },
];

describe('ConversationView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders conversation details after loading', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.personas.get as jest.Mock).mockImplementation((personaId) => {
      const persona = mockConversation.participants.find(p => p.personaId === personaId);
      return Promise.resolve({
        success: true,
        persona: {
          name: persona?.personaName,
          type: persona?.personaType,
        },
      });
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: mockMessages,
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('A test conversation')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('Human User')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });
  });

  it('fetches data using standardized API calls', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: mockMessages,
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(api.conversations.get).toHaveBeenCalledWith('conv-1');
      expect(api.personas.get).toHaveBeenCalledTimes(2); // Once for each participant
      expect(api.messages.list).toHaveBeenCalledWith('conv-1');
    });
  });

  it('handles conversation not found', async () => {
    (api.conversations.get as jest.Mock).mockRejectedValue(new Error('Not found'));

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversation')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Back to Conversations')).toBeInTheDocument();
    });
  });

  it('handles invalid conversation ID', async () => {
    render(<ConversationView conversationId="undefined" />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversation')).toBeInTheDocument();
      expect(screen.getByText('Invalid conversation ID')).toBeInTheDocument();
    });
  });

  it('sends message using standardized API call', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: mockMessages,
    });

    (api.messages.create as jest.Mock).mockResolvedValue({
      messageId: 'new-msg-id',
    });

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    // Send a message
    fireEvent.click(screen.getByText('Send Message'));

    // Verify that the standardized API call was made
    await waitFor(() => {
      expect(api.messages.create).toHaveBeenCalledWith('conv-1', {
        content: 'Test message',
        personaId: 'persona-1', // First human participant
        type: 'text',
      });
    });

    // The main goal of this test is API standardization, which is verified above
    // AI response generation is a separate concern tested in other tests
  });

  it('handles message sending errors', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: mockMessages,
    });

    (api.messages.create as jest.Mock).mockRejectedValue(new Error('Failed to send'));

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    // Send a message
    fireEvent.click(screen.getByText('Send Message'));

    await waitFor(() => {
      expect(api.messages.create).toHaveBeenCalled();
      // Should show message count as 1 (original message was removed due to error)
      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    });
  });

  it('polls for new messages using standardized API call', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    // Initial messages call
    (api.messages.list as jest.Mock).mockResolvedValueOnce({
      success: true,
      messages: mockMessages,
    });

    // Polling call with new message
    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [
        ...mockMessages,
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          authorPersonaId: 'ai-persona-1',
          content: 'New message!',
          type: 'text',
          timestamp: new Date(),
          sequenceNumber: 2,
          isEdited: false,
          metadata: {},
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false,
        },
      ],
    });

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
    });

    // Fast-forward to trigger polling
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(api.messages.list).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    });
  });

  it('handles AI response generation with typing indicator', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: mockMessages,
    });

    (api.messages.create as jest.Mock).mockResolvedValue({
      messageId: 'new-msg-id',
    });

    (api.ai.generateResponse as jest.Mock).mockImplementation(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            message: {
              id: 'ai-msg-1',
              content: 'AI response',
              timestamp: new Date().toISOString(),
              sequenceNumber: 3,
              metadata: {},
            },
          });
        }, 1000);
      })
    );

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    // Send a message
    fireEvent.click(screen.getByText('Send Message'));

    // Fast-forward to show typing indicator
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    // Fast-forward to complete AI response
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.conversations.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ConversationView conversationId="conv-1" />);

    expect(screen.getByText('Loading conversation...')).toBeInTheDocument();
  });

  it('disables message input for non-active conversations', async () => {
    const closedConversation = {
      ...mockConversation,
      status: 'completed',
    };

    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: closedConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: mockMessages,
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('Send Message')).toBeDisabled();
    });
  });
});