import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { useMatchHistory } from '@/store/server-state/match.queries';
import type { Match, Round, Participant } from '@shared/schemas';

export function MatchHistory() {
  const { data: matches = [], isLoading: loading, error } = useMatchHistory();

  const formatDate = (dateString: string) => {
    // Handle ISO date string from createdAt
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Fallback: try to extract timestamp from matchId if it contains one
    const timestamp = dateString.split('-')[0];
    if (timestamp && !isNaN(Number(timestamp))) {
      return new Date(Number(timestamp)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return 'Date unknown';
  };

  const getMatchProgress = (match: Match) => {
    if (!match.rounds || match.rounds.length === 0) {
      return { completed: 0, total: 5, status: 'Not started' };
    }

    // Count rounds with votes
    const completedRounds = match.rounds.filter((r: Round) => 
      r.votes && Object.keys(r.votes).length > 0
    ).length;

    const total = match.totalRounds || 5;
    
    let status = 'In progress';
    if (match.status === 'completed') {
      status = 'Completed';
    } else if (completedRounds === 0) {
      status = 'Just started';
    }

    return { completed: completedRounds, total, status };
  };

  const getPlayerName = (match: Match) => {
    const humanParticipant = match.participants?.find((p: Participant) => !p.isAI);
    return humanParticipant?.name || 'Unknown Player';
  };

  const getMatchScore = (match: Match) => {
    if (!match.rounds || match.status !== 'completed') {
      return null;
    }

    let correctVotes = 0;
    let totalVotes = 0;

    match.rounds.forEach((round: Round) => {
      if (round.votes) {
        const humanIdentity = match.participants?.find((p: Participant) => !p.isAI)?.identity;
        
        Object.entries(round.votes).forEach(([voter, votedFor]) => {
          if (voter !== humanIdentity) {
            totalVotes++;
            if (votedFor === humanIdentity) {
              correctVotes++;
            }
          }
        });
      }
    });

    return totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading History</h3>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Failed to load match history'}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
          <p className="text-gray-600 mb-4">
            Start your first match to see your history here!
          </p>
          <Link to="/dashboard">
            <Button>Play Now</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Match History</h2>
        <div className="text-sm text-gray-600">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} played
        </div>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => {
          const progress = getMatchProgress(match);
          const score = getMatchScore(match);
          const playerName = getPlayerName(match);
          
          return (
            <Card key={match.matchId} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold">{playerName}</h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(match.createdAt || match.matchId)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-gray-600">Progress: </span>
                      <span className="font-medium">
                        {progress.completed}/{progress.total} rounds
                      </span>
                    </div>
                    
                    {score !== null && (
                      <div className="text-sm">
                        <span className="text-gray-600">AI Accuracy: </span>
                        <span className="font-medium">{score}%</span>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        match.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {progress.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  {match.status === 'completed' ? (
                    <Link to={`/match/${match.matchId}/results`}>
                      <Button variant="secondary" size="sm">
                        View Results
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        sessionStorage.setItem('currentMatchId', match.matchId);
                        window.location.href = '/match';
                      }}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {matches.length > 10 && (
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Showing your {matches.length} most recent matches
          </p>
        </div>
      )}
    </div>
  );
}

export default MatchHistory;