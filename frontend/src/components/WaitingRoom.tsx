import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { useMatch } from '@/store/server-state/match.queries';
import type { Match, Participant } from '@shared/schemas';

export function WaitingRoom() {
  const navigate = useNavigate();
  const matchId = sessionStorage.getItem('currentMatchId');
  const inviteCode = sessionStorage.getItem('inviteCode');
  const [copied, setCopied] = useState(false);
  
  const { data: match, isLoading, error } = useMatch(matchId || '');

  useEffect(() => {
    if (!matchId) {
      navigate('/dashboard');
      return;
    }

    // Check if match has started
    if (match && match.status !== 'waiting_for_players') {
      navigate('/match');
    }
  }, [match, matchId, navigate]);

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getWaitingCount = (match: Match) => {
    if (!match.waitingFor) return 0;
    return match.waitingFor.humans;
  };

  const getParticipantDisplay = (participant: Participant, index: number) => {
    return (
      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {participant.displayName?.[0].toUpperCase() || participant.playerName?.[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-800">
            {participant.displayName || participant.playerName}
          </p>
          <p className="text-xs text-slate-500">
            {participant.isAI ? 'AI Player' : 'Human Player'}
          </p>
        </div>
        {index === 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Host
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Match</h3>
          <p className="text-gray-600 mb-4">Unable to load match details</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const waitingCount = getWaitingCount(match);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Waiting for Players
          </h1>
          <p className="text-slate-600">
            {waitingCount > 0 
              ? `Waiting for ${waitingCount} more ${waitingCount === 1 ? 'player' : 'players'} to join`
              : 'All players have joined! Starting soon...'}
          </p>
        </Card>

        {/* Invite Code */}
        {inviteCode && (
          <Card className="text-center bg-blue-50 border-blue-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Share Invite Code
            </h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {inviteCode}
              </div>
              <Button
                onClick={copyInviteCode}
                variant="secondary"
                size="sm"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
            <div className="text-sm text-slate-600 mb-2">
              Or share this link:
            </div>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xs bg-white px-3 py-1 rounded border border-slate-200">
                {window.location.origin}/join/{inviteCode}
              </code>
              <Button
                onClick={copyInviteLink}
                variant="secondary"
                size="sm"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </Card>
        )}

        {/* Participants */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Players ({match.participants?.length || 0}/4)
          </h2>
          <div className="space-y-2">
            {match.participants?.map((participant: Participant, index: number) => 
              getParticipantDisplay(participant, index)
            )}
            {/* Show empty slots */}
            {Array.from({ length: (waitingCount || 0) }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-lg">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-slate-400">?</span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-400">Waiting for player...</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => {
              if (confirm('Are you sure you want to leave this match?')) {
                sessionStorage.removeItem('currentMatchId');
                sessionStorage.removeItem('inviteCode');
                navigate('/dashboard');
              }
            }}
            variant="secondary"
            className="flex-1"
          >
            Leave Match
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div className="text-sm text-slate-700">
              <p className="font-semibold mb-1">How to play:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Share the invite code with your friend</li>
                <li>Once everyone joins, the match will start automatically</li>
                <li>You'll play alongside AI players, trying to identify who's human</li>
                <li>Each round, everyone responds to a prompt</li>
                <li>Then vote on who you think is human!</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default WaitingRoom;