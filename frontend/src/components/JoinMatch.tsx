import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/useAuth';
import { useJoinMatch } from '@/store/server-state/match.mutations';

export function JoinMatch() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const joinMatch = useJoinMatch();
  
  const [playerName, setPlayerName] = useState('');
  const [step, setStep] = useState<'loading' | 'need-auth' | 'enter-name' | 'joining'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!inviteCode) {
      setError('Invalid invite link');
      return;
    }

    if (!isAuthenticated) {
      setStep('need-auth');
      // Store invite code for after auth
      sessionStorage.setItem('pendingInviteCode', inviteCode);
    } else {
      // User is authenticated
      if (user?.email) {
        setPlayerName(user.email.split('@')[0]);
      }
      setStep('enter-name');
    }
  }, [isAuthenticated, authLoading, inviteCode, user]);

  const handleJoinMatch = async () => {
    if (!playerName.trim() || !inviteCode) {
      setError('Please enter your name');
      return;
    }

    setStep('joining');
    setError(null);

    try {
      const result = await joinMatch.mutateAsync({
        inviteCode,
        displayName: playerName.trim(),
        userId: user?.sub || `guest-${Date.now()}`
      });

      if (result.match) {
        // Store match info
        sessionStorage.setItem('currentMatchId', result.match.matchId);
        
        // Navigate based on match status
        if (result.match.status === 'waiting_for_players') {
          navigate('/waiting');
        } else {
          navigate('/match');
        }
      }
    } catch (err) {
      console.error('Failed to join match:', err);
      setError(err instanceof Error ? err.message : 'Failed to join match');
      setStep('enter-name');
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !['need-auth', 'enter-name'].includes(step)) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 'need-auth') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">
              Join Match
            </h1>
            <p className="text-slate-600">
              You've been invited to join a RobotOrchestra match!
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Invite Code:
              </p>
              <p className="text-2xl font-mono font-bold text-blue-600">
                {inviteCode}
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-sm text-slate-700">
                To join this match, you need to sign in or create an account:
              </p>
              
              <Link to="/auth/signin" className="block">
                <Button variant="primary" className="w-full">
                  Sign In
                </Button>
              </Link>
              
              <Link to="/auth/signup" className="block">
                <Button variant="secondary" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-500 pt-4">
              After signing in, you'll automatically join this match
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'enter-name' || step === 'joining') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">
              Join Match
            </h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Invite Code:
              </p>
              <p className="text-2xl font-mono font-bold text-blue-600">
                {inviteCode}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Display Name
                </label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={step === 'joining'}
                  className="w-full"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button
                onClick={handleJoinMatch}
                disabled={step === 'joining' || !playerName.trim()}
                variant="primary"
                className="w-full"
              >
                {step === 'joining' ? 'Joining...' : 'Join Match'}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
                Go to Dashboard instead
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

export default JoinMatch;