import { render, screen } from '@testing-library/react';
import MessageBubble from '../MessageBubble';

describe('MessageBubble', () => {
  describe('Player Names', () => {
    it('should display "Ashley" for identity A', () => {
      render(
        <MessageBubble sender="A">
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('Ashley')).toBeInTheDocument();
    });

    it('should display "Brianna" for identity B', () => {
      render(
        <MessageBubble sender="B">
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('Brianna')).toBeInTheDocument();
    });

    it('should display "Chloe" for identity C', () => {
      render(
        <MessageBubble sender="C">
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('Chloe')).toBeInTheDocument();
    });

    it('should display "David" for identity D', () => {
      render(
        <MessageBubble sender="D">
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('David')).toBeInTheDocument();
    });

    it('should display "You" for sender "You"', () => {
      render(
        <MessageBubble sender="You">
          Test message
        </MessageBubble>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('Color Styling', () => {
    it('should apply blue styling for identity A', () => {
      const { container } = render(
        <MessageBubble sender="A">
          Test message
        </MessageBubble>
      );
      const bubble = container.firstChild;
      expect(bubble).toHaveClass('bg-blue-100', 'border-blue-300');
    });

    it('should apply green styling for identity B', () => {
      const { container } = render(
        <MessageBubble sender="B">
          Test message
        </MessageBubble>
      );
      const bubble = container.firstChild;
      expect(bubble).toHaveClass('bg-green-100', 'border-green-300');
    });

    it('should apply pink styling for identity C', () => {
      const { container } = render(
        <MessageBubble sender="C">
          Test message
        </MessageBubble>
      );
      const bubble = container.firstChild;
      expect(bubble).toHaveClass('bg-pink-100', 'border-pink-300');
    });

    it('should apply fuchsia styling for identity D', () => {
      const { container } = render(
        <MessageBubble sender="D">
          Test message
        </MessageBubble>
      );
      const bubble = container.firstChild;
      expect(bubble).toHaveClass('bg-fuchsia-100', 'border-fuchsia-300');
    });

    it('should apply gray styling for "You"', () => {
      const { container } = render(
        <MessageBubble sender="You">
          Test message
        </MessageBubble>
      );
      const bubble = container.firstChild;
      expect(bubble).toHaveClass('bg-gray-100', 'border-gray-300');
    });
  });

  describe('Timestamp Display', () => {
    it('should display timestamp when provided', () => {
      const timestamp = new Date('2025-07-02T15:30:00').getTime();
      render(
        <MessageBubble sender="A" timestamp={timestamp}>
          Test message
        </MessageBubble>
      );
      // The actual format depends on locale
      expect(screen.getByText(/3:30/i)).toBeInTheDocument();
    });

    it('should not display timestamp when not provided', () => {
      const { container } = render(
        <MessageBubble sender="A">
          Test message
        </MessageBubble>
      );
      const timestampElement = container.querySelector('.text-xs.text-gray-500');
      expect(timestampElement).not.toBeInTheDocument();
    });
  });

  describe('Message Content', () => {
    it('should display the message content', () => {
      render(
        <MessageBubble sender="A">
          This is a test message
        </MessageBubble>
      );
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    it('should render with correct structure', () => {
      const { container } = render(
        <MessageBubble sender="A">
          Test content
        </MessageBubble>
      );
      const bubble = container.firstChild;
      expect(bubble).toHaveClass('mb-4', 'p-3', 'rounded-lg', 'border-2');
    });
  });
});