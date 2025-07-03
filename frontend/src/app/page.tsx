'use client';

import { useSessionStore } from '@/store/sessionStore';
import ChatInterface from '@/components/ChatInterface';
import WelcomeDashboard from '@/components/WelcomeDashboard';
import { Navigation } from '@/components/Navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Home() {
  const { match, connectionStatus, testingMode } = useSessionStore();
  
  // Show chat interface if user is in a match or connected/connecting
  const showChatInterface = match || connectionStatus === 'connected' || connectionStatus === 'connecting' || testingMode;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        {!showChatInterface && <Navigation />}
        {showChatInterface ? (
          <ChatInterface />
        ) : (
          <WelcomeDashboard />
        )}
      </div>
    </ProtectedRoute>
  );
}