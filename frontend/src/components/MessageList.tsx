"use client";

import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '@/types/messages';

interface MessageListProps {
  messages: Message[];
  participants: Array<{
    personaId: string;
    personaName: string;
    personaType: 'human' | 'ai_agent';
    isRevealed: boolean;
  }>;
  typingPersonas?: Set<string>;
}

export function MessageList({ messages, participants, typingPersonas = new Set() }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isUserScrollingRef = useRef(false);

  // Track when user manually scrolls
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    // If user scrolls away from bottom, mark as manually scrolling
    if (!isAtBottom) {
      isUserScrollingRef.current = true;
    } else {
      // If user scrolls back to bottom, allow auto-scroll again
      isUserScrollingRef.current = false;
    }
  };

  // Auto-scroll to bottom only when new messages arrive and user hasn't manually scrolled up
  useEffect(() => {
    if (!scrollRef.current) return;

    const hasNewMessages = messages.length > prevMessageCountRef.current;
    const shouldAutoScroll = hasNewMessages && !isUserScrollingRef.current;

    if (shouldAutoScroll || typingPersonas.size > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, typingPersonas]);

  // Create participant lookup for efficient access
  const participantMap = React.useMemo(() => {
    const map = new Map();
    participants.forEach(participant => {
      map.set(participant.personaId, participant);
    });
    return map;
  }, [participants]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Empty state positioned in upper portion */}
        <div className="flex-1 flex items-center justify-center max-h-96 min-h-48">
          <div className="text-center">
            <div className="text-gray-500 mb-2">No messages yet</div>
            <div className="text-sm text-gray-400">Start the conversation below</div>
          </div>
        </div>
        {/* Spacer to push content upward, making room for message input */}
        <div className="flex-1"></div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 space-y-4"
      role="log"
      aria-label="Conversation messages"
      onScroll={handleScroll}
    >
      {messages.map((message, index) => {
        const participant = participantMap.get(message.authorPersonaId);
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const isConsecutive = !!(previousMessage && 
          previousMessage.authorPersonaId === message.authorPersonaId &&
          (message.timestamp.getTime() - previousMessage.timestamp.getTime()) < 300000); // 5 minutes

        return (
          <MessageItem
            key={message.id}
            message={message}
            participant={participant}
            isConsecutive={isConsecutive}
          />
        );
      })}
      
      {/* Typing indicators */}
      {Array.from(typingPersonas).map(personaId => {
        const participant = participantMap.get(personaId);
        if (!participant) return null;

        return (
          <div key={`typing-${personaId}`} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {participant.personaName.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {participant.personaName} {participant.personaType === 'ai_agent' ? 'is thinking...' : 'is typing...'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}