"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConversationStore } from '@/store';
import type { Message } from '@/types/messages';
import { api } from '@/services/apiClient';

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient();
  const {
    setActiveConversation,
    setMessages,
    addMessage,
    setLoadingConversation,
    setLoadingMessages,
    setSendingMessage,
    setConversationError,
    setMessageError,
    messages,
    activeConversation,
    sendingMessage
  } = useConversationStore();

  // Fetch conversation details
  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      
      setLoadingConversation(true);
      try {
        const data = await api.conversations.get(conversationId);
        
        // Handle both response formats:
        // 1. Backend returns: { conversation: {...}, permissions: {...} }
        // 2. Some endpoints return: { success: true, conversation: {...}, permissions: {...} }
        if (data.conversation) {
          const conversation = data.conversation;
          setActiveConversation(conversationId, conversation);
          return conversation;
        }
        
        // If we have success field but it's false, use the error
        if (data.success === false) {
          throw new Error(data.error || 'Failed to fetch conversation');
        }
        
        // If we get here, no conversation data was returned
        throw new Error('Conversation not found');
      } catch (error) {
        setConversationError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setLoadingConversation(false);
      }
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch messages
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      setLoadingMessages(true);
      try {
        const data = await api.messages.list(conversationId);
        
        if (data.success) {
          // Handle both empty arrays and populated message arrays
          const messages = data.messages || [];
          const transformedMessages: Message[] = messages.map((msg: {
            id: string;
            conversationId: string;
            authorPersonaId: string;
            content: string;
            type?: string;
            timestamp: string;
            sequenceNumber: number;
            isEdited?: boolean;
            editedAt?: string;
            replyToMessageId?: string;
            metadata?: Record<string, unknown>;
            moderationStatus?: string;
            isVisible?: boolean;
            isArchived?: boolean;
          }) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            authorPersonaId: msg.authorPersonaId,
            content: msg.content,
            type: msg.type || 'text',
            timestamp: new Date(msg.timestamp),
            sequenceNumber: msg.sequenceNumber,
            isEdited: msg.isEdited || false,
            editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
            replyToMessageId: msg.replyToMessageId,
            metadata: msg.metadata || {},
            moderationStatus: msg.moderationStatus || 'approved',
            isVisible: msg.isVisible !== false,
            isArchived: msg.isArchived || false
          }));
          
          setMessages(conversationId, transformedMessages);
          return transformedMessages;
        }
        throw new Error(data.error || 'Failed to fetch messages');
      } catch (error) {
        setMessageError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setLoadingMessages(false);
      }
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, personaId }: { content: string; personaId: string }) => {
      setSendingMessage(true);
      
      // Optimistically add the message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId!,
        authorPersonaId: personaId,
        content,
        type: 'text',
        timestamp: new Date(),
        sequenceNumber: (messages[conversationId!]?.length || 0) + 1,
        isEdited: false,
        metadata: {
          wordCount: content.split(' ').length,
          characterCount: content.length,
          readingTime: Math.ceil(content.split(' ').length / 200),
          complexity: 0.5
        },
        moderationStatus: 'approved',
        isVisible: true,
        isArchived: false
      };
      
      addMessage(conversationId!, optimisticMessage);
      
      const messagePayload = {
        conversationId,
        personaId, // Backend expects 'personaId', not 'authorPersonaId'
        content,
        type: 'text'
      };
      
      const data = await api.messages.create(conversationId!, messagePayload);
      
      if (!data.success) throw new Error(data.error || 'Failed to send message');
      
      return data;
    },
    onSuccess: async () => {
      // Refetch messages to get the server response and any AI replies
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // AI responses are now triggered server-side automatically
      // No client-side AI orchestration needed
    },
    onError: (error) => {
      setMessageError(error instanceof Error ? error.message : 'Failed to send message');
      // Remove optimistic message on error
      // In a real app, you'd want to mark it as failed instead
    },
    onSettled: () => {
      setSendingMessage(false);
    }
  });

  const hookResult = {
    conversation: activeConversation || conversationQuery.data,
    messages: messages[conversationId!] || [],
    isLoadingConversation: conversationQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
    isSendingMessage: sendingMessage,
    conversationError: conversationQuery.error,
    messagesError: messagesQuery.error,
    sendMessage: sendMessageMutation.mutate,
    refetchMessages: messagesQuery.refetch
  };


  return hookResult;
}