import { Card } from "./ui";
import { useMatch, useCurrentRound } from "@/store/server-state/match.queries";
import type { Identity } from "@shared/schemas";

interface ParticipantWaitingStatusProps {
  myIdentity: Identity;
}

export default function ParticipantWaitingStatus({ myIdentity }: ParticipantWaitingStatusProps) {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  const currentRound = useCurrentRound();
  
  if (!match || !currentRound) return null;
  
  // Get all participant identities from the match
  const allIdentities: Identity[] = ['A', 'B', 'C', 'D'].slice(0, match.participants.length);
  
  // Check who has responded
  const responses = currentRound.responses || {};
  const respondedCount = Object.keys(responses).length;
  const totalParticipants = match.participants.length;
  
  // Create participant status list
  const participantStatuses = allIdentities.map(identity => ({
    identity,
    hasResponded: !!responses[identity],
    isMe: identity === myIdentity
  }));
  
  const waitingCount = totalParticipants - respondedCount;
  
  return (
    <Card className="text-center">
      <div className="py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium mb-2">Response submitted!</h3>
        <p className="text-slate-600 mb-6">
          {waitingCount === 1 
            ? "Waiting for 1 more participant..." 
            : `Waiting for ${waitingCount} more participants...`}
        </p>
        
        {/* Participant Status Grid */}
        <div className="space-y-2 max-w-sm mx-auto">
          <div className="text-sm font-medium text-slate-700 mb-3">
            Participant Status:
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {participantStatuses.map(({ identity, hasResponded, isMe }) => (
              <div 
                key={identity} 
                className={`
                  rounded-lg p-3 flex items-center justify-between
                  ${hasResponded ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}
                  ${isMe ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Player {identity}
                  </span>
                  {isMe && (
                    <span className="text-xs text-blue-600 font-medium">
                      (You)
                    </span>
                  )}
                </div>
                <span className="text-lg">
                  {hasResponded ? '✅' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="text-sm text-slate-500">
            {respondedCount}/{totalParticipants} responses received
          </div>
          
          <div className="text-xs text-slate-400 italic max-w-sm mx-auto mt-4">
            💡 The round will continue once all participants have responded
          </div>
        </div>
      </div>
    </Card>
  );
}