import { 
  useMatch, 
  useCurrentRound, 
  useMyIdentity,
  useIsMyTurn,
  useIsVotingPhase,
  useRoundResponses,
  useHasParticipantResponded,
} from "@/store/server-state/match.queries";
import { hasAllResponses, Identity } from "@shared/schemas";
import PromptDisplay from "./PromptDisplay";
import PhraseComposer from "./ResponseInput.v2";
import HumanOrRobot from "./HumanOrRobot";
import { Card } from "./ui";

export default function RoundInterface() {
  // Server state
  const { data: match } = useMatch(sessionStorage.getItem('currentMatchId'));
  const currentRound = useCurrentRound();
  const myIdentity = useMyIdentity();
  const isMyTurn = useIsMyTurn();
  const isVotingPhase = useIsVotingPhase();
  const roundResponses = useRoundResponses();
  
  if (!match || !currentRound || !myIdentity) {
    return null;
  }

  const currentRoundNumber = match.currentRound;
  const totalRounds = match.totalRounds;
  const allResponsesIn = hasAllResponses(currentRound);
  const hasSubmittedResponse = useHasParticipantResponded(myIdentity);

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
        <Card className="text-center">
          <div className="py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Response submitted!</h3>
            <p className="text-slate-600">
              Waiting for other participants...
            </p>
            <div className="mt-4 text-sm text-slate-500">
              {Object.keys(roundResponses).length}/4 responses received
            </div>
          </div>
        </Card>
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