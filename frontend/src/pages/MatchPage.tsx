import ChatInterface from '../components/ChatInterface';
import { useNavigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { useMatch } from '@/store/server-state/match.queries';
import { AdminDebugPanel } from '../components/AdminDebugPanel';

// Wrap in Suspense to handle loading states better
function MatchContent() {
  const navigate = useNavigate();
  const matchId = window.sessionStorage.getItem('currentMatchId');
  const { isLoading } = useMatch(matchId);
  
  // Check for match in sessionStorage on mount
  useEffect(() => {
    // Only redirect if no matchId in storage and we're not loading
    if (!matchId && !isLoading) {
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [matchId, isLoading, navigate]);

  return (
    <>
      <ChatInterface />
      <AdminDebugPanel matchId={matchId || undefined} />
    </>
  );
}

export default function MatchPage() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto" data-page="match">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <MatchContent />
      </Suspense>
    </div>
  );
}