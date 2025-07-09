'use client';

import { useEffect, useRef, useState } from 'react';
import { FiSend, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { useAuth } from '@/contexts/AuthContext';
import MessageList from './MessageList';
import ParticipantBar from './ParticipantBar';
import RoundInterface from './RoundInterface';
import MatchComplete from './MatchComplete';
import { BUILD_TIMESTAMP } from '../build-timestamp';
import { Card, Button } from './ui';

export default function ChatInterface() {
  const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    connectionStatus,
    lastError,
    myIdentity,
    match,
    messages,
    currentPrompt,
    isSessionActive,
    isRevealed,
    connect,
    disconnect,
    sendMessage,
    reset,
  } = useSessionStore();

  const { user, signOut } = useAuth();
  const router = useRouter();

  // Auto-connect on mount (only if no match exists)
  useEffect(() => {
    // Don't call connect if we have a match or are already connecting
    // connect() is a legacy method that redirects to dashboard
    if (connectionStatus === 'disconnected' && !match) {
      // Instead of calling connect, we should show a message or redirect
      // But don't auto-redirect as the match page handles that
    }
  }, [connectionStatus, match]);

  // Focus input when connected
  useEffect(() => {
    if (connectionStatus === 'connected' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [connectionStatus]);

  // Poll for match state updates every second when in active match
  useEffect(() => {
    if (!match) return;
    
    const pollInterval = setInterval(() => {
      useSessionStore.getState().pollMatchUpdates(match.matchId);
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [match]);

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

  const handleLeaveMatch = () => {
    disconnect();
    router.push('/dashboard');
  };

  // Show testing mode toggle if not connected and not in error state and not in testing mode
  if (connectionStatus === 'disconnected' || connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 max-w-md w-full mx-4">
          <Card className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {connectionStatus === 'disconnected' ? 'Connecting...' : 'Joining Session...'}
            </h2>
            <div className="text-slate-600 space-y-1">
              <p>
                Connecting to match with four participants
              </p>
            </div>
          </Card>
          
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center max-w-md w-full mx-4">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
          <div className="text-slate-600 mb-4 space-y-2">
            <p>
              {lastError || 'Failed to connect to the API server.'}
            </p>
            <p className="text-sm">
              Please check your internet connection and try again.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => {
                reset();
                setTimeout(() => connect(), 100);
              }}
              fullWidth
            >
              Reset & Retry Connection
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              fullWidth
            >
              Reload Page
            </Button>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              fullWidth
            >
              Sign Out
            </Button>
          </div>
          <div className="mt-4">
            </div>
        </Card>
      </div>
    );
  }

  // Show match complete screen when match is completed
  if (match?.status === 'completed' && myIdentity) {
    return <MatchComplete match={match} myIdentity={myIdentity} />;
  }
  
  // Legacy reveal screen (kept for backward compatibility)
  if (isRevealed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Session Complete! 🎭</h2>
          <p className="text-lg text-slate-700 mb-6">
            Time&apos;s up! Here&apos;s who was who:
          </p>
          
          {/* Identity reveal will be implemented here */}
          <div className="mb-6 p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-600">Identity reveal coming soon...</p>
          </div>
          
          <Button
            onClick={handleNewSession}
            size="lg"
          >
            Start New Session
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-2 sm:p-4 gap-2">
      {/* Header */}
      <Card className="text-center" padding="sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Robot Orchestra</h1>
            <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">
              Figure out who&apos;s human and who&apos;s AI
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              onClick={handleLeaveMatch}
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
            >
              Leave Match
            </Button>
            <Button
              onClick={handleLeaveMatch}
              variant="ghost"
              size="sm"
              className="sm:hidden"
            >
              Leave
            </Button>
          </div>
        </div>
        
        {/* Game info */}
        <div className="flex justify-between items-center text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
          <span className="hidden sm:inline">
            Round {match?.currentRound || 1} of {match?.totalRounds || 5}
          </span>
          <span className="sm:hidden">
            R{match?.currentRound || 1}
          </span>
          <span>💬 {messages?.length || 0}</span>
          <span className="hidden sm:inline">
            You are participant <span className="font-semibold text-blue-600">{myIdentity}</span>
          </span>
          <span className="sm:hidden font-semibold text-blue-600">
            You: {myIdentity}
          </span>
        </div>
      </Card>

      {/* Participants */}
      <ParticipantBar />

      {/* Main Content - Round Interface or Legacy Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {match && currentPrompt ? (
          <RoundInterface />
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden" padding="sm">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <MessageList />
            </div>
            
            {/* Legacy Input - Only show if not in round mode */}
            {isSessionActive && !currentPrompt && (
              <div className="mt-4">
                <div className="flex gap-2 sm:gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50 placeholder-slate-500 text-sm sm:text-base"
                    maxLength={280}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-blue-600 text-white p-2 sm:p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 min-w-[40px] sm:min-w-[48px]"
                  >
                    <FiSend size={16} className="sm:hidden" />
                    <FiSend size={20} className="hidden sm:block" />
                  </button>
                </div>
                <div className="text-right text-xs text-slate-500 mt-1">
                  {messageInput.length}/280
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}