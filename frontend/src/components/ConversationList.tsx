"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FullPageLoader } from './LoadingSpinner';
import { api } from '@/services/apiClient';

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
      
      const data = await api.conversations.list();
      
      // Transform the API response to match our component interface
      const apiConversations = data.conversations || [];
      const transformedConversations: ConversationSummary[] = apiConversations.map((conv: {
        id: string;
        title: string;
        topic: string;
        description?: string;
        status: string;
        participants?: unknown[];
        messageCount?: number;
        createdAt: string;
        startedAt?: string;
        endedAt?: string;
        qualityScore?: number;
        topicTags?: string[];
      }) => ({
        id: conv.id,
        title: conv.title,
        topic: conv.topic,
        description: conv.description || '',
        status: conv.status,
        participants: [], // We'll fetch this separately if needed
        messageCount: conv.messageCount || 0,
        createdAt: new Date(conv.createdAt),
        startedAt: conv.startedAt ? new Date(conv.startedAt) : undefined,
        endedAt: conv.endedAt ? new Date(conv.endedAt) : undefined,
        qualityScore: conv.qualityScore || undefined,
        topicTags: conv.topicTags || [],
      }));
      
      // Filter by status if needed
      let filteredConversations = transformedConversations;
      if (selectedStatus !== 'all') {
        filteredConversations = transformedConversations.filter(
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
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="text-red-600 font-medium mb-2">Error Loading Conversations</div>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <div className="space-y-2">
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mr-2"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Refresh Page
          </button>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          If this problem persists, please check your connection or contact support.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-[#2D3748]">Your Conversations</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Start New Conversation Button */}
          <Link
            href="/conversations/new"
            className="inline-flex items-center px-4 py-2 bg-[#8B6B4A] text-white text-sm font-medium rounded-md hover:bg-[#7A5A3A] focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Conversation
          </Link>
          
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
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600 mb-4">No conversations found</div>
          <div className="text-gray-500 text-sm mb-6">Start your first conversation to begin engaging with personas!</div>
          <Link
            href="/conversations/new"
            className="inline-flex items-center px-6 py-3 bg-[#8B6B4A] text-white font-medium rounded-md hover:bg-[#7A5A3A] focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:ring-offset-2 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Conversation
          </Link>
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
                  {conversation.participants.length > 0 ? (
                    conversation.participants.map((participant) => (
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
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Loading participants...</span>
                  )}
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