import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import { PLAYER_CONFIG } from '@/config/playerConfig';

describe('MessageBubble', () => {
  const defaultIdentityMapping = { A: 1, B: 2, C: 3, D: 4 };

  describe('Player Names', () => {
    it('should display "Ashley" for identity A', () => {
      render(
        <MessageBubble sender="A" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('Ashley')).toBeInTheDocument();
    });

    it('should display "Brianna" for identity B', () => {
      render(
        <MessageBubble sender="B" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('Brianna')).toBeInTheDocument();
    });

    it('should display "Chloe" for identity C', () => {
      render(
        <MessageBubble sender="C" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('Chloe')).toBeInTheDocument();
    });

    it('should display "David" for identity D', () => {
      render(
        <MessageBubble sender="D" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('David')).toBeInTheDocument();
    });

    it('should display "You" for current user messages', () => {
      render(
        <MessageBubble sender="A" isCurrentUser={true} identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.queryByText('Ashley')).not.toBeInTheDocument();
    });
  });

  describe('Color Coordination', () => {
    it('should use blue colors for player 1 (identity A)', () => {
      const { container } = render(
        <MessageBubble sender="A" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      expect(bubble).toHaveClass(PLAYER_CONFIG[1].bgColor);
      expect(bubble).toHaveClass(PLAYER_CONFIG[1].borderColor);
    });

    it('should use green colors for player 2 (identity B)', () => {
      const { container } = render(
        <MessageBubble sender="B" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      expect(bubble).toHaveClass(PLAYER_CONFIG[2].bgColor);
      expect(bubble).toHaveClass(PLAYER_CONFIG[2].borderColor);
    });

    it('should use maroon colors for player 3 (identity C)', () => {
      const { container } = render(
        <MessageBubble sender="C" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      expect(bubble).toHaveClass(PLAYER_CONFIG[3].bgColor);
      expect(bubble).toHaveClass(PLAYER_CONFIG[3].borderColor);
    });

    it('should use fuchsia colors for player 4 (identity D)', () => {
      const { container } = render(
        <MessageBubble sender="D" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      expect(bubble).toHaveClass(PLAYER_CONFIG[4].bgColor);
      expect(bubble).toHaveClass(PLAYER_CONFIG[4].borderColor);
    });

    it('should maintain correct colors when identity mapping is different', () => {
      const customMapping = { A: 3, B: 1, C: 4, D: 2 };
      const { container } = render(
        <MessageBubble sender="A" identityMapping={customMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      // A maps to player 3, should use maroon colors
      expect(bubble).toHaveClass(PLAYER_CONFIG[3].bgColor);
      expect(bubble).toHaveClass(PLAYER_CONFIG[3].borderColor);
    });
  });

  describe('User Differentiation', () => {
    it('should align current user messages to the right', () => {
      const { container } = render(
        <MessageBubble sender="A" isCurrentUser={true} identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const messageContainer = container.firstChild;
      expect(messageContainer).toHaveClass('ml-auto');
    });

    it('should not align other player messages to the right', () => {
      const { container } = render(
        <MessageBubble sender="B" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const messageContainer = container.firstChild;
      expect(messageContainer).not.toHaveClass('ml-auto');
    });

    it('should have a bold outline for current user messages', () => {
      const { container } = render(
        <MessageBubble sender="A" isCurrentUser={true} identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      expect(bubble).toHaveClass('ring-2');
      expect(bubble).toHaveClass('ring-slate-400');
    });

    it('should use correct colors for current user based on their identity', () => {
      const { container } = render(
        <MessageBubble sender="B" isCurrentUser={true} identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const bubble = container.querySelector('.border');
      // Current user is B (player 2), should use green colors
      expect(bubble).toHaveClass(PLAYER_CONFIG[2].bgColor);
      expect(bubble).toHaveClass(PLAYER_CONFIG[2].borderColor);
    });
  });

  describe('Timestamp Display', () => {
    it('should display timestamp when provided', () => {
      const timestamp = new Date('2025-07-02T15:30:00').getTime();
      render(
        <MessageBubble sender="A" timestamp={timestamp} identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      // The timestamp format includes leading zero
      expect(screen.getByText('03:30 PM')).toBeInTheDocument();
    });

    it('should not display timestamp when not provided', () => {
      const { container } = render(
        <MessageBubble sender="A" identityMapping={defaultIdentityMapping}>
          Test message
        </MessageBubble>
      );
      const timestampElement = container.querySelector('.text-xs.text-slate-500.mt-1');
      expect(timestampElement).not.toBeInTheDocument();
    });
  });

  describe('Message Content', () => {
    it('should display the message content', () => {
      render(
        <MessageBubble sender="A" identityMapping={defaultIdentityMapping}>
          This is a test message
        </MessageBubble>
      );
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    it('should handle long messages with word breaking', () => {
      const { container } = render(
        <MessageBubble sender="A" identityMapping={defaultIdentityMapping}>
          ThisIsAVeryLongMessageWithoutAnySpacesThatShouldBreakProperly
        </MessageBubble>
      );
      const messageElement = container.querySelector('.break-words');
      expect(messageElement).toBeInTheDocument();
    });
  });
});