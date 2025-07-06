'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface MatchHistoryRecord {
  matchId: string;
  status: 'completed' | 'in_progress';
  humanParticipant: string;
  robotParticipants: string[];
  rounds: RoundSummary[];
  createdAt: number;
  completedAt?: number;
  duration?: number;
  result?: 'correct' | 'incorrect';
}

interface RoundSummary {
  round: number;
  prompt: string;
  responses: Array<{
    participantId: string;
    participantType: 'human' | 'robot';
    response: string;
    robotType?: string;
  }>;
  humanGuess?: string;
  startedAt: number;
  completedAt?: number;
}

interface MatchHistoryResponse {
  matches: MatchHistoryRecord[];
  timestamp: number;
}

export function SessionHistory() {
  const [matches, setMatches] = useState<MatchHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchMatchHistory() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(process.env.NEXT_PUBLIC_MATCH_HISTORY_API!);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch match history: ${response.statusText}`);
        }

        const data: MatchHistoryResponse = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error('Error fetching match history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load match history');
      } finally {
        setLoading(false);
      }
    }

    fetchMatchHistory();
  }, [user]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Unknown';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            <Link href="/dashboard">
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
            Start your first match to see your game history and statistics here.
          </p>
          <div className="space-x-4">
            <Link href="/match">
              <Button variant="primary">
                Start Playing
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
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
        <Link href="/dashboard">
          <Button variant="secondary">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {matches.map((match) => (
          <Card key={match.matchId} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Match {match.matchId.slice(-8)}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span>{formatDate(match.createdAt)}</span>
                  {match.duration && (
                    <span>Duration: {formatDuration(match.duration)}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  match.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {match.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
                {match.result && (
                  <div className={`mt-2 text-sm font-medium ${
                    match.result === 'correct' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {match.result === 'correct' ? '✅ Correct Guess' : '❌ Incorrect Guess'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Participants</h4>
                <div className="flex space-x-2 text-sm">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    👤 {match.humanParticipant}
                  </span>
                  {match.robotParticipants.map((robot, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      🤖 {robot}
                    </span>
                  ))}
                </div>
              </div>

              {match.rounds.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Rounds ({match.rounds.length})</h4>
                  <div className="space-y-3">
                    {match.rounds.map((round) => (
                      <div key={round.round} className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-slate-800">
                            Round {round.round}
                          </h5>
                          {round.humanGuess && (
                            <span className="text-xs text-slate-500">
                              Guessed: {round.humanGuess}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-3 italic">
                          &quot;{round.prompt}&quot;
                        </p>
                        {round.responses.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {round.responses.map((response, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border">
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`font-medium ${
                                    response.participantType === 'human' 
                                      ? 'text-blue-600' 
                                      : 'text-gray-600'
                                  }`}>
                                    {response.participantType === 'human' ? '👤' : '🤖'} {response.participantId}
                                  </span>
                                  {response.robotType && (
                                    <span className="text-gray-400">({response.robotType})</span>
                                  )}
                                </div>
                                <p className="text-gray-700">{response.response}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/match">
          <Button variant="primary" className="mr-4">
            Play New Match
          </Button>
        </Link>
        <span className="text-sm text-slate-500">
          Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>
    </div>
  );
}