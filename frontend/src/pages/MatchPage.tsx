import { useSessionStore } from '../store/sessionStore';
import ChatInterface from '../components/ChatInterface';
import { useNavigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';

// Wrap in Suspense to handle loading states better
function MatchContent() {
  const { match, connectionStatus, pollMatchUpdates } = useSessionStore();
  const navigate = useNavigate();
  
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
            navigate('/dashboard');
          }
        }, 1000);
        
        return () => clearTimeout(timeout);
      }
    };
    
    checkForMatch();
  }, [match, connectionStatus, navigate, pollMatchUpdates]);

  return <ChatInterface />;
}

export default function MatchPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-page="match">
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