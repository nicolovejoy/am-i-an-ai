"use client";

import React, { useState } from 'react';
import { ConversationListItem } from '@/types/conversations';
import { api } from '@/services/apiClient';

interface Persona {
  id: string;
  name: string;
  description: string;
  personaType: string;
}

interface JoinConversationButtonProps {
  conversation: ConversationListItem;
  onJoinSuccess?: (result: any) => void;
}

export default function JoinConversationButton({ 
  conversation, 
  onJoinSuccess 
}: JoinConversationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [userPersonas, setUserPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render if user can't join
  if (!conversation.permissions.canJoin) {
    return null;
  }

  const handleJoinClick = async () => {
    setError(null);
    setIsLoadingPersonas(true);
    
    try {
      // Fetch user's personas
      const response = await api.personas.list();
      setUserPersonas(response.personas || []);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personas');
    } finally {
      setIsLoadingPersonas(false);
    }
  };

  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersonaId(personaId);
  };

  const handleConfirmJoin = async () => {
    if (!selectedPersonaId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.conversations.join(conversation.id, {
        personaId: selectedPersonaId,
      });

      // Call success callback if provided
      if (onJoinSuccess) {
        onJoinSuccess(result);
      }

      // Close modal on success
      setShowModal(false);
      setSelectedPersonaId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowModal(false);
      setSelectedPersonaId('');
      setError(null);
    }
  };

  return (
    <>
      <button
        onClick={handleJoinClick}
        disabled={isLoadingPersonas}
        className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        {isLoadingPersonas ? 'Loading...' : 'Join Conversation'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select Persona to Join
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700">{conversation.title}</div>
              <div className="text-sm text-gray-600">{conversation.topic}</div>
              <div className="text-xs text-gray-500 mt-1">
                {conversation.participantCount} participants
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm font-medium text-red-800">Failed to join conversation</div>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Choose a persona to represent you:
              </div>
              <div className="space-y-2">
                {userPersonas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona.id)}
                    disabled={isLoading}
                    className={`w-full text-left p-3 border rounded-md transition-colors disabled:opacity-50 ${
                      selectedPersonaId === persona.id
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{persona.name}</div>
                    <div className="text-sm text-gray-600">{persona.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {persona.personaType}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={!selectedPersonaId || isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : 'Confirm Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}