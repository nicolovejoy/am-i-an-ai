"use client";

import React from 'react';
import Link from 'next/link';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FullPageLoader } from './LoadingSpinner';
import { useConversation } from '@/hooks/useConversation';
import { useConversationStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationViewWithZustand({ conversationId }: ConversationViewProps) {
  const { user } = useAuth();
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

  // Get the human participant that the current user owns (for sending messages)
  const humanParticipant = conversation?.participants.find(
    (p) => {
      const personaType = (p as any).personaType || '';
      const ownerId = (p as any).ownerId;
      const currentUserId = user?.sub; // Cognito user ID
      
      // Must be a human persona AND owned by the current user
      const isHumanPersona = personaType === 'human' || personaType === 'human_persona';
      const isOwnedByUser = ownerId === currentUserId;
      
      return isHumanPersona && isOwnedByUser;
    }
  );

  // No fallback - user can only post as personas they own


  const handleSendMessage = async (content: string) => {
    if (!humanParticipant || !content.trim()) return;

    try {
      setMessageError(null);
      sendMessage({ 
        content: content.trim(), 
        personaId: humanParticipant.personaId || '' 
      });
    } catch (error) {
      // Error is handled by the mutation
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
  const participants = conversation.participants.map((p) => ({
    id: p.personaId,
    name: (p as any).personaName || 'Unknown',
    type: (p as any).personaType || 'human',
    avatar: (p as any).personaType === 'human' ? '👤' : '🤖'
  }));

  // Note: typingParticipants functionality would be implemented when needed

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {conversation.title}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-500">
                {participants.map((p: { name: string }) => p.name).join(', ')}
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

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <MessageList 
          messages={messages}
          participants={participants.map((p) => ({
            personaId: p.id,
            personaName: p.name,
            personaType: p.type as 'human' | 'ai_agent',
            isRevealed: true
          }))}
          typingPersonas={new Set()}
        />
      </div>

      {/* Error display */}
      {(messageError || messagesError) && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">
            {messageError || (messagesError instanceof Error ? messagesError.message : 'Error loading messages')}
          </p>
        </div>
      )}

      {/* Input - Fixed at bottom with spacing */}
      <div className="flex-shrink-0 border-t bg-white pb-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          conversationStatus="active"
          disabled={isSendingMessage || !humanParticipant}
        />
      </div>
    </div>
  );
}