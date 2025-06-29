import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders input field and send button', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('displays placeholder text', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      expect(screen.getByPlaceholderText(/Type your message/)).toBeInTheDocument();
    });

    it('shows help text for keyboard shortcuts', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      expect(screen.getByText('Enter to send • Shift+Enter for new line')).toBeInTheDocument();
    });

    it('displays character count when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      // Character count should not be visible initially
      expect(screen.queryByText('0/1000')).not.toBeInTheDocument();
      
      // Type something to make character count appear
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      
      expect(screen.getByText('5/1000')).toBeInTheDocument();
    });
  });

  describe('Message Input Functionality', () => {
    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello world');
      
      expect(screen.getByText('11/1000')).toBeInTheDocument();
    });

    it('enables send button when message is not empty', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Initially disabled
      expect(sendButton).toBeDisabled();
      
      // Enabled after typing
      await user.type(textarea, 'Test message');
      expect(sendButton).toBeEnabled();
    });

    it('disables send button for empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Test whitespace-only message
      await user.type(textarea, '   ');
      expect(sendButton).toBeDisabled();
      
      // Clear and test empty message
      await user.clear(textarea);
      expect(sendButton).toBeDisabled();
    });

    it('auto-resizes textarea as content grows', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Add multiple lines of content
      const longMessage = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      await user.type(textarea, longMessage);
      
      // Check that style.height is set (auto-resize working)
      expect(textarea.style.height).toBeTruthy();
    });

    it('limits textarea height to maximum', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Add very long content to test max height
      const veryLongMessage = Array(20).fill('Very long line of text').join('\n');
      await user.type(textarea, veryLongMessage);
      
      // Should respect max-height class
      expect(textarea).toHaveClass('max-h-[120px]');
    });
  });

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('sends message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('does not send message when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('trims whitespace from message before sending', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textarea, '  Test message  ');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('clears input after successful send', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockResolvedValue(undefined);
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('resets textarea height after sending', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockResolvedValue(undefined);
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Type multi-line message
      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      
      // Send the message
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(textarea.style.height).toBe('auto');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state while sending', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const sendPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockOnSendMessage.mockReturnValue(sendPromise);
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      // Should show loading state
      expect(screen.getByText('Sending')).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
      
      // Resolve promise
      resolvePromise!(undefined);
      
      await waitFor(() => {
        expect(screen.queryByText('Sending')).not.toBeInTheDocument();
      });
    });

    it('handles send errors gracefully', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockRejectedValue(new Error('Send failed'));
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      // Wait for the error to be handled
      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
      });
      
      // Message should still be in textarea after error (for retry)
      expect(textarea).toHaveValue('Test message');
      
      // Component should not be in sending state after error
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Conversation Status Handling', () => {
    const statusTests = [
      {
        status: 'paused',
        expectedMessage: 'Conversation is paused',
        shouldDisable: true
      },
      {
        status: 'completed',
        expectedMessage: 'Conversation has ended',
        shouldDisable: true
      },
      {
        status: 'terminated',
        expectedMessage: 'Conversation was terminated',
        shouldDisable: true
      }
    ];

    statusTests.forEach(({ status, expectedMessage, shouldDisable }) => {
      it(`displays correct status message for ${status} conversation`, () => {
        render(
          <MessageInput 
            onSendMessage={mockOnSendMessage} 
            conversationStatus={status} 
          />
        );
        
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });

      if (shouldDisable) {
        it(`disables input for ${status} conversation`, () => {
          render(
            <MessageInput 
              onSendMessage={mockOnSendMessage} 
              conversationStatus={status} 
            />
          );
          
          const textarea = screen.getByRole('textbox');
          const sendButton = screen.getByRole('button', { name: /send/i });
          
          expect(textarea).toBeDisabled();
          expect(sendButton).toBeDisabled();
          expect(textarea).toHaveAttribute('placeholder', 'Cannot send messages');
        });
      }
    });

    it('does not show status message for active conversation', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      expect(screen.queryByText(/Conversation is/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Conversation has/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Conversation was/)).not.toBeInTheDocument();
    });

    it('hides help text for non-active conversations', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="paused" 
        />
      );
      
      expect(screen.queryByText('Press Enter to send')).not.toBeInTheDocument();
    });
  });

  describe('Disabled Prop', () => {
    it('disables input when disabled prop is true', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active"
          disabled={true}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      expect(textarea).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('overrides active status when disabled', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active"
          disabled={true}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveAttribute('placeholder', 'Cannot send messages');
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textbox = screen.getByRole('textbox');
      expect(textbox).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      
      await user.click(textarea);
      expect(textarea).toHaveFocus();
    });

    it('provides proper button labeling', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const longMessage = 'A'.repeat(1500); // Longer than 1000 char limit
      
      await user.type(textarea, longMessage);
      
      expect(screen.getByText('1500/1000')).toBeInTheDocument();
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(longMessage);
    });

    it('handles rapid successive submissions', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockResolvedValue(undefined);
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textarea, 'Message 1');
      await user.click(sendButton);
      
      // Should prevent rapid submissions while first is processing
      expect(sendButton).toBeDisabled();
    });

    it('handles special characters and emojis', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          conversationStatus="active" 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      const specialMessage = 'Hello 👋 <script>alert("test")</script> & entities';
      
      await user.type(textarea, specialMessage);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(specialMessage);
    });
  });
});