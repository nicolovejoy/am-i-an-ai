"use client";

import React from 'react';
import { ConversationParticipant } from '@/types/conversations';

interface ConversationParticipantsProps {
  participants: ConversationParticipant[];
}

export default function ConversationParticipants({ participants }: ConversationParticipantsProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'host':
        return 'bg-blue-100 text-blue-800';
      case 'moderator':
        return 'bg-purple-100 text-purple-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">
        {participants.length} participant{participants.length !== 1 ? 's' : ''}
      </div>
      
      {participants.length > 0 && (
        <div className="space-y-2">
          {participants.map((participant, index) => (
            <div key={participant.persona_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Persona {participant.persona_id}
                  </div>
                  <div className="text-xs text-gray-500">
                    Joined {formatTimeAgo(participant.joined_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(participant.role)}`}>
                  {formatRole(participant.role)}
                </span>
                
                {participant.is_revealed && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Revealed
                  </span>
                )}
                
                {participant.left_at && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Left
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {participants.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          No participants yet
        </div>
      )}
    </div>
  );
}