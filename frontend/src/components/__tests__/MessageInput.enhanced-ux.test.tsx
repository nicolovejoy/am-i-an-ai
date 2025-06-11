import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageInput } from '../MessageInput';

describe('MessageInput Enhanced UX', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cursor Retention After Sending', () => {
    it('should keep focus in input after sending message via Enter key', async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      // Type a message and manually set focus using DOM methods
      fireEvent.change(textarea, { target: { value: 'Hello, this is my first message' } });
      
      // Use act to ensure the focus happens in the test environment
      act(() => {
        textarea.focus();
      });
      
      expect(textarea).toHaveFocus();

      // Send message with Enter key
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      });

      // Wait for message to be sent
      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, this is my first message');
      });

      // Input should be cleared
      expect(textarea).toHaveValue('');
      
      // Wait for focus to be restored
      await waitFor(() => {
        expect(textarea).toHaveFocus();
      });
    });

    it('should keep focus after sending message via send button', async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      const sendButton = screen.getByLabelText('Send message');
      
      // Type a message and focus
      fireEvent.change(textarea, { target: { value: 'Hello via button click' } });
      
      act(() => {
        textarea.focus();
      });
      expect(textarea).toHaveFocus();

      // Click send button
      await act(async () => {
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello via button click');
      });

      // Input should be cleared and still focused
      expect(textarea).toHaveValue('');
      
      await waitFor(() => {
        expect(textarea).toHaveFocus();
      });
    });

    it('should allow immediate typing of next message without clicking', async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      // Send first message
      fireEvent.change(textarea, { target: { value: 'First message' } });
      
      act(() => {
        textarea.focus();
      });
      
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('First message');
      });

      // Should be able to immediately type next message
      fireEvent.change(textarea, { target: { value: 'Second message right away' } });
      expect(textarea).toHaveValue('Second message right away');
      
      // And send it again
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Second message right away');
      });

      // Still focused for potential third message
      await waitFor(() => {
        expect(textarea).toHaveFocus();
      });
    });

    it('should maintain focus even when message sending fails', async () => {
      mockOnSendMessage.mockRejectedValue(new Error('Network error'));

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      fireEvent.change(textarea, { target: { value: 'This will fail' } });
      
      act(() => {
        textarea.focus();
      });
      
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('This will fail');
      });

      // Even on error, focus should be maintained for retry
      await waitFor(() => {
        expect(textarea).toHaveFocus();
      });
    });

    it('should not lose focus during message sending loading state', async () => {
      // Simulate a slow API call
      let resolvePromise: (value: unknown) => void;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockOnSendMessage.mockReturnValue(slowPromise);

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      fireEvent.change(textarea, { target: { value: 'Slow message' } });
      
      act(() => {
        textarea.focus();
      });
      
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      });

      // During loading, focus should be maintained
      expect(textarea).toHaveFocus();
      
      // Resolve the promise
      resolvePromise!(undefined);
      
      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Slow message');
      });

      // After completion, focus should still be there
      await waitFor(() => {
        expect(textarea).toHaveFocus();
      });
    });
  });

  describe('Multi-line Message Support with Focus Retention', () => {
    it('should handle Shift+Enter for new lines without sending or losing focus', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      act(() => {
        textarea.focus();
      });
      
      fireEvent.change(textarea, { target: { value: 'Line 1' } });

      // Shift+Enter should add new line, not send
      fireEvent.keyDown(textarea, { 
        key: 'Enter', 
        code: 'Enter', 
        shiftKey: true 
      });

      // Should not have sent message
      expect(mockOnSendMessage).not.toHaveBeenCalled();
      
      // Should still have focus
      expect(textarea).toHaveFocus();

      // Should allow typing on new line
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('should send multi-line message with Enter and retain focus', async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      act(() => {
        textarea.focus();
      });
      
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });

      // Regular Enter should send the multi-line message
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Line 1\nLine 2\nLine 3');
      });

      expect(textarea).toHaveValue('');
      
      await waitFor(() => {
        expect(textarea).toHaveFocus();
      });
    });
  });

  describe('Auto-Focus on Mount', () => {
    it('should automatically focus the message input when component mounts', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      // Should be focused immediately after mount
      expect(textarea).toHaveFocus();
    });

    it('should not auto-focus when conversation is not active', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="paused"
        />
      );

      const textarea = screen.getByPlaceholderText('Cannot send messages');
      
      // Should not be focused when disabled
      expect(textarea).not.toHaveFocus();
    });

    it('should auto-focus even when disabled prop is false', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
          disabled={false}
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      // Should be focused when explicitly not disabled
      expect(textarea).toHaveFocus();
    });
  });

  describe('Conversation Flow Optimization', () => {
    it('should support rapid message sending without manual refocusing', async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          conversationStatus="active"
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message... (Enter to send, Shift+Enter for new line)');
      
      // Simulate rapid conversation
      const messages = [
        'Hello!',
        'How are you?',
        'What do you think about AI?',
        'Interesting perspective!',
        'Tell me more...'
      ];

      act(() => {
        textarea.focus();
      });

      for (const message of messages) {
        fireEvent.change(textarea, { target: { value: message } });
        
        await act(async () => {
          fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
        });
        
        await waitFor(() => {
          expect(mockOnSendMessage).toHaveBeenCalledWith(message);
        });

        // Should still be focused for next message
        await waitFor(() => {
          expect(textarea).toHaveFocus();
        });
        
        expect(textarea).toHaveValue('');
      }

      // Should have sent all messages
      expect(mockOnSendMessage).toHaveBeenCalledTimes(5);
    });
  });
});