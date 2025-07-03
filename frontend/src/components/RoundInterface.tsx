'use client';

import { useSessionStore } from '@/store/sessionStore';
import PromptDisplay from './PromptDisplay';
import ResponseInput from './ResponseInput';
import RoundVoting from './RoundVoting';
import { Card } from './ui';

export default function RoundInterface() {
  const { 
    match, 
    currentPrompt, 
    hasSubmittedResponse, 
    hasSubmittedVote,
    roundResponses,
    isSessionActive,
    timeRemaining 
  } = useSessionStore();

  if (!match || !isSessionActive) {
    return null;
  }

  const currentRound = match.currentRound;
  const totalRounds = match.totalRounds;
  const allResponsesIn = Object.keys(roundResponses).length === 4;

  // Determine current phase of the round
  const isPromptPhase = currentPrompt && !hasSubmittedResponse;
  const isVotingPhase = allResponsesIn && !hasSubmittedVote;
  const isWaitingForOthers = hasSubmittedResponse && !allResponsesIn;

  return (
    <div className="space-y-4">
      {/* Round Progress Header */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Round {currentRound} of {totalRounds}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-slate-600">
                {isPromptPhase && "💭 Respond to prompt"}
                {isWaitingForOthers && "⏳ Waiting for others..."}
                {isVotingPhase && "🗳️ Vote on responses"}
              </span>
              {timeRemaining !== null && (
                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
          
          {/* Round Progress Bar */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalRounds }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < currentRound - 1 
                    ? 'bg-green-500' 
                    : i === currentRound - 1 
                    ? 'bg-blue-500' 
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Current Phase Content */}
      {isPromptPhase && (
        <>
          <PromptDisplay prompt={currentPrompt} />
          <ResponseInput />
        </>
      )}

      {isWaitingForOthers && (
        <Card className="text-center">
          <div className="py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Response submitted!</h3>
            <p className="text-slate-600">
              Waiting for other participants to respond...
            </p>
            <div className="mt-4 text-sm text-slate-500">
              {Object.keys(roundResponses).length}/4 responses received
            </div>
          </div>
        </Card>
      )}

      {isVotingPhase && (
        <RoundVoting responses={roundResponses} />
      )}
    </div>
  );
}