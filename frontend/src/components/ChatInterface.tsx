'use client';

import { useEffect, useRef, useState } from 'react';
import { FiSend, FiLogOut } from 'react-icons/fi';
import { useSessionStore } from '@/store/sessionStore';
import { useAuth } from '@/contexts/AuthContext';
import MessageList from './MessageList';
import ParticipantBar from './ParticipantBar';
import SessionTimer from './SessionTimer';
import { BUILD_TIMESTAMP } from '../build-timestamp';

export default function ChatInterface() {
  const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    connectionStatus,
    myIdentity,
    isSessionActive,
    isRevealed,
    connect,
    disconnect,
    sendMessage,
    reset
  } = useSessionStore();

  const { user, signOut } = useAuth();

  // Auto-connect on mount
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect();
    }
  }, [connect, connectionStatus]);

  // Focus input when connected
  useEffect(() => {
    if (connectionStatus === 'connected' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [connectionStatus]);

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content || connectionStatus !== 'connected') return;

    sendMessage(content);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewSession = () => {
    reset();
    setTimeout(() => connect(), 100);
  };

  if (connectionStatus === 'disconnected' || connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {connectionStatus === 'disconnected' ? 'Connecting...' : 'Joining Session...'}
          </h2>
          <p className="text-gray-600">
            Connecting to 2H+2AI conversation
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            Failed to connect to the WebSocket server. 
            Check the browser console for more details.
          </p>
          <div className="space-y-2">
            <button
              onClick={connect}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 w-full"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRevealed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Session Complete! 🎭</h2>
          <p className="text-lg text-gray-700 mb-6">
            Time&apos;s up! Here&apos;s who was who:
          </p>
          
          {/* Identity reveal will be implemented here */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">Identity reveal coming soon...</p>
          </div>
          
          <button
            onClick={handleNewSession}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">am I an AI? v.2 ({BUILD_TIMESTAMP})</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user?.email} • You are participant <span className="font-mono font-bold text-primary-600">{myIdentity}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SessionTimer />
            <button
              onClick={disconnect}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Leave Session
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <FiLogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Participants */}
      <ParticipantBar />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input */}
      {isSessionActive && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                maxLength={280}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend size={20} />
              </button>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {messageInput.length}/280
            </div>
          </div>
        </div>
      )}
    </div>
  );
}