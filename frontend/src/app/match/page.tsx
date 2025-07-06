'use client';

import { useSessionStore } from '@/store/sessionStore';
import ChatInterface from '@/components/ChatInterface';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MatchPage() {
  const { match, connectionStatus, testingMode } = useSessionStore();
  const router = useRouter();
  
  // Redirect to home if not in a match
  useEffect(() => {
    if (!match && connectionStatus === 'disconnected' && !testingMode) {
      router.push('/');
    }
  }, [match, connectionStatus, testingMode, router]);

  return (
    <div className="min-h-screen bg-slate-50" data-page="match">
      <ChatInterface />
    </div>
  );
}