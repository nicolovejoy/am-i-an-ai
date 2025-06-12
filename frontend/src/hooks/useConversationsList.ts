"use client";

import { useQuery } from '@tanstack/react-query';
import { useConversationsListStore } from '@/store';
import type { Conversation } from '@/types/conversations';

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

const LAMBDA_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://wygrsdhzg1.execute-api.us-east-1.amazonaws.com/prod';

export function useConversationsList() {
  const {
    conversations,
    page,
    pageSize,
    filters,
    setConversations,
    appendConversations,
    setLoadingConversations,
    setLoadingMore,
    setConversationsError,
    loadNextPage
  } = useConversationsListStore();

  // Fetch conversations
  const conversationsQuery = useQuery({
    queryKey: ['conversations', { page, pageSize, filters }],
    queryFn: async () => {
      const isFirstPage = page === 1;
      
      if (isFirstPage) {
        setLoadingConversations(true);
      } else {
        setLoadingMore(true);
      }
      
      try {
        // Build query params
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString()
        });
        
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.personaId) params.append('personaId', filters.personaId);
        
        const response = await fetch(`${LAMBDA_API_BASE}/api/conversations?${params}`);
        if (!response.ok) throw new Error('Failed to fetch conversations');
        
        const data = await response.json();
        if (data.success && data.conversations) {
          const transformedConversations: Conversation[] = data.conversations.map((conv: {
            id: string;
            title: string;
            participants?: unknown[];
            status: string;
            createdAt: string;
            updatedAt?: string;
            lastMessageAt?: string;
            metadata?: Record<string, unknown>;
          }) => ({
            id: conv.id,
            title: conv.title,
            participants: conv.participants || [],
            status: conv.status,
            createdAt: new Date(conv.createdAt),
            updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : undefined,
            lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined,
            metadata: conv.metadata || {}
          }));
          
          if (isFirstPage) {
            setConversations(transformedConversations, data.totalCount);
          } else {
            appendConversations(transformedConversations);
          }
          
          return {
            conversations: transformedConversations,
            totalCount: data.totalCount
          };
        }
        throw new Error(data.error || 'Failed to fetch conversations');
      } catch (error) {
        setConversationsError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setLoadingConversations(false);
        setLoadingMore(false);
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const handleLoadMore = () => {
    if (!conversationsQuery.isLoading && conversations.length >= pageSize) {
      loadNextPage();
    }
  };

  return {
    conversations,
    isLoading: conversationsQuery.isLoading && page === 1,
    isLoadingMore: conversationsQuery.isLoading && page > 1,
    error: conversationsQuery.error,
    hasMore: conversations.length >= pageSize,
    loadMore: handleLoadMore,
    refetch: conversationsQuery.refetch
  };
}