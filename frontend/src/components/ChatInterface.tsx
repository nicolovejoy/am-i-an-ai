import { useNavigate } from "react-router-dom";
import { useMatch, useMyIdentity, useCurrentRound, useMatchStatus } from "@/store/server-state/match.queries";
import { useLeaveMatch } from "@/store/server-state/match.mutations";
import { useUIStore } from "@/store/ui-state/ui.store";
import MessageList from "./MessageList";
import ParticipantBar from "./ParticipantBar";
import RoundInterface from "./RoundInterface";
import MatchComplete from "./MatchComplete";
import { Card, Button } from "./ui";

export default function ChatInterface() {
  const navigate = useNavigate();
  
  // Get match ID from session storage
  const matchId = sessionStorage.getItem('currentMatchId');
  
  // Server state
  const { data: match, isLoading, error } = useMatch(matchId);
  const myIdentity = useMyIdentity();
  const currentRound = useCurrentRound();
  const { isComplete } = useMatchStatus();
  
  // Mutations
  const leaveMatch = useLeaveMatch();
  
  // UI state
  const resetUI = useUIStore(state => state.resetUI);

  // Set up sync engine when match is loaded
  // TODO: Fix sync engine connection issues
  /*
  useEffect(() => {
    if (matchId && !syncEngineRef.current) {
      syncEngineRef.current = createSyncEngine(queryClient, matchId);
      syncEngineRef.current.connect();
    }

    return () => {
      if (syncEngineRef.current) {
        syncEngineRef.current.disconnect();
        syncEngineRef.current = null;
      }
    };
  }, [matchId]); // Only depend on matchId, not match object
  */

  // Handle leave match
  const handleLeaveMatch = () => {
    if (matchId) {
      leaveMatch.mutate(undefined, {
        onSuccess: () => {
          resetUI();
          navigate("/dashboard");
        },
      });
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center max-w-md w-full mx-4">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading match...</h2>
          <p className="text-sm text-slate-600">Please wait while we load your game</p>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-sm text-slate-600 mb-4">
            {error?.message || "Failed to load match"}
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Show match complete screen when match is completed
  if (isComplete && myIdentity) {
    return <MatchComplete match={match} myIdentity={myIdentity} />;
  }

  // Main game interface
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        <Card 
          className="bg-white/95 backdrop-blur-lg shadow-sm z-10 mx-2 sm:mx-4 lg:mx-auto lg:max-w-4xl mt-2 sm:mt-4" 
          padding="sm"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Robot Orchestra
            </h1>
            <Button
              onClick={handleLeaveMatch}
              variant="ghost"
              size="sm"
            >
              Leave Match
            </Button>
          </div>
        </Card>

        {/* Participants Bar */}
        <div className="px-2 sm:px-4 lg:px-0 lg:max-w-4xl lg:mx-auto">
          <ParticipantBar />
        </div>
      </div>

      {/* Main Content - Round Interface */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full lg:max-w-4xl lg:mx-auto">
          {currentRound ? (
            <RoundInterface />
          ) : (
            <Card className="h-full flex flex-col m-4" padding="sm">
              <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                <MessageList />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}