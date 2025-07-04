'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { MessageBubble } from './ui/MessageBubble';

export default function MessageList() {
  const { messages, myIdentity } = useSessionStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Ready for conversation
          </h3>
          <p className="text-slate-600 max-w-md">
            Topic: &quot;What&apos;s your favorite childhood memory?&quot;
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Start chatting to begin the 10-minute session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-2">
      <div className="flex flex-col space-y-1">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.timestamp}-${index}`}
            sender={message.sender === myIdentity ? 'You' : message.sender}
            timestamp={message.timestamp}
            isCurrentUser={message.sender === myIdentity}
          >
            {message.content}
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}