import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Match, 
  MatchSchema, 
  Round,
  Identity,
  Participant,
  getCurrentRound,
  getHumanParticipant,
} from '@shared/schemas';

// Query keys factory
export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
};

// Fetch match data
async function fetchMatch(matchId: string): Promise<Match> {
  const response = await fetch(`${import.meta.env.VITE_MATCH_SERVICE_API}/matches/${matchId}`, {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch match: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate with Zod schema
  return MatchSchema.parse(data);
}

// Main match query hook
export function useMatch(matchId: string | null) {
  return useQuery({
    queryKey: matchKeys.detail(matchId || ''),
    queryFn: () => fetchMatch(matchId!),
    enabled: !!matchId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });
}

// Derived data hooks
export function useCurrentRound(): Round | undefined {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  return match ? getCurrentRound(match) : undefined;
}

export function useMyIdentity(): Identity | undefined {
  const matchId = sessionStorage.getItem('currentMatchId');
  const { data: match } = useMatch(matchId);
  return match ? getHumanParticipant(match)?.identity : undefined;
}

export function useIsMyTurn(): boolean {
  const currentRound = useCurrentRound();
  const myIdentity = useMyIdentity();
  
  if (!currentRound || !myIdentity) return false;
  
  return currentRound.status === 'responding' && 
         !currentRound.responses[myIdentity];
}

export function useIsVotingPhase(): boolean {
  const currentRound = useCurrentRound();
  const myIdentity = useMyIdentity();
  
  if (!currentRound || !myIdentity) return false;
  
  return currentRound.status === 'voting' && 
         !currentRound.votes[myIdentity];
}

export function useRoundResponses(): Record<Identity, string> {
  const currentRound = useCurrentRound();
  return currentRound?.responses || {};
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
  const { data: match } = useMatchStatus();
  
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

// Check if a specific participant has submitted response
export function useHasParticipantResponded(identity: Identity): boolean {
  const currentRound = useCurrentRound();
  return !!currentRound?.responses[identity];
}

// Check if a specific participant has voted
export function useHasParticipantVoted(identity: Identity): boolean {
  const currentRound = useCurrentRound();
  return !!currentRound?.votes[identity];
}