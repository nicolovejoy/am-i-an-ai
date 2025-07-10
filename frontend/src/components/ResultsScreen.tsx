
import { Card, Button } from '@/components/ui';

interface ParticipantResult {
  identity: 'A' | 'B' | 'C' | 'D';
  label: string;
  isAI: boolean;
  messageCount: number;
}

interface ResultsScreenProps {
  participants: ParticipantResult[];
  userVotes: ('A' | 'B' | 'C' | 'D')[];
  currentUserIdentity: 'A' | 'B' | 'C' | 'D';
  sessionMode: 'production' | 'testing';
  onPlayAgain: () => void;
}

export function ResultsScreen({ 
  participants, 
  userVotes, 
  currentUserIdentity,
  sessionMode,
  onPlayAgain 
}: ResultsScreenProps) {
  // Calculate accuracy
  const actualAIs = participants.filter(p => p.isAI).map(p => p.identity);
  const correctGuesses = userVotes.filter(vote => actualAIs.includes(vote));
  const incorrectGuesses = userVotes.filter(vote => !actualAIs.includes(vote));
  const missedAIs = actualAIs.filter(ai => !userVotes.includes(ai));
  
  const accuracy = actualAIs.length > 0 ? (correctGuesses.length / actualAIs.length) * 100 : 0;
  
  const getScoreMessage = () => {
    if (accuracy === 100) return "🎉 Perfect! You found all the AIs!";
    if (accuracy >= 75) return "🎯 Great job! You're good at this!";
    if (accuracy >= 50) return "👍 Not bad! Getting warmer...";
    if (accuracy > 0) return "🤔 You found some AIs, but missed others";
    return "😅 The AIs fooled you completely!";
  };

  const getParticipantColor = (identity: string) => {
    const colors = {
      'A': 'border-red-200 bg-red-50',
      'B': 'border-slate-200 bg-slate-50',
      'C': 'border-blue-200 bg-blue-50', 
      'D': 'border-purple-200 bg-purple-50'
    };
    return colors[identity as keyof typeof colors] || 'border-slate-200 bg-slate-50';
  };

  const getResultStyle = (participant: ParticipantResult) => {
    const wasVotedAsAI = userVotes.includes(participant.identity);
    const isActuallyAI = participant.isAI;
    
    if (isActuallyAI && wasVotedAsAI) return 'ring-2 ring-green-500 bg-green-100'; // Correct AI guess
    if (isActuallyAI && !wasVotedAsAI) return 'ring-2 ring-red-500 bg-red-100'; // Missed AI
    if (!isActuallyAI && wasVotedAsAI) return 'ring-2 ring-orange-500 bg-orange-100'; // False positive
    return ''; // Correct human (no vote)
  };

  const getResultIcon = (participant: ParticipantResult) => {
    const wasVotedAsAI = userVotes.includes(participant.identity);
    const isActuallyAI = participant.isAI;
    
    if (isActuallyAI && wasVotedAsAI) return '✅'; // Correct
    if (isActuallyAI && !wasVotedAsAI) return '❌'; // Missed
    if (!isActuallyAI && wasVotedAsAI) return '❌'; // Wrong
    return '✅'; // Correct (didn't vote for human)
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          🎭 The Big Reveal!
        </h2>
        <p className="text-xl text-slate-600 mb-4">
          {getScoreMessage()}
        </p>
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {accuracy.toFixed(0)}% Accuracy
        </div>
        <p className="text-slate-500">
          You correctly identified {correctGuesses.length} out of {actualAIs.length} AIs
        </p>
      </Card>

      {/* Results Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Results Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {participants.map((participant) => (
            <div
              key={participant.identity}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${getParticipantColor(participant.identity)}
                ${getResultStyle(participant)}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">
                  {participant.identity === currentUserIdentity ? 'You' : participant.label}
                </span>
                <span className="text-xl">
                  {getResultIcon(participant)}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  Actually: {participant.isAI ? '🤖 AI' : '👤 Human'}
                </div>
                <div className="text-sm text-slate-600">
                  Your guess: {userVotes.includes(participant.identity) ? '🤖 AI' : '👤 Human'}
                </div>
                <div className="text-xs text-slate-500">
                  {participant.messageCount} messages
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {correctGuesses.length}
              </div>
              <div className="text-sm text-slate-600">Correct AI Guesses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {missedAIs.length}
              </div>
              <div className="text-sm text-slate-600">Missed AIs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {incorrectGuesses.length}
              </div>
              <div className="text-sm text-slate-600">False Positives</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Session Info */}
      <Card className="p-4">
        <div className="text-center text-sm text-slate-500">
          Session completed • {sessionMode === 'testing' ? 'Testing Mode (1H+3AI)' : 'Game Mode (2H+2AI)'} 
          • {participants.reduce((sum, p) => sum + p.messageCount, 0)} total messages
        </div>
      </Card>

      {/* Actions */}
      <div className="text-center">
        <Button
          onClick={onPlayAgain}
          variant="primary"
          size="lg"
        >
          🎮 Play Again
        </Button>
      </div>
    </div>
  );
}