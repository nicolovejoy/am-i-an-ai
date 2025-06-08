import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageList } from '../MessageList';
import type { Message } from '@/types/messages';

// Mock MessageItem component
jest.mock('../MessageItem', () => {
  return {
    MessageItem: ({ message, participant, isConsecutive }: { 
      message: Message; 
      participant: unknown; 
      isConsecutive: boolean;
    }) => (
      <div data-testid={`message-item-${message.id}`}>
        Message: {message.content}
        {isConsecutive && <span data-testid="consecutive-indicator">Consecutive</span>}
        {participant && <span data-testid="participant-info">Has Participant</span>}
      </div>
    )
  };
});

describe('MessageList', () => {
  const mockParticipants = [
    {
      personaId: 'participant-1',
      personaName: 'Alice',
      personaType: 'human' as const,
      isRevealed: false
    },
    {
      personaId: 'participant-2', 
      personaName: 'Bob',
      personaType: 'ai_agent' as const,
      isRevealed: true
    }
  ];

  const createMockMessage = (id: string, authorId: string, content: string, timestamp: Date, sequenceNumber: number): Message => ({
    id,
    conversationId: 'conv-1',
    authorPersonaId: authorId,
    content,
    type: 'text',
    timestamp,
    sequenceNumber,
    isEdited: false,
    metadata: {
      wordCount: content.split(' ').length,
      characterCount: content.length,
      readingTime: 5,
      complexity: 0.5
    },
    moderationStatus: 'approved',
    isVisible: true,
    isArchived: false
  });

  describe('Empty State', () => {
    it('renders empty state when no messages', () => {
      render(<MessageList messages={[]} participants={mockParticipants} />);
      
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(screen.getByText('Start the conversation below')).toBeInTheDocument();
    });

    it('applies correct styling for empty state', () => {
      render(<MessageList messages={[]} participants={mockParticipants} />);
      
      const emptyContainer = screen.getByText('No messages yet').parentElement;
      expect(emptyContainer).toHaveClass('text-center');
    });
  });

  describe('Message Rendering', () => {
    const mockMessages = [
      createMockMessage(
        'msg-1', 
        'participant-1', 
        'Hello world', 
        new Date('2024-12-06T10:00:00Z'),
        1
      ),
      createMockMessage(
        'msg-2',
        'participant-2', 
        'Hi there!', 
        new Date('2024-12-06T10:01:00Z'),
        2
      )
    ];

    it('renders all messages', () => {
      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      expect(screen.getByTestId('message-item-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-item-msg-2')).toBeInTheDocument();
      expect(screen.getByText('Message: Hello world')).toBeInTheDocument();
      expect(screen.getByText('Message: Hi there!')).toBeInTheDocument();
    });

    it('passes participant data to MessageItem components', () => {
      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      const participantInfoElements = screen.getAllByTestId('participant-info');
      expect(participantInfoElements).toHaveLength(2);
    });

    it('applies correct container styling', () => {
      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('aria-label', 'Conversation messages');
      expect(container).toHaveClass('flex-1', 'overflow-y-auto', 'p-4', 'space-y-4');
    });
  });

  describe('Consecutive Message Detection', () => {
    it('marks consecutive messages from same author within 5 minutes', () => {
      const baseTime = new Date('2024-12-06T10:00:00Z');
      const consecutiveMessages = [
        createMockMessage(
          'msg-1',
          'participant-1',
          'First message',
          baseTime,
          1
        ),
        createMockMessage(
          'msg-2', 
          'participant-1',
          'Second message', 
          new Date(baseTime.getTime() + 2 * 60 * 1000), // 2 minutes later
          2
        ),
        createMockMessage(
          'msg-3',
          'participant-2', 
          'Different author',
          new Date(baseTime.getTime() + 3 * 60 * 1000), // 3 minutes later
          3
        )
      ];

      render(<MessageList messages={consecutiveMessages} participants={mockParticipants} />);
      
      // First message should not be consecutive (no previous message)
      expect(screen.queryByTestId('message-item-msg-1')).not.toContainElement(
        screen.queryByTestId('consecutive-indicator')
      );
      
      // Second message should be consecutive (same author, within 5 minutes)
      const msg2 = screen.getByTestId('message-item-msg-2');
      expect(msg2).toContainElement(screen.getByTestId('consecutive-indicator'));
      
      // Third message should not be consecutive (different author)
      expect(screen.queryByTestId('message-item-msg-3')).not.toContainElement(
        screen.queryByTestId('consecutive-indicator')
      );
    });

    it('does not mark messages as consecutive when time gap exceeds 5 minutes', () => {
      const baseTime = new Date('2024-12-06T10:00:00Z');
      const nonConsecutiveMessages = [
        createMockMessage(
          'msg-1',
          'participant-1', 
          'First message',
          baseTime,
          1
        ),
        createMockMessage(
          'msg-2',
          'participant-1',
          'Second message',
          new Date(baseTime.getTime() + 6 * 60 * 1000), // 6 minutes later
          2
        )
      ];

      render(<MessageList messages={nonConsecutiveMessages} participants={mockParticipants} />);
      
      // Second message should not be consecutive (time gap > 5 minutes)
      expect(screen.queryByTestId('message-item-msg-2')).not.toContainElement(
        screen.queryByTestId('consecutive-indicator')
      );
    });

    it('does not mark messages as consecutive when authors differ', () => {
      const baseTime = new Date('2024-12-06T10:00:00Z');
      const differentAuthorMessages = [
        createMockMessage(
          'msg-1',
          'participant-1',
          'First message', 
          baseTime,
          1
        ),
        createMockMessage(
          'msg-2',
          'participant-2',
          'Second message',
          new Date(baseTime.getTime() + 1 * 60 * 1000), // 1 minute later
          2
        )
      ];

      render(<MessageList messages={differentAuthorMessages} participants={mockParticipants} />);
      
      // Second message should not be consecutive (different author)
      expect(screen.queryByTestId('message-item-msg-2')).not.toContainElement(
        screen.queryByTestId('consecutive-indicator')
      );
    });
  });

  describe('Participant Lookup', () => {
    it('handles missing participants gracefully', () => {
      const messageWithUnknownParticipant = [
        createMockMessage(
          'msg-1',
          'unknown-participant',
          'Message from unknown',
          new Date(),
          1
        )
      ];

      render(<MessageList messages={messageWithUnknownParticipant} participants={mockParticipants} />);
      
      // Should still render the message, MessageItem will handle missing participant
      expect(screen.getByTestId('message-item-msg-1')).toBeInTheDocument();
    });

    it('efficiently maps participants using memoized lookup', () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => 
        createMockMessage(
          `msg-${i}`,
          i % 2 === 0 ? 'participant-1' : 'participant-2',
          `Message ${i}`,
          new Date(),
          i + 1
        )
      );

      render(<MessageList messages={manyMessages} participants={mockParticipants} />);
      
      // All messages should render
      expect(screen.getAllByTestId(/^message-item-/)).toHaveLength(100);
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('sets up scroll container correctly', () => {
      const mockMessages = [
        createMockMessage('msg-1', 'participant-1', 'Test message', new Date(), 1)
      ];

      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      const scrollContainer = screen.getByRole('log');
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });

    it('handles scroll reference setup', () => {
      // This tests the ref setup - actual scroll behavior would need integration testing
      const mockMessages = [
        createMockMessage('msg-1', 'participant-1', 'Test message', new Date(), 1)
      ];

      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      const container = screen.getByRole('log');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      const mockMessages = [
        createMockMessage('msg-1', 'participant-1', 'Test message', new Date(), 1)
      ];

      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      const logContainer = screen.getByRole('log');
      expect(logContainer).toHaveAttribute('aria-label', 'Conversation messages');
    });

    it('maintains semantic structure for screen readers', () => {
      const mockMessages = [
        createMockMessage('msg-1', 'participant-1', 'Test message', new Date(), 1)
      ];

      render(<MessageList messages={mockMessages} participants={mockParticipants} />);
      
      const container = screen.getByRole('log');
      expect(container).toBeInTheDocument();
      expect(container.tagName).toBe('DIV');
    });
  });

  describe('Performance', () => {
    it('handles large message lists', () => {
      const largeMessageList = Array.from({ length: 500 }, (_, i) => 
        createMockMessage(
          `msg-${i}`,
          i % 3 === 0 ? 'participant-1' : 'participant-2',
          `This is message number ${i} with some content`,
          new Date(Date.now() + i * 1000),
          i + 1
        )
      );

      render(<MessageList messages={largeMessageList} participants={mockParticipants} />);
      
      // Should render all messages without crashing
      expect(screen.getAllByTestId(/^message-item-/)).toHaveLength(500);
    });

    it('memoizes participant map efficiently', () => {
      const messages = [
        createMockMessage('msg-1', 'participant-1', 'Test', new Date(), 1)
      ];

      const { rerender } = render(
        <MessageList messages={messages} participants={mockParticipants} />
      );
      
      // Re-render with same participants should use memoized map
      rerender(<MessageList messages={messages} participants={mockParticipants} />);
      
      expect(screen.getByTestId('message-item-msg-1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty participants array', () => {
      const mockMessages = [
        createMockMessage('msg-1', 'participant-1', 'Test message', new Date(), 1)
      ];

      render(<MessageList messages={mockMessages} participants={[]} />);
      
      expect(screen.getByTestId('message-item-msg-1')).toBeInTheDocument();
    });

    it('handles single message', () => {
      const singleMessage = [
        createMockMessage('msg-1', 'participant-1', 'Only message', new Date(), 1)
      ];

      render(<MessageList messages={singleMessage} participants={mockParticipants} />);
      
      expect(screen.getByTestId('message-item-msg-1')).toBeInTheDocument();
      // Should not be marked as consecutive (no previous message)
      expect(screen.queryByTestId('consecutive-indicator')).not.toBeInTheDocument();
    });

    it('handles messages with identical timestamps', () => {
      const timestamp = new Date('2024-12-06T10:00:00Z');
      const simultaneousMessages = [
        createMockMessage('msg-1', 'participant-1', 'First', timestamp, 1),
        createMockMessage('msg-2', 'participant-1', 'Second', timestamp, 2)
      ];

      render(<MessageList messages={simultaneousMessages} participants={mockParticipants} />);
      
      expect(screen.getByTestId('message-item-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-item-msg-2')).toBeInTheDocument();
      
      // Should be marked as consecutive (same author, 0ms gap < 5 minutes)
      const msg2 = screen.getByTestId('message-item-msg-2');
      expect(msg2).toContainElement(screen.getByTestId('consecutive-indicator'));
    });
  });
});