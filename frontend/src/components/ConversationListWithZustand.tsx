"use client";

import React from 'react';
import Link from 'next/link';
import { useConversationsList } from '@/hooks/useConversationsList';
import { Skeleton } from './SkeletonLoader';

export function ConversationListWithZustand() {
  const {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore
  } = useConversationsList();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load conversations</p>
          <p className="text-sm text-red-500 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">
          <span className="text-6xl">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No conversations yet
        </h3>
        <p className="text-gray-600 mb-6">
          Start a new conversation to begin chatting
        </p>
        <Link
          href="/conversations/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start New Conversation
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        // PersonaInstance doesn't have personaName, we'll need to map this differently
        const participantNames = conversation.participants
          .map(p => p.personaId || 'Unknown')
          .join(', ');
        
        // Since Conversation type doesn't have metadata, we'll show a placeholder
        const messagePreview = 'No messages yet';

        return (
          <Link
            key={conversation.id}
            href={`/conversations/${conversation.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {conversation.title}
              </h3>
              <time className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {new Date(conversation.createdAt).toLocaleDateString()}
              </time>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {participantNames}
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {messagePreview}
            </p>
            {/* Removed unreadCount since metadata doesn't exist on Conversation type */}
          </Link>
        );
      })}
      
      {hasMore && (
        <div className="p-4">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}