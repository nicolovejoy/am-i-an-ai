'use client';

import { useSessionStore } from '@/store/sessionStore';
import ChatInterface from '@/components/ChatInterface';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MatchPage() {
  const { match, connectionStatus, pollMatchUpdates } = useSessionStore();
  const router = useRouter();
  
  // Check for match in sessionStorage on mount
  useEffect(() => {
    const checkForMatch = async () => {
      // If we already have a match, we're good
      if (match) return;
      
      // Check sessionStorage for matchId
      const matchId = window.sessionStorage.getItem('currentMatchId');
      if (matchId) {
        // Try to reload the match data
        await pollMatchUpdates(matchId);
        return;
      }
      
      // Only redirect if no match and no matchId in storage
      if (connectionStatus === 'disconnected' && !match) {
        const timeout = setTimeout(() => {
          const state = useSessionStore.getState();
          if (state.connectionStatus === 'disconnected' && !state.match) {
            router.push('/dashboard');
          }
        }, 1000);
        
        return () => clearTimeout(timeout);
      }
    };
    
    checkForMatch();
  }, [match, connectionStatus, router, pollMatchUpdates]);

  return (
    <div className="min-h-screen bg-slate-50" data-page="match">
      <ChatInterface />
    </div>
  );
}