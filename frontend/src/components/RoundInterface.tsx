import { 
  useMatch, 
  useCurrentRound, 
  useMyIdentity,
  useIsMyTurn,
  useIsVotingPhase,
  useRoundResponses,
  useHasParticipantResponded,
} from "@/store/server-state/match.queries";
import { calculateCumulativeScores } from "@/utils/scoring";
import CompactScoreboard from "./CompactScoreboard";
import MatchAccordion from "./MatchAccordion";

export default function RoundInterface() {
  // Server state
  const { data: match } = useMatch(sessionStorage.getItem('currentMatchId'));
  const currentRound = useCurrentRound();
  const myIdentity = useMyIdentity();
  const isMyTurn = useIsMyTurn();
  const isVotingPhase = useIsVotingPhase();
  const roundResponses = useRoundResponses();
  const hasSubmittedResponse = useHasParticipantResponded(myIdentity || 'A');
  
  if (!match || !currentRound || !myIdentity) {
    return null;
  }

  const currentRoundNumber = match.currentRound;
  const totalRounds = match.totalRounds;
  
  // Calculate cumulative scores
  const cumulativeScores = calculateCumulativeScores(match.rounds);

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Fixed header with compact scoreboard */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-slate-50 border-b border-slate-200 p-4">
        {Object.keys(cumulativeScores).length > 0 ? (
          <CompactScoreboard
            scores={cumulativeScores}
            currentPlayer={myIdentity}
            roundNumber={currentRoundNumber}
            totalRounds={totalRounds}
          />
        ) : (
          <div className="text-center text-sm text-slate-600">
            Round {currentRoundNumber} of {totalRounds}
          </div>
        )}
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4">
        <MatchAccordion
          match={match}
          currentRound={currentRound}
          myIdentity={myIdentity}
          isMyTurn={isMyTurn}
          isVotingPhase={isVotingPhase}
          roundResponses={roundResponses}
          hasSubmittedResponse={hasSubmittedResponse}
        />
      </div>
    </div>
  );
}