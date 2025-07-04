'use client';

import { useSessionStore } from '@/store/sessionStore';
import PromptDisplay from './PromptDisplay';
import PhraseComposer from './ResponseInput';
import MusicianRecognition from './RoundVoting';
import { Card } from './ui';

export default function MovementInterface() {
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

  const currentMovement = match.currentRound;
  const totalMovements = match.totalRounds;
  const allPhrasesIn = Object.keys(roundResponses).length === 4;

  // Determine current phase of the movement
  const isPromptPhase = currentPrompt && !hasSubmittedResponse;
  const isRecognitionPhase = allPhrasesIn && !hasSubmittedVote;
  const isWaitingForOthers = hasSubmittedResponse && !allPhrasesIn;

  return (
    <div className="space-y-4">
      {/* Movement Progress Header */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Movement {currentMovement} of {totalMovements}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-slate-600">
                {isPromptPhase && "🎵 Compose your phrase"}
                {isWaitingForOthers && "⏳ Waiting for other musicians..."}
                {isRecognitionPhase && "👂 Identify the humans"}
              </span>
              {timeRemaining !== null && (
                <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
          
          {/* Movement Progress Bar */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalMovements }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < currentMovement - 1 
                    ? 'bg-green-500' 
                    : i === currentMovement - 1 
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
          <PhraseComposer />
        </>
      )}

      {isWaitingForOthers && (
        <Card className="text-center">
          <div className="py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Phrase submitted!</h3>
            <p className="text-slate-600">
              Waiting for other musicians to contribute...
            </p>
            <div className="mt-4 text-sm text-slate-500">
              {Object.keys(roundResponses).length}/4 phrases received
            </div>
          </div>
        </Card>
      )}

      {isRecognitionPhase && (
        <MusicianRecognition responses={roundResponses} />
      )}
    </div>
  );
}