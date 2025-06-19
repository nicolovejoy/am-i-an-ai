"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FullPageLoader } from './LoadingSpinner';
import { CloseConversationModal } from './CloseConversationModal';
import { aiOrchestrator } from '@/services/aiOrchestrator';
import { api } from '@/services/apiClient';
import type { Message } from '@/types/messages';
import type { Conversation, PersonaInstance } from '@/types/conversations';
import type { Persona } from '@/types/personas';

interface ConversationViewProps {
  conversationId: string;
}

interface ConversationParticipant extends PersonaInstance {
  personaName: string;
  personaType: 'human' | 'ai_agent';
}

interface ConversationData extends Omit<Conversation, 'participants'> {
  participants: ConversationParticipant[];
  messageCount: number;
  currentTurn: number;
  topicTags: string[];
  totalCharacters: number;
  averageResponseTime: number;
  qualityScore?: number;
  canAddMessages?: boolean;
  closeReason?: string;
  closedBy?: string;
  closedAt?: Date;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingPersonas, setTypingPersonas] = useState<Set<string>>(new Set());
  const [messageError, setMessageError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchConversationData();
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Poll for new messages every 5 seconds when conversation is active
    if (conversation?.status === 'active' && !loading) {
      const interval = setInterval(async () => {
        try {
          // Validate conversationId before polling
          if (!conversationId || conversationId === 'undefined') return;
          
          const data = await api.messages.list(conversationId);
          if (data.success && data.messages) {
            // Transform and update messages
            const newMessages: Message[] = data.messages.map((msg: Record<string, unknown>) => ({
              id: msg.id as string,
              conversationId: msg.conversationId as string,
              authorPersonaId: msg.authorPersonaId as string,
              content: msg.content as string,
              type: (msg.type as string) || 'text',
              timestamp: new Date(msg.timestamp as string),
              sequenceNumber: msg.sequenceNumber as number,
              isEdited: (msg.isEdited as boolean) || false,
              editedAt: msg.editedAt ? new Date(msg.editedAt as string) : undefined,
              replyToMessageId: msg.replyToMessageId as string,
              metadata: (msg.metadata as Record<string, unknown>) || {},
              moderationStatus: (msg.moderationStatus as string) || 'approved',
              isVisible: (msg.isVisible as boolean) !== false,
              isArchived: (msg.isArchived as boolean) || false
            }));
            
            setMessages(newMessages);
          }
        } catch (error) {
          // Error polling for messages
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [conversation?.status, conversationId, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConversationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate conversationId
      if (!conversationId || conversationId === 'undefined') {
        setError('Invalid conversation ID');
        setLoading(false);
        return;
      }
      
      // Fetch conversation details
      const conversationData = await api.conversations.get(conversationId);
      
      if (!conversationData.success) {
        throw new Error(conversationData.error || 'Failed to load conversation');
      }
      
      // Fetch conversation participants with persona details
      const participantPromises = conversationData.conversation.participants.map(async (participant: Record<string, unknown>) => {
        try {
          const personaData = await api.personas.get(participant.personaId as string);
          if (personaData.success) {
            return {
              ...participant,
              personaName: personaData.persona.name,
              personaType: personaData.persona.type === 'ai_agent' ? 'ai_agent' : 'human'
            };
          }
        } catch (error) {
          // Fallback if persona fetch fails
        }
        return {
          ...participant,
          personaName: 'Unknown Persona',
          personaType: 'human'
        };
      });
      
      const participants = await Promise.all(participantPromises);
      
      // Transform to ConversationData format
      const conversation: ConversationData = {
        id: conversationData.conversation.id,
        title: conversationData.conversation.title,
        topic: conversationData.conversation.topic,
        description: conversationData.conversation.description,
        status: conversationData.conversation.status,
        participants: participants,
        messageCount: conversationData.conversation.messageCount || 0,
        currentTurn: conversationData.conversation.messageCount || 0,
        createdAt: new Date(conversationData.conversation.createdAt),
        startedAt: conversationData.conversation.startedAt ? new Date(conversationData.conversation.startedAt) : undefined,
        topicTags: conversationData.conversation.topicTags || [],
        totalCharacters: conversationData.conversation.totalCharacters || 0,
        averageResponseTime: conversationData.conversation.averageResponseTime || 0,
        qualityScore: conversationData.conversation.qualityScore,
        canAddMessages: conversationData.conversation.canAddMessages !== false, // Default to true if not provided
        closeReason: conversationData.conversation.closeReason,
        closedBy: conversationData.conversation.closedBy,
        closedAt: conversationData.conversation.closedAt ? new Date(conversationData.conversation.closedAt) : undefined,
        createdBy: conversationData.conversation.createdBy || 'unknown',
        constraints: conversationData.conversation.constraints || {
          maxMessages: undefined,
          maxDuration: undefined,
          allowedTopics: conversationData.conversation.topicTags || [],
          endConditions: []
        }
      };
      
      setConversation(conversation);
      
      // Fetch messages from API
      try {
        const messagesData = await api.messages.list(conversationId);
        
        if (messagesData.success && messagesData.messages) {
          // Transform messages to frontend format
          const messages: Message[] = messagesData.messages.map((msg: Record<string, unknown>) => ({
            id: msg.id as string,
            conversationId: msg.conversationId as string,
            authorPersonaId: msg.authorPersonaId as string,
            content: msg.content as string,
            type: (msg.type as string) || 'text',
            timestamp: new Date(msg.timestamp as string),
            sequenceNumber: msg.sequenceNumber as number,
            isEdited: (msg.isEdited as boolean) || false,
            editedAt: msg.editedAt ? new Date(msg.editedAt as string) : undefined,
            replyToMessageId: msg.replyToMessageId as string,
            metadata: (msg.metadata as Record<string, unknown>) || {},
            moderationStatus: (msg.moderationStatus as string) || 'approved',
            isVisible: (msg.isVisible as boolean) !== false,
            isArchived: (msg.isArchived as boolean) || false
          }));
          
          setMessages(messages);
        } else {
          // No messages yet
          setMessages([]);
        }
      } catch (error) {
        // Fallback to empty messages if API fails
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      // For demo mode, we'll simulate message sending
      // In production, this would call the actual API endpoint
      
      // For demo, use first human participant as current user
      // In production, this would come from auth context
      const currentUserPersonaId = conversation?.participants.find(p => p.personaType === 'human')?.personaId || '660e8400-e29b-41d4-a716-446655440001';
      
      // Create new message optimistically
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId: conversationId,
        authorPersonaId: currentUserPersonaId,
        content: content,
        type: 'text',
        timestamp: new Date(),
        sequenceNumber: messages.length + 1,
        isEdited: false,
        metadata: {
          wordCount: content.split(' ').length,
          characterCount: content.length,
          readingTime: Math.ceil(content.split(' ').length / 200), // 200 WPM
          complexity: 0.5,
          responseTime: 0
        },
        moderationStatus: 'approved',
        isVisible: true,
        isArchived: false
      };

      // Add message to UI immediately (optimistic update)
      setMessages(prev => [...prev, newMessage]);

      // Send to Lambda API to persist to database
      try {
        const messagePayload = { 
          content, 
          personaId: currentUserPersonaId,
          type: 'text'
        };
        
        const result = await api.messages.create(conversationId, messagePayload);
        // Message persisted to database
        // Update the optimistic message with the real database ID
        if (result.messageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, id: result.messageId }
              : msg
          ));
        }
      } catch (dbError) {
        // Error persisting message to database
        // Remove the optimistic message and show error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        setMessageError('Failed to send message');
        setTimeout(() => setMessageError(null), 5000);
        return;
      }

      // Trigger AI response analysis and demo simulation
      try {
        if (conversation) {
          // Create mock participant personas for AI analysis
          const mockParticipants: Record<string, unknown>[] = conversation.participants.map(p => ({
            id: p.personaId,
            name: p.personaName,
            type: p.personaType === 'ai_agent' ? 'ai_agent' : 'human_persona',
            personality: {
              openness: 70, conscientiousness: 60, extraversion: 75,
              agreeableness: 80, neuroticism: 30, creativity: 85,
              assertiveness: 65, empathy: 90
            },
            knowledge: ['philosophy', 'psychology'],
            communicationStyle: 'empathetic'
          }));

          const mockConversation = {
            id: conversationId,
            title: conversation.title,
            topic: conversation.topic,
            participants: conversation.participants.map(p => p.personaId)
          };

          const aiTriggers = await aiOrchestrator.analyzeResponseTriggers(
            mockConversation as unknown as Conversation,
            newMessage,
            mockParticipants as unknown as Persona[],
            messages
          );
          
          if (aiTriggers.length > 0) {
            // AI response triggers analyzed
            
            // Generate real AI responses
            generateAIResponses(aiTriggers, newMessage.id);
          }
        }
      } catch (aiError) {
        // Error triggering AI responses
        // Continue normally even if AI analysis fails
      }

    } catch (error) {
      // Failed to send message
      // TODO: Show error toast to user
      throw error; // Re-throw so MessageInput can handle it
    }
  };

  // Generate real AI responses via API
  const generateAIResponses = async (triggers: { personaId: string; priority: number; reason: string; suggestedDelay: number }[], triggerMessageId: string) => {
    for (const trigger of triggers) {
      try {
        // Show typing indicator
        setTimeout(() => {
          setTypingPersonas(prev => new Set([...prev, trigger.personaId]));
        }, trigger.suggestedDelay);

        // Generate AI response after delay
        setTimeout(async () => {
          try {
            const data = await api.ai.generateResponse(conversationId, {
              personaId: trigger.personaId,
              triggerMessageId,
            });
            // AI API response received

            // Remove typing indicator
            setTypingPersonas(prev => {
              const newSet = new Set(prev);
              newSet.delete(trigger.personaId);
              return newSet;
            });

            if (data.success && (data.message || data.response)) {
              const messageData = data.message || data.response;
              // AI response was generated and saved to database
              // Add the AI message to the UI
              const aiMessage: Message = {
                id: messageData.id,
                conversationId: conversationId,
                authorPersonaId: trigger.personaId,
                content: messageData.content,
                type: 'text',
                timestamp: new Date(messageData.timestamp),
                sequenceNumber: messageData.sequenceNumber,
                isEdited: false,
                replyToMessageId: triggerMessageId,
                metadata: messageData.metadata || {},
                moderationStatus: 'approved',
                isVisible: true,
                isArchived: false
              };
              
              setMessages(prev => [...prev, aiMessage]);
              // AI response generated
            } else {
              // AI response generation failed
              // AI response error details available
              // Fallback to demo response if AI fails
              generateDemoResponse(trigger, triggerMessageId);
            }
          } catch (error) {
            // Error calling AI API
            // Remove typing indicator
            setTypingPersonas(prev => {
              const newSet = new Set(prev);
              newSet.delete(trigger.personaId);
              return newSet;
            });
            // Show error message
            setAiError('AI response failed');
            setTimeout(() => setAiError(null), 5000);
            // Fallback to demo response if API fails
            generateDemoResponse(trigger, triggerMessageId);
          }
        }, trigger.suggestedDelay + 1000); // Add 1 second for typing simulation
      } catch (error) {
        // Error setting up AI response
      }
    }
  };

  // Fallback demo response function
  const generateDemoResponse = (trigger: { personaId: string; priority: number; reason: string; suggestedDelay: number }, triggerMessageId: string) => {
    const demoResponses = {
      '01234567-3333-3333-3333-012345678901': [
        'That\'s a fascinating perspective. It makes me think about the relationship between consciousness and our ability to question our own existence.',
        'Your point raises an important question about the nature of subjective experience. How do we distinguish between genuine understanding and sophisticated pattern matching?',
        'I find myself wondering if consciousness might be more of a process than a state - something that emerges from complex interactions rather than a binary property.',
        'That\'s an intriguing way to frame it. Perhaps the question isn\'t whether something is conscious, but rather how consciousness manifests across different types of information processing systems.'
      ]
    };

    const responses = demoResponses[trigger.personaId as keyof typeof demoResponses] || [
      'That\'s an interesting point to consider.',
      'I\'d like to explore that idea further.',
      'Your perspective adds depth to this discussion.'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const aiMessage: Message = {
      id: `demo-ai-msg-${Date.now()}-${trigger.personaId}`,
      conversationId: conversationId,
      authorPersonaId: trigger.personaId,
      content: randomResponse,
      type: 'text',
      timestamp: new Date(),
      sequenceNumber: messages.length + 1,
      isEdited: false,
      replyToMessageId: triggerMessageId,
      metadata: {
        wordCount: randomResponse.split(' ').length,
        characterCount: randomResponse.length,
        readingTime: Math.ceil(randomResponse.split(' ').length / 200),
        complexity: 0.6,
        responseTime: trigger.suggestedDelay,
        aiGenerated: true
      },
      moderationStatus: 'approved',
      isVisible: true,
      isArchived: false
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  const handleCloseConversation = async (reason: string, status: 'completed' | 'terminated' = 'completed') => {
    try {
      setIsClosing(true);
      const result = await api.conversations.close(conversationId, { reason, status });
      
      if (result.success) {
        // Update local conversation state
        setConversation(prev => prev ? {
          ...prev,
          status: result.conversation.status,
          canAddMessages: result.conversation.canAddMessages,
          closeReason: result.conversation.closeReason,
          closedBy: result.conversation.closedBy,
          closedAt: result.conversation.closedAt ? new Date(result.conversation.closedAt) : undefined,
        } : null);
        
        setShowCloseModal(false);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      // TODO: Show error toast
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return <FullPageLoader text="Loading conversation..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <div className="text-red-600 font-medium mb-2">Error Loading Conversation</div>
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <button
            onClick={fetchConversationData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mr-3"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Conversations
          </Link>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Conversation not found</div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Conversations
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Back to conversations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-[#2D3748]">{conversation.title}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {conversation.status === 'active' && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
                >
                  Close Conversation
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(conversation.status)}`}>
                {conversation.status}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">{conversation.topic}</div>
          
          {conversation.description && (
            <div className="text-sm text-gray-500 mb-3">{conversation.description}</div>
          )}
          
          {/* Conversation State Info */}
          {(conversation.closeReason || conversation.closedAt) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
              <div className="text-sm text-gray-600">
                <div className="font-medium">Conversation Closed</div>
                {conversation.closeReason && (
                  <div className="mt-1">Reason: {conversation.closeReason}</div>
                )}
                {conversation.closedAt && (
                  <div className="mt-1">
                    Closed on: {conversation.closedAt.toLocaleDateString()} at {conversation.closedAt.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Participants */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Participants:</div>
            <div className="flex space-x-3">
              {conversation.participants.map((participant) => (
                <div
                  key={participant.personaId}
                  className="flex items-center space-x-2"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      participant.personaType === 'human'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {participant.personaName}
                  </span>
                  {participant.isRevealed && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {participant.personaType === 'human' ? 'Human' : 'AI'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <MessageList 
          messages={messages} 
          participants={conversation.participants}
          typingPersonas={typingPersonas}
        />
        
        {messageError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{messageError}</p>
          </div>
        )}
        
        {aiError && (
          <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
            <p className="text-sm text-yellow-600">{aiError}</p>
          </div>
        )}
      </div>
      
      {/* Message Input - positioned as a sticky footer */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        conversationStatus={conversation.status}
        disabled={!conversation.canAddMessages}
      />

      {/* Close Conversation Modal */}
      {showCloseModal && (
        <CloseConversationModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          onConfirm={handleCloseConversation}
          isLoading={isClosing}
          conversationTitle={conversation.title}
        />
      )}
    </div>
  );
}