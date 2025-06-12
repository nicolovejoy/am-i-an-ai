import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  MessageList: ({ messages }: { messages: unknown[] }) => (
    <div data-testid="message-list">
      {(messages as Record<string, unknown>[]).map((msg: Record<string, unknown>) => (
        <div key={msg.id as string} data-testid={`message-${msg.id}`}>
          {msg.content as string}
        </div>
      ))}
    </div>
  )
}));

jest.mock('../MessageInput', () => ({
  MessageInput: ({ onSendMessage }: { onSendMessage: (content: string) => Promise<void> }) => (
    <div data-testid="message-input">
      <button onClick={() => onSendMessage('test message')}>Send</button>
    </div>
  )
}));

jest.mock('../LoadingSpinner', () => ({
  FullPageLoader: ({ text }: { text: string }) => (
    <div data-testid="loading-spinner">{text}</div>
  )
}));

// Setup fetch mock
global.fetch = jest.fn();

describe('ConversationView API Integration', () => {
  const mockConversationId = '770e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';
  });

  describe('Loading Conversation Data', () => {

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.getByText(/error loading conversation/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 not found responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Conversation not found' })
      });

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.getByText(/conversation not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading Messages', () => {
    it('should fetch messages from Lambda API after loading conversation', async () => {
      // Mock conversation response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            conversation: {
              id: mockConversationId,
              title: 'Test Conversation',
              status: 'active',
              participants: []
            }
          })
        })
        // Mock personas responses (if needed)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'test', name: 'Test' } })
        });

      // Mock messages response
      const mockMessages = {
        success: true,
        messages: [
          {
            id: 'msg-1',
            conversationId: mockConversationId,
            authorPersonaId: 'persona-1',
            content: 'Hello, this is a test message',
            timestamp: new Date().toISOString(),
            type: 'text'
          },
          {
            id: 'msg-2',
            conversationId: mockConversationId,
            authorPersonaId: 'persona-2',
            content: 'This is a response',
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        ]
      };

      (global.fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url.includes('/messages')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMessages
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      });

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${mockConversationId}/messages`,
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-msg-1')).toHaveTextContent('Hello, this is a test message');
        expect(screen.getByTestId('message-msg-2')).toHaveTextContent('This is a response');
      });
    });

  });

  describe('Message Creation and Persistence', () => {
    beforeEach(() => {
      // Setup default mocks for conversation and messages
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            conversation: {
              id: mockConversationId,
              title: 'Test Chat',
              status: 'active',
              participants: [
                { personaId: 'human-1', role: 'initiator' },
                { personaId: 'ai-1', role: 'responder' }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'human-1', name: 'Human', type: 'human' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'ai-1', name: 'AI Assistant', type: 'ai_agent' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, messages: [] })
        });
    });

    it('should send new message to Lambda API', async () => {
      const newMessage = {
        content: 'test message',
        authorPersonaId: 'human-1'
      };

      const mockCreatedMessage = {
        success: true,
        message: {
          id: 'new-msg-1',
          ...newMessage,
          conversationId: mockConversationId,
          timestamp: new Date().toISOString()
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedMessage
      });

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${mockConversationId}/messages`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('test message')
          })
        );
      });
    });

    it('should update UI optimistically before API response', async () => {
      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      // Message should appear immediately (optimistic update)
      expect(screen.getByText('test message')).toBeInTheDocument();
    });

    it('should handle message creation errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to create message'));

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Response Generation', () => {
    beforeEach(() => {
      // Setup conversation with AI participant
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            conversation: {
              id: mockConversationId,
              title: 'Human-AI Chat',
              status: 'active',
              participants: [
                { personaId: 'human-1', role: 'initiator' },
                { personaId: 'ai-agent-1', role: 'responder' }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'human-1', name: 'Human User', type: 'human' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'ai-agent-1', name: 'AI Assistant', type: 'ai_agent' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, messages: [] })
        });
    });



    it('should handle AI generation errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: { id: '1', content: 'Human message' } })
        })
        .mockRejectedValueOnce(new Error('AI service unavailable'));

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/ai response failed/i)).toBeInTheDocument();
      });
    });

    it('should not trigger AI response when no AI participants', async () => {
      // Override with human-only conversation
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            conversation: {
              id: mockConversationId,
              title: 'Human Only Chat',
              status: 'active',
              participants: [
                { personaId: 'human-1', role: 'initiator' },
                { personaId: 'human-2', role: 'responder' }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'human-1', name: 'Human 1', type: 'human' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, persona: { id: 'human-2', name: 'Human 2', type: 'human' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, messages: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: { id: '1', content: 'Human message' } })
        });

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      // Should NOT call AI generation endpoint
      await waitFor(() => {
        const aiCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[0].includes('/api/ai/generate-response')
        );
        expect(aiCalls).toHaveLength(0);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll for new messages periodically', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            conversation: { id: mockConversationId, title: 'Test', status: 'active', participants: [] }
          })
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, messages: [] })
        });

      render(<ConversationView conversationId={mockConversationId} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Fast-forward time to trigger polling
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        const messageCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[0].includes('/messages')
        );
        expect(messageCalls.length).toBeGreaterThan(1);
      });

      jest.useRealTimers();
    });
  });
});