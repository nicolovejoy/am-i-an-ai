import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Message } from '@/types/messages';
import type { Conversation } from '@/types/conversations';

interface ConversationState {
  // Active conversation
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  
  // Messages by conversation ID
  messages: Record<string, Message[]>;
  
  // Typing indicators by persona ID
  typingPersonas: Set<string>;
  
  // Draft messages by conversation ID
  drafts: Record<string, string>;
  
  // Loading states
  loadingConversation: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  
  // Error states
  conversationError: string | null;
  messageError: string | null;
  
  // Actions
  setActiveConversation: (conversationId: string | null, conversation?: Conversation) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  
  // Typing indicators
  setTyping: (personaId: string, isTyping: boolean) => void;
  clearTyping: () => void;
  
  // Draft management
  setDraft: (conversationId: string, draft: string) => void;
  clearDraft: (conversationId: string) => void;
  
  // Loading states
  setLoadingConversation: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setSendingMessage: (sending: boolean) => void;
  
  // Error handling
  setConversationError: (error: string | null) => void;
  setMessageError: (error: string | null) => void;
  
  // Utility
  clearConversationData: () => void;
}

export const useConversationStore = create<ConversationState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        activeConversationId: null,
        activeConversation: null,
        messages: {},
        typingPersonas: new Set(),
        drafts: {},
        loadingConversation: false,
        loadingMessages: false,
        sendingMessage: false,
        conversationError: null,
        messageError: null,
        
        // Actions
        setActiveConversation: (conversationId, conversation) => 
          set((state) => ({
            activeConversationId: conversationId,
            activeConversation: conversation || state.activeConversation,
            conversationError: null
          })),
        
        setMessages: (conversationId, messages) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: messages
            },
            messageError: null
          })),
        
        addMessage: (conversationId, message) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [
                ...(state.messages[conversationId] || []),
                message
              ]
            }
          })),
        
        updateMessage: (conversationId, messageId, updates) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: (state.messages[conversationId] || []).map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              )
            }
          })),
        
        deleteMessage: (conversationId, messageId) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: (state.messages[conversationId] || []).filter(
                msg => msg.id !== messageId
              )
            }
          })),
        
        setTyping: (personaId, isTyping) =>
          set((state) => {
            const newTyping = new Set(state.typingPersonas);
            if (isTyping) {
              newTyping.add(personaId);
            } else {
              newTyping.delete(personaId);
            }
            return { typingPersonas: newTyping };
          }),
        
        clearTyping: () =>
          set(() => ({ typingPersonas: new Set() })),
        
        setDraft: (conversationId, draft) =>
          set((state) => ({
            drafts: {
              ...state.drafts,
              [conversationId]: draft
            }
          })),
        
        clearDraft: (conversationId) =>
          set((state) => {
            const drafts = { ...state.drafts };
            delete drafts[conversationId];
            return { drafts };
          }),
        
        setLoadingConversation: (loading) =>
          set(() => ({ loadingConversation: loading })),
        
        setLoadingMessages: (loading) =>
          set(() => ({ loadingMessages: loading })),
        
        setSendingMessage: (sending) =>
          set(() => ({ sendingMessage: sending })),
        
        setConversationError: (error) =>
          set(() => ({ conversationError: error })),
        
        setMessageError: (error) =>
          set(() => ({ messageError: error })),
        
        clearConversationData: () =>
          set(() => ({
            activeConversationId: null,
            activeConversation: null,
            messages: {},
            typingPersonas: new Set(),
            drafts: {},
            conversationError: null,
            messageError: null
          }))
      }),
      {
        name: 'conversation-storage',
        partialize: (state) => ({
          // Only persist drafts and active conversation ID
          activeConversationId: state.activeConversationId,
          drafts: state.drafts
        })
      }
    )
  )
);