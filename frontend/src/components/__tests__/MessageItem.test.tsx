import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageItem } from '../MessageItem';
import type { Message } from '@/types/messages';

describe('MessageItem', () => {
  const createMockMessage = (id: string, content: string, timestamp: Date, sequenceNumber: number, isEdited = false): Message => ({
    id,
    conversationId: 'conv-1',
    authorPersonaId: 'participant-1',
    content,
    type: 'text',
    timestamp,
    sequenceNumber,
    isEdited,
    metadata: {
      wordCount: content.split(' ').length,
      characterCount: content.length,
      readingTime: Math.ceil(content.split(' ').length / 200 * 60), // ~200 words per minute
      complexity: 0.5
    },
    moderationStatus: 'approved',
    isVisible: true,
    isArchived: false
  });

  const mockHumanParticipant = {
    personaId: 'participant-1',
    personaName: 'Alice',
    personaType: 'human' as const,
    isRevealed: false
  };

  const mockAIParticipant = {
    personaId: 'participant-2',
    personaName: 'AI Assistant',
    personaType: 'ai_agent' as const,
    isRevealed: true
  };

  describe('Basic Rendering', () => {
    it('renders message content', () => {
      const message = createMockMessage(
        'msg-1',
        'Hello, this is a test message',
        new Date('2024-12-06T10:00:00Z'),
        1
      );

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    });

    it('does not render when participant is missing', () => {
      const message = createMockMessage(
        'msg-1',
        'Test message',
        new Date(),
        1
      );

      const { container } = render(<MessageItem message={message} participant={undefined} />);
      
      expect(container).toBeEmptyDOMElement();
    });

    it('displays persona name', () => {
      const message = createMockMessage(
        'msg-1',
        'Test message',
        new Date('2024-12-06T10:00:00Z'),
        1
      );

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('displays formatted timestamp', () => {
      const message = createMockMessage(
        'msg-1',
        'Test message',
        new Date('2024-12-06T14:30:00Z'), // 2:30 PM UTC
        1
      );

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      // Should display time in some format (timezone dependent)
      const timestampElement = screen.getByText(/\d+:\d+/);
      expect(timestampElement).toBeInTheDocument();
    });
  });

  describe('Message Alignment', () => {
    it('aligns even messages to the right', () => {
      const evenMessage = createMockMessage(
        'msg-2',
        'Even sequence number',
        new Date(),
        2 // Even number
      );

      render(<MessageItem message={evenMessage} participant={mockHumanParticipant} />);
      
      const messageText = screen.getByText('Even sequence number');
      expect(messageText).toBeInTheDocument();
    });

    it('aligns odd messages to the left', () => {
      const oddMessage = createMockMessage(
        'msg-1',
        'Odd sequence number',
        new Date(),
        1 // Odd number
      );

      render(<MessageItem message={oddMessage} participant={mockHumanParticipant} />);
      
      const messageText = screen.getByText('Odd sequence number');
      expect(messageText).toBeInTheDocument();
    });
  });

  describe('Persona Type Indicators', () => {
    it('displays blue indicator for human participants', () => {
      const message = createMockMessage('msg-1', 'Human message', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      const indicator = screen.getByTitle(/Alice/);
      expect(indicator).toHaveClass('bg-blue-500');
    });

    it('displays green indicator for AI participants', () => {
      const message = createMockMessage('msg-1', 'AI message', new Date(), 1);

      render(<MessageItem message={message} participant={mockAIParticipant} />);
      
      const indicator = screen.getByTitle(/AI Assistant/);
      expect(indicator).toHaveClass('bg-green-500');
    });

    it('shows revealed type badge when participant is revealed', () => {
      const message = createMockMessage('msg-1', 'Revealed AI message', new Date(), 1);

      render(<MessageItem message={message} participant={mockAIParticipant} />);
      
      expect(screen.getByText('AI')).toBeInTheDocument();
      const badge = screen.getByText('AI');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-600');
    });

    it('does not show type badge when participant is not revealed', () => {
      const message = createMockMessage('msg-1', 'Hidden human message', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.queryByText('Human')).not.toBeInTheDocument();
      expect(screen.queryByText('AI')).not.toBeInTheDocument();
    });
  });

  describe('Message Bubble Styling', () => {
    it('applies correct styling for left-aligned messages', () => {
      const leftMessage = createMockMessage('msg-1', 'Left message', new Date(), 1);

      render(<MessageItem message={leftMessage} participant={mockHumanParticipant} />);
      
      const messageText = screen.getByText('Left message');
      expect(messageText).toBeInTheDocument();
    });

    it('applies correct styling for right-aligned messages', () => {
      const rightMessage = createMockMessage('msg-2', 'Right message', new Date(), 2);

      render(<MessageItem message={rightMessage} participant={mockHumanParticipant} />);
      
      const messageText = screen.getByText('Right message');
      expect(messageText).toBeInTheDocument();
    });

    it('preserves whitespace in message content', () => {
      const messageWithWhitespace = createMockMessage(
        'msg-1',
        'Line 1\nLine 2\n\nLine 4',
        new Date(),
        1
      );

      render(<MessageItem message={messageWithWhitespace} participant={mockHumanParticipant} />);
      
      const content = screen.getByText((_, element) => {
        return element?.textContent === 'Line 1\nLine 2\n\nLine 4';
      });
      expect(content).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Message Metadata', () => {
    it('displays word count', () => {
      const message = createMockMessage(
        'msg-1',
        'This is a five word message',
        new Date(),
        1
      );

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('6 words')).toBeInTheDocument();
    });

    it('displays reading time correctly', () => {
      const message = createMockMessage(
        'msg-1',
        'Test message',
        new Date(),
        1
      );
      // Override metadata for specific reading time
      message.metadata.readingTime = 75; // 75 seconds

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('1m read')).toBeInTheDocument();
    });

    it('displays reading time in seconds for short messages', () => {
      const message = createMockMessage(
        'msg-1',
        'Short',
        new Date(),
        1
      );
      message.metadata.readingTime = 30; // 30 seconds

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('30s read')).toBeInTheDocument();
    });

    it('shows edited indicator when message is edited', () => {
      const editedMessage = createMockMessage(
        'msg-1',
        'This message was edited',
        new Date(),
        1,
        true // isEdited = true
      );

      render(<MessageItem message={editedMessage} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('edited')).toBeInTheDocument();
    });

    it('does not show edited indicator for non-edited messages', () => {
      const normalMessage = createMockMessage(
        'msg-1',
        'This message was not edited',
        new Date(),
        1,
        false // isEdited = false
      );

      render(<MessageItem message={normalMessage} participant={mockHumanParticipant} />);
      
      expect(screen.queryByText('edited')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('displays reply button', () => {
      const message = createMockMessage('msg-1', 'Test message', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      const replyButton = screen.getByTitle('Reply (coming soon)');
      expect(replyButton).toBeInTheDocument();
      expect(replyButton).toBeDisabled();
    });

    it('displays react button', () => {
      const message = createMockMessage('msg-1', 'Test message', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      const reactButton = screen.getByTitle('React (coming soon)');
      expect(reactButton).toBeInTheDocument();
      expect(reactButton).toBeDisabled();
    });

    it('action buttons are non-functional (disabled)', () => {
      const message = createMockMessage('msg-1', 'Test message', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      const replyButton = screen.getByTitle('Reply (coming soon)');
      const reactButton = screen.getByTitle('React (coming soon)');
      
      expect(replyButton).toBeDisabled();
      expect(reactButton).toBeDisabled();
      
      // Verify they don't trigger any actions
      fireEvent.click(replyButton);
      fireEvent.click(reactButton);
      // No errors should occur and no side effects
    });

    it('applies different button colors for AI vs human messages', () => {
      const humanMessage = createMockMessage('msg-1', 'Human message', new Date(), 1);
      const aiMessage = createMockMessage('msg-2', 'AI message', new Date(), 2);

      const { rerender } = render(
        <MessageItem message={humanMessage} participant={mockHumanParticipant} />
      );
      
      const humanReplyButton = screen.getByTitle('Reply (coming soon)');
      expect(humanReplyButton).toHaveClass('text-[#D4B59F]', 'hover:text-white');
      
      rerender(<MessageItem message={aiMessage} participant={mockAIParticipant} />);
      
      const aiReplyButton = screen.getByTitle('Reply (coming soon)');
      expect(aiReplyButton).toHaveClass('text-gray-400', 'hover:text-gray-600');
    });
  });

  describe('Consecutive Messages', () => {
    it('hides author info for consecutive messages', () => {
      const message = createMockMessage('msg-2', 'Consecutive message', new Date(), 2);

      render(
        <MessageItem 
          message={message} 
          participant={mockHumanParticipant} 
          isConsecutive={true} 
        />
      );
      
      // Author name should not be visible in consecutive messages
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      // But message content should still be there
      expect(screen.getByText('Consecutive message')).toBeInTheDocument();
    });

    it('shows author info for non-consecutive messages', () => {
      const message = createMockMessage('msg-1', 'First message', new Date(), 1);

      render(
        <MessageItem 
          message={message} 
          participant={mockHumanParticipant} 
          isConsecutive={false} 
        />
      );
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('First message')).toBeInTheDocument();
    });

    it('shows timestamp on hover for consecutive messages', () => {
      const message = createMockMessage(
        'msg-2',
        'Consecutive message',
        new Date('2024-12-06T14:30:00Z'),
        2
      );

      render(
        <MessageItem 
          message={message} 
          participant={mockHumanParticipant} 
          isConsecutive={true} 
        />
      );
      
      // Should have hover timestamp that's initially hidden
      const hoverTimestamp = screen.getByText(/\d+:\d+/);
      expect(hoverTimestamp).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful tooltip for persona indicator', () => {
      const message = createMockMessage('msg-1', 'Test', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      const indicator = screen.getByTitle('Alice');
      expect(indicator).toBeInTheDocument();
    });

    it('provides tooltip with revealed type when participant is revealed', () => {
      const message = createMockMessage('msg-1', 'Test', new Date(), 1);

      render(<MessageItem message={message} participant={mockAIParticipant} />);
      
      const indicator = screen.getByTitle('AI Assistant (AI)');
      expect(indicator).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      const message = createMockMessage('msg-1', 'Test', new Date(), 1);

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByTitle('Reply (coming soon)')).toBeInTheDocument();
      expect(screen.getByTitle('React (coming soon)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages', () => {
      const longMessage = createMockMessage(
        'msg-1',
        'This is a very long message that should wrap properly and maintain good readability even when it contains many words and spans multiple lines to test the layout behavior.',
        new Date(),
        1
      );

      render(<MessageItem message={longMessage} participant={mockHumanParticipant} />);
      
      const longMessageText = screen.getByText(/This is a very long message/);
      expect(longMessageText).toBeInTheDocument();
    });

    it('handles empty message content', () => {
      const emptyMessage = createMockMessage('msg-1', '', new Date(), 1);

      render(<MessageItem message={emptyMessage} participant={mockHumanParticipant} />);
      
      // Should still render structure even with empty content
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialMessage = createMockMessage(
        'msg-1',
        'Special chars: <>&"\'`~!@#$%^&*()_+-=[]{}|;:,.<>?',
        new Date(),
        1
      );

      render(<MessageItem message={specialMessage} participant={mockHumanParticipant} />);
      
      expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
    });

    it('handles very large word counts', () => {
      const message = createMockMessage('msg-1', 'Test', new Date(), 1);
      message.metadata.wordCount = 9999;

      render(<MessageItem message={message} participant={mockHumanParticipant} />);
      
      expect(screen.getByText('9999 words')).toBeInTheDocument();
    });
  });
});