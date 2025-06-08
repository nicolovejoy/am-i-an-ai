"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FullPageLoader } from './LoadingSpinner';

interface ConversationParticipant {
  personaId: string;
  personaName: string;
  personaType: string;
  isRevealed: boolean;
  role: 'initiator' | 'responder';
  joinedAt: Date;
  lastActiveAt: Date;
}

interface ConversationSummary {
  id: string;
  title: string;
  topic: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'terminated';
  participants: ConversationParticipant[];
  messageCount: number;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  qualityScore?: number;
  topicTags: string[];
}


export default function ConversationList() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchConversations();
  }, [selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock conversation data that matches our database schema
      const mockConversations: ConversationSummary[] = [
        {
          id: '01234567-1111-1111-1111-012345678901',
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
          messageCount: 15,
          createdAt: new Date('2024-12-06T10:00:00Z'),
          startedAt: new Date('2024-12-06T10:05:00Z'),
          qualityScore: 4.2,
          topicTags: ['philosophy', 'consciousness', 'ethics'],
        },
        {
          id: '01234567-4444-4444-4444-012345678901',
          title: 'Creative Writing Challenge',
          topic: 'Collaborative storytelling',
          description: 'Building a story together, one paragraph at a time',
          status: 'paused',
          participants: [
            {
              personaId: '01234567-5555-5555-5555-012345678901',
              personaName: 'Creative Writer',
              personaType: 'human',
              isRevealed: true,
              role: 'initiator',
              joinedAt: new Date('2024-12-05T16:00:00Z'),
              lastActiveAt: new Date('2024-12-05T18:45:00Z'),
            },
            {
              personaId: '01234567-6666-6666-6666-012345678901',
              personaName: 'Story Weaver',
              personaType: 'ai_agent',
              isRevealed: false,
              role: 'responder',
              joinedAt: new Date('2024-12-05T16:02:00Z'),
              lastActiveAt: new Date('2024-12-05T18:47:00Z'),
            },
          ],
          messageCount: 8,
          createdAt: new Date('2024-12-05T16:00:00Z'),
          startedAt: new Date('2024-12-05T16:02:00Z'),
          qualityScore: 3.8,
          topicTags: ['creative-writing', 'fiction', 'collaboration'],
        },
        {
          id: '01234567-7777-7777-7777-012345678901',
          title: 'Tech Innovation Discussion',
          topic: 'The future of AI and human collaboration',
          status: 'completed',
          participants: [
            {
              personaId: '01234567-8888-8888-8888-012345678901',
              personaName: 'Tech Enthusiast',
              personaType: 'human',
              isRevealed: true,
              role: 'initiator',
              joinedAt: new Date('2024-12-04T09:00:00Z'),
              lastActiveAt: new Date('2024-12-04T11:30:00Z'),
            },
            {
              personaId: '01234567-9999-9999-9999-012345678901',
              personaName: 'Innovation Bot',
              personaType: 'ai_agent',
              isRevealed: true,
              role: 'responder',
              joinedAt: new Date('2024-12-04T09:03:00Z'),
              lastActiveAt: new Date('2024-12-04T11:28:00Z'),
            },
          ],
          messageCount: 24,
          createdAt: new Date('2024-12-04T09:00:00Z'),
          startedAt: new Date('2024-12-04T09:03:00Z'),
          endedAt: new Date('2024-12-04T11:30:00Z'),
          qualityScore: 4.7,
          topicTags: ['technology', 'ai', 'innovation', 'future'],
        },
      ];
      
      // Filter by status if needed
      let filteredConversations = mockConversations;
      if (selectedStatus !== 'all') {
        filteredConversations = mockConversations.filter(
          conv => conv.status === selectedStatus
        );
      }
      
      setConversations(filteredConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <FullPageLoader text="Loading conversations..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Error Loading Conversations</div>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#2D3748]">Your Conversations</h2>
        
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
        >
          <option value="all">All Conversations</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600 mb-4">No conversations found</div>
          <div className="text-gray-500 text-sm">Start a new conversation to get started!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Link
                    href={`/conversations/${conversation.id}`}
                    className="text-lg font-medium text-[#2D3748] hover:text-[#8B6B4A] transition-colors"
                  >
                    {conversation.title}
                  </Link>
                  <div className="text-sm text-gray-600 mt-1">{conversation.topic}</div>
                  {conversation.description && (
                    <div className="text-sm text-gray-500 mt-2">{conversation.description}</div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </span>
                  <div className="text-sm text-gray-500">
                    {formatTimeAgo(conversation.createdAt)}
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center space-x-4 mb-3">
                <div className="text-sm text-gray-600">Participants:</div>
                <div className="flex space-x-3">
                  {conversation.participants.map((participant) => (
                    <div
                      key={participant.personaId}
                      className="flex items-center space-x-1"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          participant.personaType === 'human'
                            ? 'bg-blue-500'
                            : participant.personaType === 'ai_agent'
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        {participant.personaName}
                        {participant.isRevealed && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({participant.personaType})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{conversation.messageCount} messages</span>
                  {conversation.qualityScore && (
                    <span>Quality: {conversation.qualityScore.toFixed(1)}/5</span>
                  )}
                </div>
                
                {conversation.topicTags.length > 0 && (
                  <div className="flex space-x-1">
                    {conversation.topicTags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {conversation.topicTags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{conversation.topicTags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}