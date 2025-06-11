"use client";

import React from 'react';
import Link from 'next/link';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FullPageLoader } from './LoadingSpinner';
import { useConversation } from '@/hooks/useConversation';
import { useConversationStore } from '@/store';
import type { PersonaInstance } from '@/types/conversations';

interface ConversationViewProps {
  conversationId: string;
}

interface ConversationParticipant extends PersonaInstance {
  personaName: string;
  personaType: 'human' | 'ai_agent';
}

export function ConversationViewWithZustand({ conversationId }: ConversationViewProps) {
  const {
    conversation,
    messages,
    isLoadingConversation,
    isSendingMessage,
    sendMessage,
    conversationError,
    messagesError
  } = useConversation(conversationId);

  const {
    messageError,
    setMessageError
  } = useConversationStore();

  // Get the human participant (for sending messages)
  const humanParticipant = conversation?.participants.find(
    (p: ConversationParticipant) => p.personaType === 'human'
  );

  const handleSendMessage = async (content: string) => {
    if (!humanParticipant || !content.trim()) return;

    try {
      setMessageError(null);
      sendMessage({ 
        content: content.trim(), 
        personaId: humanParticipant.personaId 
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoadingConversation) {
    return <FullPageLoader text="Loading conversation..." />;
  }

  if (conversationError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Conversation Not Found</h1>
        <p className="text-gray-600 mb-6">This conversation could not be found or has been deleted.</p>
        <Link 
          href="/conversations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start New Conversation
        </Link>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  // Transform participants for display
  const participants = conversation.participants.map((p: ConversationParticipant) => ({
    id: p.personaId,
    name: p.personaName || 'Unknown',
    type: p.personaType,
    avatar: p.personaType === 'human' ? '👤' : '🤖'
  }));

  // Note: typingParticipants functionality would be implemented when needed

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {conversation.title}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-500">
                {participants.map((p: any) => p.name).join(', ')}
              </p>
              <span className="text-xs text-gray-400">
                {messages.length} messages
              </span>
            </div>
          </div>
          <Link
            href="/conversations/new"
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Chat
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          participants={participants.map((p: any) => ({
            personaId: p.id,
            personaName: p.name,
            personaType: p.type,
            isRevealed: true
          }))}
          typingPersonas={new Set()}
        />
      </div>

      {/* Error display */}
      {(messageError || messagesError) && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">
            {messageError || (messagesError instanceof Error ? messagesError.message : 'Error loading messages')}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          conversationStatus="active"
          disabled={isSendingMessage || !humanParticipant}
        />
      </div>
    </div>
  );
}