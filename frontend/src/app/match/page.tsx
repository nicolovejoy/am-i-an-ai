'use client';

import { useSessionStore } from '@/store/sessionStore';
import ChatInterface from '@/components/ChatInterface';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MatchPage() {
  const { match, connectionStatus } = useSessionStore();
  const router = useRouter();
  
  // Only redirect if we're sure there's no match attempt happening
  useEffect(() => {
    // Don't redirect if we're connecting or have a match
    if (connectionStatus === 'connecting' || match) {
      return;
    }
    
    // Only redirect if disconnected AND no match after a short delay
    // This gives time for the match creation to complete
    if (connectionStatus === 'disconnected' && !match) {
      const timeout = setTimeout(() => {
        // Re-check after delay
        const state = useSessionStore.getState();
        if (state.connectionStatus === 'disconnected' && !state.match) {
          router.push('/dashboard');
        }
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timeout);
    }
  }, [match, connectionStatus, router]);

  return (
    <div className="min-h-screen bg-slate-50" data-page="match">
      <ChatInterface />
    </div>
  );
}