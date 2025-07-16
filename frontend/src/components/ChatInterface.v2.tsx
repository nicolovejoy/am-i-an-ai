import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useMatch, useMyIdentity, useCurrentRound, useMatchStatus } from "@/store/server-state/match.queries";
import { useLeaveMatch } from "@/store/server-state/match.mutations";
import { useUIStore } from "@/store/ui-state/ui.store";
import { createSyncEngine } from "@/store/sync-engine/sync";
import { queryClient } from "@/providers/QueryProvider";
import MessageList from "./MessageList";
import ParticipantBar from "./ParticipantBar";
import RoundInterface from "./RoundInterface";
import MatchComplete from "./MatchComplete";
import { Card, Button } from "./ui";

export default function ChatInterface() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const syncEngineRef = useRef<ReturnType<typeof createSyncEngine> | null>(null);
  
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
  const { resetUI } = useUIStore();

  // Set up sync engine when match is loaded
  useEffect(() => {
    if (match && matchId && !syncEngineRef.current) {
      syncEngineRef.current = createSyncEngine(queryClient, matchId);
      syncEngineRef.current.connect();
    }

    return () => {
      if (syncEngineRef.current) {
        syncEngineRef.current.disconnect();
        syncEngineRef.current = null;
      }
    };
  }, [match, matchId]);

  // Handle leave match
  const handleLeaveMatch = () => {
    if (matchId) {
      leaveMatch.mutate(matchId, {
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with match info */}
      <Card 
        className="bg-white/95 backdrop-blur-lg shadow-sm z-10 mx-2 sm:mx-4 lg:mx-auto lg:max-w-4xl mt-2 sm:mt-4" 
        padding="sm"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Robot Orchestra
            </h1>
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
            Round {match.currentRound} of {match.totalRounds}
          </span>
          <span className="sm:hidden">R{match.currentRound}</span>
          <span className="hidden sm:inline">
            You are participant{" "}
            <span className="font-semibold text-blue-600">{myIdentity}</span>
          </span>
          <span className="sm:hidden font-semibold text-blue-600">
            You: {myIdentity}
          </span>
        </div>
      </Card>

      {/* Participants */}
      <ParticipantBar />

      {/* Main Content - Round Interface */}
      <div className="flex-1 flex flex-col overflow-hidden px-2 sm:px-4 lg:px-0 lg:max-w-4xl lg:mx-auto w-full">
        {currentRound ? (
          <RoundInterface />
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden" padding="sm">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <MessageList />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}