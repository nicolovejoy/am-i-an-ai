import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronRight, FiCheck, FiEdit3, FiUsers } from "react-icons/fi";
import { Card } from "./ui";
import type { Match, Round, Identity } from "@shared/schemas";
import PromptDisplay from "./PromptDisplay";
import PhraseComposer from "./ResponseInput";
import HumanOrRobot from "./HumanOrRobot";
import ParticipantWaitingStatus from "./ParticipantWaitingStatus";
import VoteFeedback from "./VoteFeedback";
import { hasAllResponses } from "@shared/schemas";
import { useVotingStore } from "@/store/ui-state/voting.store";

interface MatchAccordionProps {
  match: Match;
  currentRound: Round;
  myIdentity: Identity;
  isMyTurn: boolean;
  isVotingPhase: boolean;
  roundResponses: Record<string, string>;
  hasSubmittedResponse: boolean;
}

export default function MatchAccordion({
  match,
  currentRound,
  myIdentity,
  isMyTurn,
  isVotingPhase,
  roundResponses,
  hasSubmittedResponse,
}: MatchAccordionProps) {
  const [expandedRounds, setExpandedRounds] = useState<number[]>([match.currentRound]);
  const { showFeedback, votedFor, correctAnswer, pointsEarned, totalScore, clearVoteFeedback } = useVotingStore();
  
  const allResponsesIn = hasAllResponses(currentRound);
  const hasSubmittedVote = currentRound.votes && currentRound.votes[myIdentity];

  // Determine current phase
  const isPromptPhase = currentRound.prompt && isMyTurn;
  const isWaitingForOthers = hasSubmittedResponse && !allResponsesIn;
  const isRecognitionPhase = allResponsesIn && isVotingPhase && !hasSubmittedVote;
  const isShowingFeedback = showFeedback && votedFor && correctAnswer !== null;

  // Auto-expand current round
  useEffect(() => {
    setExpandedRounds(prev => {
      if (!prev.includes(match.currentRound)) {
        return [...prev, match.currentRound];
      }
      return prev;
    });
  }, [match.currentRound]);

  const toggleRound = (roundNumber: number) => {
    if (expandedRounds.includes(roundNumber)) {
      setExpandedRounds(expandedRounds.filter(r => r !== roundNumber));
    } else {
      setExpandedRounds([...expandedRounds, roundNumber]);
    }
  };

  const getRoundStatus = (_round: Round, roundNumber: number) => {
    if (roundNumber > match.currentRound) return 'upcoming';
    if (roundNumber < match.currentRound) return 'completed';
    
    // Current round statuses
    if (isPromptPhase) return 'responding';
    if (isWaitingForOthers) return 'waiting';
    if (isRecognitionPhase || isShowingFeedback) return 'voting';
    return 'active';
  };

  const getRoundIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'responding': return <FiEdit3 className="w-4 h-4 text-blue-600" />;
      case 'waiting': return <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />;
      case 'voting': return <FiUsers className="w-4 h-4 text-purple-600" />;
      default: return <div className="w-4 h-4 rounded-full bg-slate-300" />;
    }
  };

  return (
    <div className="space-y-2">
      {match.rounds.map((round: Round, index: number) => {
        const roundNumber = index + 1;
        const isExpanded = expandedRounds.includes(roundNumber);
        const isCurrent = roundNumber === match.currentRound;
        const status = getRoundStatus(round, roundNumber);
        
        return (
          <Card 
            key={roundNumber}
            className={`transition-all duration-200 ${
              isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleRound(roundNumber)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getRoundIcon(status)}
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">
                    Round {roundNumber}
                    {isCurrent && <span className="ml-2 text-sm text-blue-600">(Current)</span>}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {status === 'completed' && 'Completed'}
                    {status === 'responding' && '✍️ Write your response'}
                    {status === 'waiting' && '⏳ Waiting for others...'}
                    {status === 'voting' && '🤖 Human or Robot?'}
                    {status === 'upcoming' && 'Upcoming'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {round.scores && Object.keys(round.scores).length > 0 && (
                  <div className="text-sm text-slate-600">
                    {round.scores[myIdentity] || 0} pts
                  </div>
                )}
                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              </div>
            </button>

            {/* Accordion Content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                {isCurrent ? (
                  // Current round content
                  <>
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
                        prompt={currentRound.prompt}
                      />
                    )}
                    
                    {isShowingFeedback && (
                      <VoteFeedback
                        votedFor={votedFor}
                        correctAnswer={correctAnswer}
                        pointsEarned={pointsEarned}
                        totalScore={totalScore}
                        onContinue={() => {
                          clearVoteFeedback();
                        }}
                      />
                    )}
                  </>
                ) : (
                  // Past/future round summary
                  <div className="py-4">
                    {round.prompt && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-slate-700">Prompt:</div>
                        <div className="text-sm text-slate-600 italic">"{round.prompt}"</div>
                      </div>
                    )}
                    
                    {status === 'completed' && round.responses && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700">Responses:</div>
                        {Object.entries(round.responses).map(([identity, response]) => (
                          <div key={identity} className="text-sm text-slate-600 pl-3 border-l-2 border-slate-200">
                            {String(response)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {status === 'upcoming' && (
                      <div className="text-center text-slate-500 text-sm">
                        This round hasn't started yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}