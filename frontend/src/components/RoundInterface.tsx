import { 
  useMatch, 
  useCurrentRound, 
  useMyIdentity,
  useIsMyTurn,
  useIsVotingPhase,
  useRoundResponses,
  useHasParticipantResponded,
} from "@/store/server-state/match.queries";
import { hasAllResponses } from "@shared/schemas";
import PromptDisplay from "./PromptDisplay";
import PhraseComposer from "./ResponseInput";
import HumanOrRobot from "./HumanOrRobot";
import ParticipantWaitingStatus from "./ParticipantWaitingStatus";
import { Card } from "./ui";

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
  const allResponsesIn = hasAllResponses(currentRound);

  // Determine current phase
  const isPromptPhase = currentRound.prompt && isMyTurn;
  const isWaitingForOthers = hasSubmittedResponse && !allResponsesIn;
  const isRecognitionPhase = allResponsesIn && isVotingPhase;

  return (
    <div className="space-y-4">
      {/* Match Progress Header */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Round {currentRoundNumber} of {totalRounds}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-slate-600">
                {isPromptPhase && "✍️ Write your response"}
                {isWaitingForOthers && "⏳ Waiting for other participants..."}
                {isRecognitionPhase && "🤖 Human or Robot?"}
              </span>
            </div>
          </div>

          {/* Round Progress Bar */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalRounds }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < currentRoundNumber - 1
                    ? "bg-green-500"
                    : i === currentRoundNumber - 1
                    ? "bg-blue-500"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Current Phase Content */}
      {isPromptPhase && (
        <>
          <PromptDisplay prompt={currentRound.prompt} />
          <PhraseComposer />
        </>
      )}

      {isWaitingForOthers && (
        <ParticipantWaitingStatus myIdentity={myIdentity} />
      )}

      {isRecognitionPhase && (
        <HumanOrRobot 
          responses={roundResponses} 
          presentationOrder={currentRound.presentationOrder}
        />
      )}
    </div>
  );
}