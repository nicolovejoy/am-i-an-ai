"use client";

import React from 'react';
import Link from 'next/link';

interface JoinResult {
  success: boolean;
  message: string;
  conversation: {
    id: string;
    title: string;
    topic: string;
    participantCount: number;
  };
  permissions?: any;
}

interface JoinSuccessMessageProps {
  joinResult: JoinResult;
  onDismiss?: () => void;
}

export default function JoinSuccessMessage({ joinResult, onDismiss }: JoinSuccessMessageProps) {
  if (!joinResult.success) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md bg-white border border-green-200 rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-gray-900">
              Successfully Joined!
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {joinResult.message}
            </div>
            
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-900">
                {joinResult.conversation.title}
              </div>
              <div className="text-sm text-gray-600">
                {joinResult.conversation.topic}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {joinResult.conversation.participantCount} participants
              </div>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <Link
                href={`/conversations/${joinResult.conversation.id}`}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                View Conversation
              </Link>
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
          
          {onDismiss && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}