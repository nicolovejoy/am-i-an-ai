'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore, Message, Identity } from '@/store/sessionStore';

interface MessageItemProps {
  message: Message;
  isMyMessage: boolean;
}

function MessageItem({ message, isMyMessage }: MessageItemProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIdentityColor = (identity: Identity) => {
    const colors = {
      A: 'bg-blue-100 text-blue-800',
      B: 'bg-green-100 text-green-800', 
      C: 'bg-purple-100 text-purple-800',
      D: 'bg-orange-100 text-orange-800'
    };
    return colors[identity];
  };

  return (
    <div className={`flex mb-4 ${isMyMessage ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-1' : 'order-2'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIdentityColor(message.sender)}`}>
            {message.sender}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
        </div>
        
        <div className={`
          px-4 py-2 rounded-lg
          ${isMyMessage 
            ? 'bg-primary-600 text-white' 
            : 'bg-white border border-gray-200 text-gray-900'
          }
        `}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Waiting for conversation to begin
          </h3>
          <p className="text-gray-600 max-w-md">
            Once all participants join, the 10-minute anonymous conversation will start. 
            Two humans and two AI participants will engage in discussion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4">
        {messages.map((message, index) => (
          <MessageItem
            key={`${message.timestamp}-${index}`}
            message={message}
            isMyMessage={message.sender === myIdentity}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}