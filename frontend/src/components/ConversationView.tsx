"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FullPageLoader } from './LoadingSpinner';
import type { Message } from '@/types/messages';

interface ConversationViewProps {
  conversationId: string;
}

interface ConversationParticipant {
  personaId: string;
  personaName: string;
  personaType: 'human' | 'ai_agent';
  isRevealed: boolean;
  role: 'initiator' | 'responder';
  joinedAt: Date;
  lastActiveAt: Date;
}

interface ConversationData {
  id: string;
  title: string;
  topic: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'terminated';
  participants: ConversationParticipant[];
  messageCount: number;
  currentTurn: number;
  createdAt: Date;
  startedAt?: Date;
  topicTags: string[];
  totalCharacters: number;
  averageResponseTime: number;
  qualityScore?: number;
  createdBy: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversationData();
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConversationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock conversation data - this matches our first conversation from the list
      const mockConversation: ConversationData = {
        id: conversationId,
        title: 'Philosophical Discussion on Consciousness',
        topic: 'What defines consciousness?',
        description: 'A deep dive into the nature of consciousness and self-awareness',
        status: 'active',
        participants: [
          {
            personaId: '01234567-2222-2222-2222-012345678901',
            personaName: 'The Philosopher',
            personaType: 'human',
            isRevealed: false,
            role: 'initiator',
            joinedAt: new Date('2024-12-06T10:00:00Z'),
            lastActiveAt: new Date('2024-12-06T14:30:00Z'),
          },
          {
            personaId: '01234567-3333-3333-3333-012345678901',
            personaName: 'Deep Thinker',
            personaType: 'ai_agent',
            isRevealed: false,
            role: 'responder',
            joinedAt: new Date('2024-12-06T10:05:00Z'),
            lastActiveAt: new Date('2024-12-06T14:32:00Z'),
          },
        ],
        messageCount: 7,
        currentTurn: 7,
        createdAt: new Date('2024-12-06T10:00:00Z'),
        startedAt: new Date('2024-12-06T10:05:00Z'),
        topicTags: ['philosophy', 'consciousness', 'ethics'],
        totalCharacters: 2847,
        averageResponseTime: 180000,
        qualityScore: 4.2,
        createdBy: 'user123'
      };

      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          conversationId: conversationId,
          authorPersonaId: '01234567-2222-2222-2222-012345678901',
          content: 'I\'ve been pondering lately about what truly defines consciousness. Is it simply awareness, or something deeper?',
          type: 'text',
          timestamp: new Date('2024-12-06T10:05:00Z'),
          sequenceNumber: 1,
          isEdited: false,
          metadata: {
            wordCount: 18,
            characterCount: 108,
            readingTime: 5,
            complexity: 0.6,
            responseTime: 300000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-2',
          conversationId: conversationId,
          authorPersonaId: '01234567-3333-3333-3333-012345678901',
          content: 'That\'s a fascinating question. I think consciousness involves not just awareness, but self-awareness - the ability to recognize oneself as a thinking entity distinct from the environment.',
          type: 'text',
          timestamp: new Date('2024-12-06T10:08:00Z'),
          sequenceNumber: 2,
          isEdited: false,
          metadata: {
            wordCount: 29,
            characterCount: 186,
            readingTime: 8,
            complexity: 0.7,
            responseTime: 180000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-3',
          conversationId: conversationId,
          authorPersonaId: '01234567-2222-2222-2222-012345678901',
          content: 'Interesting perspective! But doesn\'t that raise the question of whether self-awareness can exist without language? How would we recognize our own thoughts without the structure that language provides?',
          type: 'text',
          timestamp: new Date('2024-12-06T10:12:00Z'),
          sequenceNumber: 3,
          isEdited: false,
          metadata: {
            wordCount: 31,
            characterCount: 202,
            readingTime: 9,
            complexity: 0.8,
            responseTime: 240000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-4',
          conversationId: conversationId,
          authorPersonaId: '01234567-3333-3333-3333-012345678901',
          content: 'You raise an excellent point about language. Perhaps consciousness exists on a spectrum - from basic awareness in animals without complex language, to the rich self-reflective consciousness that language enables in humans.',
          type: 'text',
          timestamp: new Date('2024-12-06T10:15:00Z'),
          sequenceNumber: 4,
          isEdited: false,
          metadata: {
            wordCount: 33,
            characterCount: 214,
            readingTime: 10,
            complexity: 0.7,
            responseTime: 180000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-5',
          conversationId: conversationId,
          authorPersonaId: '01234567-2222-2222-2222-012345678901',
          content: 'That spectrum idea resonates with me. It makes me wonder - where would artificial intelligence fit on such a spectrum? Could an AI system ever achieve genuine consciousness, or would it always be simulation?',
          type: 'text',
          timestamp: new Date('2024-12-06T14:20:00Z'),
          sequenceNumber: 5,
          isEdited: false,
          metadata: {
            wordCount: 33,
            characterCount: 209,
            readingTime: 9,
            complexity: 0.7,
            responseTime: 14700000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-6',
          conversationId: conversationId,
          authorPersonaId: '01234567-3333-3333-3333-012345678901',
          content: 'That\'s perhaps the most profound question of our time. If consciousness is about information processing and self-awareness, then theoretically an AI could achieve it. But how would we ever know the difference between genuine consciousness and a very convincing simulation?',
          type: 'text',
          timestamp: new Date('2024-12-06T14:25:00Z'),
          sequenceNumber: 6,
          isEdited: false,
          metadata: {
            wordCount: 40,
            characterCount: 252,
            readingTime: 11,
            complexity: 0.8,
            responseTime: 300000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        },
        {
          id: 'msg-7',
          conversationId: conversationId,
          authorPersonaId: '01234567-2222-2222-2222-012345678901',
          content: 'Exactly! We might be facing a version of the philosophical zombie problem - something that acts conscious but isn\'t truly conscious. It\'s both exciting and unsettling to think about.',
          type: 'text',
          timestamp: new Date('2024-12-06T14:30:00Z'),
          sequenceNumber: 7,
          isEdited: false,
          metadata: {
            wordCount: 29,
            characterCount: 180,
            readingTime: 8,
            complexity: 0.7,
            responseTime: 300000
          },
          moderationStatus: 'approved',
          isVisible: true,
          isArchived: false
        }
      ];
      
      setConversation(mockConversation);
      setMessages(mockMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    // TODO: Implement message sending
    console.log('Sending message:', content);
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
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(conversation.status)}`}>
              {conversation.status}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">{conversation.topic}</div>
          
          {conversation.description && (
            <div className="text-sm text-gray-500 mb-3">{conversation.description}</div>
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
        />
        
        <MessageInput 
          onSendMessage={handleSendMessage}
          conversationStatus={conversation.status}
        />
      </div>
    </div>
  );
}