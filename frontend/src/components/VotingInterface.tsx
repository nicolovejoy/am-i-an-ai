
import { useState } from 'react';
import { Card, Button } from '@/components/ui';

interface Participant {
  identity: 'A' | 'B' | 'C' | 'D';
  label: string;
  messageCount: number;
}

interface VotingInterfaceProps {
  participants: Participant[];
  currentUserIdentity: 'A' | 'B' | 'C' | 'D';
  onSubmitVote: (selectedAIs: string[]) => void;
  sessionMode: 'production' | 'testing';
}

export function VotingInterface({ 
  participants, 
  currentUserIdentity, 
  onSubmitVote,
  sessionMode 
}: VotingInterfaceProps) {
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Filter out current user from voting options
  const votableParticipants = participants.filter(p => p.identity !== currentUserIdentity);

  const expectedAICount = sessionMode === 'testing' ? 3 : 2;

  const toggleSelection = (identity: string) => {
    if (hasSubmitted) return;

    setSelectedAIs(prev => {
      if (prev.includes(identity)) {
        return prev.filter(id => id !== identity);
      } else {
        return [...prev, identity];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedAIs.length === 0) return;
    
    setHasSubmitted(true);
    onSubmitVote(selectedAIs);
  };

  const getParticipantColor = (identity: string) => {
    const colors = {
      'A': 'border-blue-200 bg-blue-50',
      'B': 'border-green-200 bg-green-50', 
      'C': 'border-pink-200 bg-pink-50',
      'D': 'border-purple-200 bg-purple-50'
    };
    return colors[identity as keyof typeof colors] || 'border-slate-200 bg-slate-50';
  };


  const getSelectionStyle = (identity: string) => {
    if (!selectedAIs.includes(identity)) return '';
    return 'ring-2 ring-blue-500 bg-blue-100 border-blue-300';
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          🤖 Time to Vote!
        </h2>
        <p className="text-slate-600">
          Who do you think are the AIs? 
          {sessionMode === 'testing' ? ' (Select 3 participants)' : ' (Select 2 participants)'}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          You are <strong>Participant {currentUserIdentity}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {votableParticipants.map((participant) => (
          <button
            key={participant.identity}
            onClick={() => toggleSelection(participant.identity)}
            disabled={hasSubmitted}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${getParticipantColor(participant.identity)}
              ${getSelectionStyle(participant.identity)}
              ${hasSubmitted ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
              ${selectedAIs.includes(participant.identity) ? 'transform scale-105' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900">
                {participant.label}
              </span>
              {selectedAIs.includes(participant.identity) && (
                <span className="text-blue-600 font-bold">✓</span>
              )}
            </div>
            <div className="text-sm text-slate-600">
              {participant.messageCount} messages sent
            </div>
            {selectedAIs.includes(participant.identity) && (
              <div className="text-xs text-blue-600 font-medium mt-1">
                Selected as AI
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="text-center">
        <div className="mb-4">
          <span className="text-sm text-slate-600">
            Selected: {selectedAIs.length} / {expectedAICount}
          </span>
        </div>

        {!hasSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAIs.length === 0}
            variant="primary"
            size="lg"
          >
            {selectedAIs.length === 0 
              ? 'Select participants to vote' 
              : `Submit Vote (${selectedAIs.length} selected)`}
          </Button>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <span className="text-lg">✓</span>
            <span className="font-medium">Vote submitted! Waiting for results...</span>
          </div>
        )}
      </div>

      {selectedAIs.length > expectedAICount && !hasSubmitted && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800 text-sm">
            💡 Tip: There are only {expectedAICount} AIs in this session. 
            You&apos;ve selected {selectedAIs.length} participants.
          </p>
        </div>
      )}
    </Card>
  );
}