"use client";

import React from 'react';
import type { Message } from '@/types/messages';

interface MessageItemProps {
  message: Message;
  participant?: {
    personaId: string;
    personaName: string;
    personaType: 'human' | 'ai_agent' | 'ai_ambiguous';
    isRevealed: boolean;
  };
  isConsecutive?: boolean;
}

export function MessageItem({ message, participant, isConsecutive = false }: MessageItemProps) {
  if (!participant) {
    return null;
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatReadingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s read`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m read`;
  };

  // Align messages based on persona type: AI on left, human on right
  const alignLeft = participant.personaType === 'ai_agent' || participant.personaType === 'ai_ambiguous';

  return (
    <div className={`flex ${alignLeft ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[70%] ${alignLeft ? 'mr-auto' : 'ml-auto'}`}>
        {/* Author and timestamp (only show if not consecutive) */}
        {!isConsecutive && (
          <div className={`flex items-center space-x-2 mb-2 ${alignLeft ? 'justify-start' : 'justify-end'}`}>
            <div className="flex items-center space-x-2">
              {/* Persona indicator */}
              <div
                className={`w-2 h-2 rounded-full ${
                  participant.personaType === 'human'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
                title={participant.isRevealed 
                  ? `${participant.personaName} (${participant.personaType === 'human' ? 'Human' : 'AI'})`
                  : participant.personaName
                }
              />
              
              {/* Persona name */}
              <span className="text-sm font-medium text-gray-700">
                {participant.personaName}
              </span>
              
              {/* Revealed type badge */}
              {participant.isRevealed && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {participant.personaType === 'human' ? 'Human' : 'AI'}
                </span>
              )}
            </div>
            
            {/* Timestamp */}
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            relative px-4 py-3 rounded-lg shadow-sm
            ${alignLeft 
              ? 'bg-white border border-gray-200 text-gray-800' 
              : 'bg-[#8B6B4A] text-white'
            }
          `}
        >
          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Message metadata */}
          <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
            alignLeft ? 'border-gray-100' : 'border-[#7A5A3A]'
          }`}>
            <div className="flex items-center space-x-3 text-xs">
              <span className={alignLeft ? 'text-gray-400' : 'text-[#D4B59F]'}>
                {message.metadata.wordCount} words
              </span>
              <span className={alignLeft ? 'text-gray-400' : 'text-[#D4B59F]'}>
                {formatReadingTime(message.metadata.readingTime)}
              </span>
            </div>

            {/* Placeholder action buttons */}
            <div className="flex items-center space-x-1">
              <button
                className={`
                  p-1 rounded transition-colors
                  ${alignLeft 
                    ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' 
                    : 'hover:bg-[#7A5A3A] text-[#D4B59F] hover:text-white'
                  }
                `}
                title="Reply (coming soon)"
                disabled
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              
              <button
                className={`
                  p-1 rounded transition-colors
                  ${alignLeft 
                    ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' 
                    : 'hover:bg-[#7A5A3A] text-[#D4B59F] hover:text-white'
                  }
                `}
                title="React (coming soon)"
                disabled
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {message.isEdited && (
                <span className={`text-xs ${alignLeft ? 'text-gray-400' : 'text-[#D4B59F]'}`}>
                  edited
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Show timestamp for consecutive messages on hover */}
        {isConsecutive && (
          <div className={`text-xs text-gray-400 mt-1 opacity-0 hover:opacity-100 transition-opacity ${
            alignLeft ? 'text-left' : 'text-right'
          }`}>
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}