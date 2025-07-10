import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { matchService } from '@/store/api/matchService';
import type { Match } from '@/store/types';

export function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatchHistory() {
      try {
        setLoading(true);
        setError(null);
        const data = await matchService.getMatchHistory();
        setMatches(data);
      } catch (err) {
        console.error('Error fetching match history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load match history');
      } finally {
        setLoading(false);
      }
    }

    fetchMatchHistory();
  }, []);

  const formatDate = (matchId: string) => {
    // Extract timestamp from matchId if it contains one
    const timestamp = matchId.split('-')[0];
    if (timestamp && !isNaN(Number(timestamp))) {
      return new Date(Number(timestamp)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Unknown date';
  };

  const getMatchStats = (match: Match) => {
    const completedRounds = match.rounds.filter(r => r.status === 'complete').length;
    const humanParticipant = match.participants.find(p => !p.isAI);
    const humanIdentity = humanParticipant?.identity;
    
    let correctVotes = 0;
    let totalVotes = 0;
    
    match.rounds.forEach(round => {
      if (round.votes && humanIdentity && round.votes[humanIdentity]) {
        totalVotes++;
        // Check if they voted for another human (in MVP, there's only one human)
        const votedFor = round.votes[humanIdentity];
        const votedParticipant = match.participants.find(p => p.identity === votedFor);
        if (!votedParticipant?.isAI) {
          correctVotes++;
        }
      }
    });

    return {
      completedRounds,
      correctVotes,
      totalVotes,
      humanName: humanParticipant?.playerName || 'Anonymous'
    };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading match history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center p-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading History</h1>
          <p className="text-slate-600 mb-8">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()} variant="primary">
              Try Again
            </Button>
            <Link to="/dashboard">
              <Button variant="secondary">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            📊 Match History
          </h1>
          <div className="text-6xl mb-6">🎮</div>
          <p className="text-lg text-slate-600 mb-4">
            No matches played yet!
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Start your first match to see your game history here.
          </p>
          <Link to="/dashboard">
            <Button variant="primary">
              Start Playing
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          📊 Match History
        </h1>
        <Link to="/dashboard">
          <Button variant="secondary">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {matches.map((match) => {
          const stats = getMatchStats(match);
          const isCompleted = match.status === 'completed';
          
          return (
            <Card key={match.matchId} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Match #{match.matchId.slice(-6).toUpperCase()}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>{formatDate(match.matchId)}</span>
                    <span>Player: {stats.humanName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    isCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                  {stats.totalVotes > 0 && (
                    <div className="mt-2 text-sm font-medium text-slate-600">
                      Score: {stats.correctVotes}/{stats.totalVotes} correct
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Progress</h4>
                  <div className="bg-slate-100 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.completedRounds / match.totalRounds) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600">
                    {stats.completedRounds} of {match.totalRounds} rounds completed
                  </p>
                </div>

                {stats.completedRounds > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Round Details</h4>
                    <div className="space-y-2">
                      {match.rounds.filter(r => r.status !== 'waiting').map((round) => {
                        const humanParticipant = match.participants.find(p => !p.isAI);
                        const humanVote = humanParticipant && round.votes?.[humanParticipant.identity];
                        
                        return (
                          <div key={round.roundNumber} className="bg-slate-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">
                                Round {round.roundNumber}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                round.status === 'complete' 
                                  ? 'bg-green-100 text-green-700'
                                  : round.status === 'voting'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {round.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 italic mb-2">
                              "{round.prompt}"
                            </p>
                            {Object.keys(round.responses).length > 0 && (
                              <p className="text-xs text-slate-500">
                                {Object.keys(round.responses).length} responses submitted
                                {humanVote && ` • You voted for: ${humanVote}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {!isCompleted && (
                <div className="mt-4 pt-4 border-t">
                  <Link to={`/match?id=${match.matchId}`}>
                    <Button variant="primary" size="sm">
                      Continue Match →
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
      </div>
    </div>
  );
}