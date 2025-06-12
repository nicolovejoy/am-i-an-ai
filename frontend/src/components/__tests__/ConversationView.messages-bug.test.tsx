import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationView } from '../ConversationView';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock child components
jest.mock('../MessageList', () => ({
  MessageList: ({ messages }: { messages: Array<Record<string, unknown>> }) => (
    <div data-testid="message-list">
      <div data-testid="message-count">{messages.length}</div>
      {messages.map((msg) => (
        <div key={msg.id as string} data-testid={`message-${msg.id as string}`}>
          {msg.content as string}
        </div>
      ))}
    </div>
  )
}));

jest.mock('../MessageInput', () => ({
  MessageInput: () => <div data-testid="message-input">MessageInput</div>
}));

jest.mock('../LoadingSpinner', () => ({
  FullPageLoader: ({ text }: { text: string }) => (
    <div data-testid="loading-spinner">{text}</div>
  )
}));

// Mock AI orchestrator
jest.mock('@/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    generateResponse: jest.fn()
  }
}));

// Setup fetch mock
global.fetch = jest.fn();

describe('ConversationView - Message Bug Detection', () => {
  const mockConversationId = 'test-conv-123';
  const API_URL = 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = API_URL;
  });

  it('FAILING TEST: Should display messages when messageCount > 0 but API returns empty', async () => {
    // This test simulates the bug: conversation shows messageCount=12 but messages API returns empty
    const mockConversation = {
      success: true,
      conversation: {
        id: mockConversationId,
        title: 'Conversation with Missing Messages',
        topic: 'Bug demonstration',
        description: 'This conversation shows the bug',
        status: 'active',
        participants: [
          {
            personaId: 'persona-1',
            role: 'initiator',
            joinedAt: '2025-01-06T10:00:00Z'
          }
        ],
        messageCount: 12, // Backend says there are 12 messages
        createdAt: '2025-01-06T10:00:00Z'
      }
    };

    const mockPersona = {
      success: true,
      persona: {
        id: 'persona-1',
        name: 'Test User',
        type: 'human'
      }
    };

    // But messages API returns empty array - this is the bug!
    const mockEmptyMessages = {
      success: true,
      messages: [] // Empty despite messageCount being 12
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPersona
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyMessages
      });

    render(<ConversationView conversationId={mockConversationId} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Verify conversation loaded
    expect(screen.getByText('Conversation with Missing Messages')).toBeInTheDocument();

    // Verify messages were fetched from the API
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/conversations/${mockConversationId}/messages`,
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    );

    // BUG: This shows 0 messages even though messageCount is 12
    const messageCountElement = screen.getByTestId('message-count');
    expect(messageCountElement).toHaveTextContent('0');

    // This indicates the bug - no messages are displayed
    // Expected behavior: Either display actual messages or show an error
    // Current behavior: Shows empty conversation despite messageCount > 0
  });

  it('PASSING TEST: Should display messages when API returns them correctly', async () => {
    const mockConversation = {
      success: true,
      conversation: {
        id: mockConversationId,
        title: 'Working Conversation',
        topic: 'Normal case',
        description: 'This conversation works correctly',
        status: 'active',
        participants: [
          {
            personaId: 'persona-1',
            role: 'initiator',
            joinedAt: '2025-01-06T10:00:00Z'
          }
        ],
        messageCount: 2,
        createdAt: '2025-01-06T10:00:00Z'
      }
    };

    const mockPersona = {
      success: true,
      persona: {
        id: 'persona-1',
        name: 'Test User',
        type: 'human'
      }
    };

    // Messages API returns correct data
    const mockMessages = {
      success: true,
      messages: [
        {
          id: 'msg-1',
          conversationId: mockConversationId,
          authorPersonaId: 'persona-1',
          content: 'Hello world',
          type: 'text',
          timestamp: '2025-01-06T10:00:00Z',
          sequenceNumber: 1,
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-2',
          conversationId: mockConversationId,
          authorPersonaId: 'persona-1',
          content: 'Second message',
          type: 'text',
          timestamp: '2025-01-06T10:01:00Z',
          sequenceNumber: 2,
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        }
      ]
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPersona
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessages
      });

    render(<ConversationView conversationId={mockConversationId} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // This should work correctly
    const messageCountElement = screen.getByTestId('message-count');
    expect(messageCountElement).toHaveTextContent('2');

    // Messages should be displayed
    expect(screen.getByTestId('message-msg-1')).toHaveTextContent('Hello world');
    expect(screen.getByTestId('message-msg-2')).toHaveTextContent('Second message');
  });

  it('DIAGNOSTIC: Check API calls are made in correct order', async () => {
    const mockConversation = {
      success: true,
      conversation: {
        id: mockConversationId,
        title: 'API Order Test',
        status: 'active',
        participants: [{ personaId: 'persona-1', role: 'initiator' }],
        messageCount: 5,
        createdAt: '2025-01-06T10:00:00Z'
      }
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, persona: { id: 'persona-1', name: 'Test' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, messages: [] })
      });

    render(<ConversationView conversationId={mockConversationId} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Verify the correct sequence of API calls
    const fetchCalls = (global.fetch as jest.Mock).mock.calls;
    
    // Should call conversation API first
    expect(fetchCalls[0][0]).toContain(`/api/conversations/${mockConversationId}`);
    expect(fetchCalls[0][0]).not.toContain('/messages');
    
    // Should call persona API second
    expect(fetchCalls[1][0]).toContain('/api/personas/persona-1');
    
    // Should call messages API last
    expect(fetchCalls[2][0]).toContain(`/api/conversations/${mockConversationId}/messages`);
    
    // All calls should use GET method
    fetchCalls.forEach(call => {
      expect(call[1]?.method).toBe('GET');
    });
  });
});