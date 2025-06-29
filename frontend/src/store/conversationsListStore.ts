import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Conversation } from '@/types/conversations';

interface ConversationsListState {
  // All conversations
  conversations: Conversation[];
  
  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  
  // Filters
  filters: {
    status?: 'active' | 'archived' | 'deleted';
    search?: string;
    personaId?: string;
  };
  
  // Loading states
  loadingConversations: boolean;
  loadingMore: boolean;
  
  // Error states
  conversationsError: string | null;
  
  // Actions
  setConversations: (conversations: Conversation[], totalCount?: number) => void;
  appendConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: string) => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  loadNextPage: () => void;
  
  // Filters
  setFilters: (filters: Partial<ConversationsListState['filters']>) => void;
  clearFilters: () => void;
  
  // Loading and errors
  setLoadingConversations: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;
  
  // Utility
  resetList: () => void;
  clearAllData: () => void;
}

export const useConversationsListStore = create<ConversationsListState>()(
  devtools(
    (set) => ({
      // Initial state
      conversations: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: true,
      filters: {},
      loadingConversations: false,
      loadingMore: false,
      conversationsError: null,
      
      // Actions
      setConversations: (conversations, totalCount) =>
        set((state) => ({
          conversations,
          totalCount: totalCount ?? conversations.length,
          hasMore: conversations.length >= state.pageSize,
          conversationsError: null
        })),
      
      appendConversations: (conversations) =>
        set((state) => ({
          conversations: [...state.conversations, ...conversations],
          hasMore: conversations.length >= state.pageSize
        })),
      
      updateConversation: (conversationId, updates) =>
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          )
        })),
      
      removeConversation: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.filter(conv => conv.id !== conversationId),
          totalCount: Math.max(0, state.totalCount - 1)
        })),
      
      setPage: (page) =>
        set(() => ({ page })),
      
      setPageSize: (pageSize) =>
        set(() => ({ pageSize, page: 1 })),
      
      loadNextPage: () =>
        set((state) => ({ page: state.page + 1 })),
      
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          page: 1,
          conversations: []
        })),
      
      clearFilters: () =>
        set(() => ({
          filters: {},
          page: 1,
          conversations: []
        })),
      
      setLoadingConversations: (loading) =>
        set(() => ({ loadingConversations: loading })),
      
      setLoadingMore: (loading) =>
        set(() => ({ loadingMore: loading })),
      
      setConversationsError: (error) =>
        set(() => ({ conversationsError: error })),
      
      resetList: () =>
        set(() => ({
          conversations: [],
          page: 1,
          totalCount: 0,
          hasMore: true,
          filters: {},
          conversationsError: null
        })),
      
      clearAllData: () =>
        set(() => ({
          conversations: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          hasMore: true,
          filters: {},
          loadingConversations: false,
          loadingMore: false,
          conversationsError: null
        }))
    }),
    {
      name: 'conversations-list-store'
    }
  )
);