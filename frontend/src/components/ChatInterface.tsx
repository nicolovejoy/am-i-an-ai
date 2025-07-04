'use client';

import { useEffect, useRef, useState } from 'react';
import { FiSend, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { useAuth } from '@/contexts/AuthContext';
import MessageList from './MessageList';
import ParticipantBar from './ParticipantBar';
import SessionTimer from './SessionTimer';
import RoundInterface from './RoundInterface';
import { TestingModeToggle } from './TestingModeToggle';
import { BUILD_TIMESTAMP } from '../build-timestamp';
import { Card, Button } from './ui';

export default function ChatInterface() {
  const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    connectionStatus,
    retryCount,
    lastError,
    myIdentity,
    match,
    messages,
    currentPrompt,
    isSessionActive,
    isRevealed,
    testingMode,
    connect,
    disconnect,
    sendMessage,
    reset,
    startTestingMode
  } = useSessionStore();

  const { user, signOut } = useAuth();
  const router = useRouter();

  // Auto-connect on mount (unless in testing mode)
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !testingMode) {
      connect();
    }
  }, [connect, connectionStatus, testingMode]);

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
    if (!testingMode) {
      setTimeout(() => connect(), 100);
    }
  };

  const handleLeaveMatch = () => {
    disconnect();
    router.push('/');
  };

  // Show testing mode toggle if not connected and not in error state and not in testing mode
  if ((connectionStatus === 'disconnected' || connectionStatus === 'connecting') && !testingMode) {
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
                Connecting to table for four conversation
              </p>
              {retryCount > 0 && (
                <p className="text-sm">
                  Reconnecting... (attempt {retryCount + 1})
                </p>
              )}
            </div>
          </Card>
          
          <TestingModeToggle onActivate={startTestingMode} />
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error' && !testingMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center max-w-md w-full mx-4">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
          <div className="text-slate-600 mb-4 space-y-2">
            <p>
              {lastError || 'Failed to connect to the WebSocket server.'}
            </p>
            {retryCount > 0 && (
              <p className="text-sm">
                Retry attempts: {retryCount}/5
              </p>
            )}
            <p className="text-sm">
              Please check your internet connection and try again.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => {
                reset();
                if (!testingMode) {
                  setTimeout(() => connect(), 100);
                }
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
            <TestingModeToggle onActivate={startTestingMode} />
          </div>
        </Card>
      </div>
    );
  }

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
            <SessionTimer />
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