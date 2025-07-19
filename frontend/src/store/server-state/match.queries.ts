import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MatchSchema } from '@shared/schemas';
import type { Match, Identity, Participant, Round } from '@shared/schemas';

const API_URL = import.meta.env.VITE_MATCH_SERVICE_API || '';

// Query keys factory
export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
  history: () => [...matchKeys.all, 'history'] as const,
};

// Fetch match from API
async function fetchMatch(matchId: string): Promise<Match> {
  const response = await fetch(`${API_URL}/matches/${matchId}`, {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch match: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Add the matchId to the data if it's not there
  if (data && !data.matchId) {
    data.matchId = matchId;
  }
  
  // Add missing fields with defaults if needed
  if (data && !data.participants) {
    data.participants = [];
  }
  
  // Validate with Zod schema
  try {
    return MatchSchema.parse(data);
  } catch (error) {
    console.error('Match validation failed:', error);
    console.error('Raw data:', data);
    if (error instanceof Error && 'issues' in error) {
      console.error('Validation issues:', (error as { issues: unknown }).issues);
    }
    // Temporarily return the raw data to see if the app works
    console.warn('Using raw data without validation');
    return data as Match;
  }
}

// Fetch match history
async function fetchMatchHistory(): Promise<Match[]> {
  const response = await fetch(`${API_URL}/matches/history`, {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch match history: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.matches || [];
}

// Main match query hook
export function useMatch(matchId: string | null) {
  return useQuery({
    queryKey: matchKeys.detail(matchId || ''),
    queryFn: () => fetchMatch(matchId!),
    enabled: !!matchId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 0, // Always consider data stale for real-time updates
  });
}

// Match history query hook
export function useMatchHistory() {
  return useQuery({
    queryKey: matchKeys.history(),
    queryFn: fetchMatchHistory,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
}

// Derived data hooks
export function useMyIdentity(): Identity | null {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  
  if (!match) return null;
  
  const humanParticipant = match.participants.find((p: Participant) => !p.isAI);
  return humanParticipant?.identity || null;
}

export function useCurrentRound(): Round | null {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  
  if (!match) return null;
  
  return match.rounds.find((r: Round) => r.roundNumber === match.currentRound) || null;
}

const EMPTY_RESPONSES: Record<Identity, string> = {};

export function useRoundResponses(): Record<Identity, string> {
  const currentRound = useCurrentRound();
  return currentRound?.responses || EMPTY_RESPONSES;
}

export function useMatchStatus() {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match, isLoading, error } = useMatch(matchId);
  
  return {
    match,
    isLoading,
    error,
    isComplete: match?.status === 'completed',
    currentRound: match?.currentRound,
    totalRounds: match?.totalRounds,
  };
}

// Prefetch next round data
export function usePrefetchNextRound() {
  const queryClient = useQueryClient();
  const { match } = useMatchStatus();
  
  return () => {
    if (match && match.currentRound < match.totalRounds) {
      // This will prepare the cache for the next round
      queryClient.prefetchQuery({
        queryKey: matchKeys.detail(match.matchId),
        queryFn: () => fetchMatch(match.matchId),
      });
    }
  };
}

// Get all participants with their current status
export function useParticipants(): Participant[] {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  
  return match?.participants || [];
}

// Check if it's my turn to respond
export function useIsMyTurn(): boolean {
  const myIdentity = useMyIdentity();
  const currentRound = useCurrentRound();
  
  if (!myIdentity || !currentRound) return false;
  
  // It's my turn if I haven't responded yet in this round
  return !currentRound.responses?.[myIdentity];
}

// Check if we're in voting phase
export function useIsVotingPhase(): boolean {
  const currentRound = useCurrentRound();
  return currentRound?.status === 'voting';
}

// Check if a specific participant has responded
export function useHasParticipantResponded(identity: Identity): boolean {
  const currentRound = useCurrentRound();
  return !!currentRound?.responses?.[identity];
}