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
}

export function MessageList({ messages, participants }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No messages yet</div>
          <div className="text-sm text-gray-400">Start the conversation below</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      role="log"
      aria-label="Conversation messages"
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
    </div>
  );
}