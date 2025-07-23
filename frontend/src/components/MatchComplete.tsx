
import type { Identity, Match, Participant, Round } from '@shared/schemas';
import { Card, Button } from './ui';
import { useNavigate } from 'react-router-dom';

interface MatchCompleteProps {
  match: Match;
  myIdentity: Identity;
}

export default function MatchComplete({ match, myIdentity }: MatchCompleteProps) {
  const navigate = useNavigate();
  
  // Calculate final scores
  const finalScores: Record<Identity, number> = { A: 0, B: 0, C: 0, D: 0 };
  const votingAccuracy: Record<Identity, { correct: number; total: number }> = {
    A: { correct: 0, total: 0 },
    B: { correct: 0, total: 0 },
    C: { correct: 0, total: 0 },
    D: { correct: 0, total: 0 },
  };
  
  // Calculate scores from all rounds
  match.rounds.forEach((round: Round) => {
    // Add up scores from each round
    Object.entries(round.scores || {}).forEach(([identity, score]) => {
      if (identity === 'A' || identity === 'B' || identity === 'C' || identity === 'D') {
        finalScores[identity] += (typeof score === 'number' ? score : 0);
      }
    });
    
    // Calculate voting accuracy
    Object.entries(round.votes || {}).forEach(([voter, votedFor]) => {
      if (voter === 'A' || voter === 'B' || voter === 'C' || voter === 'D') {
        votingAccuracy[voter].total += 1;
        
        // Check if the vote was correct (voted for a human)
        const votedParticipant = match.participants.find((p: Participant) => p.identity === votedFor);
        if (votedParticipant && !votedParticipant.isAI) {
          votingAccuracy[voter].correct += 1;
        }
      }
    });
  });
  
  // Get participant info
  const getParticipantInfo = (identity: Identity) => {
    const participant = match.participants.find((p: Participant) => p.identity === identity);
    return {
      isAI: participant?.isAI || false,
      isMe: identity === myIdentity,
      displayName: participant?.displayName || participant?.playerName || 'Unknown',
      personality: participant?.personality,
      modelConfig: participant?.modelConfig,
    };
  };
  
  // Sort participants by score
  const sortedParticipants = (['A', 'B', 'C', 'D'] as Identity[])
    .sort((a, b) => finalScores[b] - finalScores[a]);
  
  const handlePlayAgain = () => {
    // Clear session and navigate
    sessionStorage.removeItem('currentMatchId');
    navigate('/dashboard');
  };
  
  const handleViewHistory = () => {
    navigate('/history');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Match Complete! 🎭</h2>
          <p className="text-lg text-slate-600">
            After 5 rounds of creative collaboration, here are the results:
          </p>
        </div>
        
        {/* Identity Reveal */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Identity Reveal</h3>
          <div className="grid grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as Identity[]).map(identity => {
              const info = getParticipantInfo(identity);
              return (
                <div
                  key={identity}
                  className={`p-4 rounded-lg border-2 ${
                    info.isMe
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-lg font-medium">Player {identity}</span>
                      {info.isMe && (
                        <span className="ml-2 text-sm text-blue-600">(You)</span>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      info.isAI
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {info.isAI ? '🤖 AI' : '👤 Human'}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <div className="font-medium">{info.displayName}</div>
                    {info.isAI && info.personality && (
                      <div className="text-xs mt-1">
                        Personality: {info.personality === 'littleSister' ? 'Playful Little Sister' :
                                     info.personality === 'wiseGrandpa' ? 'Wise Grandpa' :
                                     info.personality === 'practicalMom' ? 'Practical Mom' :
                                     info.personality}
                      </div>
                    )}
                    {info.isAI && info.modelConfig && (
                      <div className="text-xs text-slate-500">
                        Model: {info.modelConfig.model || 'claude-3-haiku'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Final Scores */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
          <div className="space-y-3">
            {sortedParticipants.map((identity, index) => {
              const info = getParticipantInfo(identity);
              const score = finalScores[identity];
              const accuracy = votingAccuracy[identity];
              const accuracyPercent = accuracy.total > 0
                ? Math.round((accuracy.correct / accuracy.total) * 100)
                : 0;
              
              return (
                <div
                  key={identity}
                  className={`p-4 rounded-lg flex items-center justify-between ${
                    index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                    </div>
                    <div>
                      <div className="font-medium">
                        Player {identity}
                        {info.isMe && <span className="text-blue-600 ml-1">(You)</span>}
                      </div>
                      <div className="text-sm text-slate-600">
                        {info.isAI ? '🤖 AI' : '👤 Human'} · 
                        Voting accuracy: {accuracyPercent}% ({accuracy.correct}/{accuracy.total})
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    {score} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mb-8 p-4 bg-slate-100 rounded-lg">
          <h4 className="font-medium mb-2">Your Performance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Your Score:</span>
              <span className="ml-2 font-medium">{finalScores[myIdentity]} points</span>
            </div>
            <div>
              <span className="text-slate-600">Voting Accuracy:</span>
              <span className="ml-2 font-medium">
                {votingAccuracy[myIdentity].total > 0
                  ? `${Math.round((votingAccuracy[myIdentity].correct / votingAccuracy[myIdentity].total) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handlePlayAgain}
            size="lg"
            variant="primary"
            className="flex-1"
          >
            Play Again
          </Button>
          <Button
            onClick={handleViewHistory}
            size="lg"
            variant="secondary"
            className="flex-1"
          >
            View Match History
          </Button>
        </div>
      </Card>
    </div>
  );
}