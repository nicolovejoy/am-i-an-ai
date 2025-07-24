import { useState, useEffect } from 'react';
import { Card, Button } from './ui';
import { useMatch } from '@/store/server-state/match.queries';
import { useAuth } from '@/contexts/useAuth';
import type { Participant, Round } from '@shared/schemas';

interface AdminDebugPanelProps {
  matchId?: string;
}

export function AdminDebugPanel({ matchId }: AdminDebugPanelProps) {
  const { user } = useAuth();
  const { data: match } = useMatch(matchId || null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showFullState, setShowFullState] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'nlovejoy@me.com';

  // Load debug mode preference
  useEffect(() => {
    const savedDebugMode = localStorage.getItem('adminDebugMode') === 'true';
    setIsDebugMode(savedDebugMode && isAdmin);
  }, [isAdmin]);

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newState = !isDebugMode;
    setIsDebugMode(newState);
    localStorage.setItem('adminDebugMode', String(newState));
  };

  if (!isAdmin || !match) {
    return null;
  }

  const currentRound = match.rounds.find((r: Round) => r.roundNumber === match.currentRound);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Toggle Button */}
      <div className="flex justify-end mb-2">
        <Button
          size="sm"
          variant={isDebugMode ? 'primary' : 'secondary'}
          onClick={toggleDebugMode}
          className="shadow-lg"
        >
          {isDebugMode ? '🐛 Debug On' : '🐛 Debug Off'}
        </Button>
      </div>

      {/* Debug Panel */}
      {isDebugMode && (
        <Card className="shadow-xl border-2 border-red-500 bg-white/95 backdrop-blur">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-600">🔧 Admin Debug Panel</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowFullState(!showFullState)}
              >
                {showFullState ? 'Hide State' : 'Show State'}
              </Button>
            </div>

            {/* Match Info */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Match ID:</span>{' '}
                <span className="font-mono text-xs">{match.matchId}</span>
              </div>
              <div>
                <span className="font-semibold">Status:</span> {match.status}
              </div>
              <div>
                <span className="font-semibold">Round:</span> {match.currentRound} / {match.totalRounds}
              </div>
              {match.templateType && (
                <div>
                  <span className="font-semibold">Template:</span> {match.templateType}
                </div>
              )}
            </div>

            {/* Participants with AI metadata */}
            <div>
              <h4 className="font-semibold mb-2">Participants:</h4>
              <div className="space-y-2">
                {match.participants.map((participant: Participant) => (
                  <div
                    key={participant.identity}
                    className={`p-2 rounded text-xs ${
                      participant.isAI ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">{participant.playerName}</span>
                        {participant.isAI ? ' 🤖' : ' 👤'}
                      </div>
                      {participant.isAI && (
                        <span className="text-orange-600 font-mono">AI</span>
                      )}
                    </div>
                    {participant.isAI && participant.personality && (
                      <div className="mt-1 text-orange-700">
                        Personality: {participant.personality}
                      </div>
                    )}
                    {participant.userId && (
                      <div className="mt-1 text-gray-500 font-mono text-[10px]">
                        ID: {participant.userId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Round Responses */}
            {currentRound && currentRound.responses && (
              <div>
                <h4 className="font-semibold mb-2">Round {currentRound.roundNumber} Responses:</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(currentRound.responses).map(([identity, response]) => {
                    const participant = match.participants.find((p: Participant) => p.identity === identity);
                    const responseStr = String(response);
                    const isFallback = responseStr.includes('[AI:') && responseStr.includes(']');
                    return (
                      <div key={identity} className="p-2 bg-gray-50 rounded">
                        <div className="font-semibold">
                          {identity}: {participant?.playerName}
                          {participant?.isAI && ' 🤖'}
                          {isFallback && (
                            <span className="ml-2 text-red-600">[FALLBACK]</span>
                          )}
                        </div>
                        <div className="text-gray-600 truncate">{responseStr}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Votes */}
            {currentRound && currentRound.votes && Object.keys(currentRound.votes).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Votes:</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(currentRound.votes).map(([voter, votedFor]) => {
                    const voterParticipant = match.participants.find((p: Participant) => p.identity === voter);
                    return (
                      <div key={voter}>
                        {voter} ({voterParticipant?.playerName})
                        {voterParticipant?.isAI && ' 🤖'} → {votedFor}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full State Dump */}
            {showFullState && (
              <div className="mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-64">
                <pre className="text-[10px] font-mono">
                  {JSON.stringify(match, null, 2)}
                </pre>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  console.log('Match State:', match);
                  console.log('Current Round:', currentRound);
                }}
              >
                Log to Console
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(match, null, 2));
                }}
              >
                Copy State
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}