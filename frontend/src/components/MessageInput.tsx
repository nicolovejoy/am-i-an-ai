"use client";

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  conversationStatus: string;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, conversationStatus, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [shouldRefocus, setShouldRefocus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || sending || conversationStatus !== 'active';

  // Auto-focus on mount when conversation is active
  useEffect(() => {
    if (!isDisabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isDisabled]); // Include isDisabled dependency

  // Handle refocusing after message is sent
  useEffect(() => {
    if (shouldRefocus && textareaRef.current) {
      // Use setTimeout to ensure focus happens after DOM updates
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
      setShouldRefocus(false);
    }
  }, [shouldRefocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isDisabled) return;

    setSending(true);
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Reset textarea height and schedule refocus
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setShouldRefocus(true);
    } catch (error) {
      // Error handling is delegated to the parent component
      // TODO: Show error toast
      // Maintain focus even on error for retry
      setShouldRefocus(true);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const getStatusMessage = () => {
    switch (conversationStatus) {
      case 'paused':
        return 'Conversation is paused';
      case 'completed':
        return 'Conversation has ended';
      case 'terminated':
        return 'Conversation was terminated';
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="bg-white p-3">
      <div className="max-w-4xl mx-auto">
        {statusMessage && (
          <div className="mb-2 text-center">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {statusMessage}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isDisabled ? "Cannot send messages" : "Type your message..."}
              disabled={isDisabled}
              className={`
                w-full px-3 py-2 border rounded-lg resize-none min-h-[44px] max-h-[120px]
                focus:outline-none focus:ring-2 focus:border-transparent text-sm
                ${isDisabled
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-[#8B6B4A] text-gray-900'
                }
              `}
              rows={1}
            />
            
            {/* Character count - only show when typing */}
            {message.length > 0 && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.length}/1000
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled || !message.trim()}
            aria-label="Send message"
            className={`
              px-3 py-2 rounded-lg font-medium transition-all min-h-[44px] flex items-center
              ${isDisabled || !message.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#8B6B4A] text-white hover:bg-[#7A5A3A] focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:ring-offset-2'
              }
            `}
          >
            {sending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Sending</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </form>

        {/* Help text - more compact */}
        {conversationStatus === 'active' && (
          <div className="mt-1 text-xs text-gray-400 text-center">
            Enter to send • Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  );
}