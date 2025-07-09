'use client';

import { useSessionStore } from '@/store/sessionStore';
import ChatInterface from '@/components/ChatInterface';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MatchPage() {
  const { match, connectionStatus } = useSessionStore();
  const router = useRouter();
  
  // Redirect to home if not in a match
  useEffect(() => {
    if (!match && connectionStatus === 'disconnected') {
      router.push('/');
    }
  }, [match, connectionStatus, router]);

  return (
    <div className="min-h-screen bg-slate-50" data-page="match">
      <ChatInterface />
    </div>
  );
}