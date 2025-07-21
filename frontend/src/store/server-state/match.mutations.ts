import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  validateRequest,
  CreateMatchRequestSchema,
  SubmitResponseRequestSchema,
  SubmitVoteRequestSchema,
} from '@shared/schemas';
import type {
  Match,
  Identity,
  Round,
  SubmitResponseResponse,
  SubmitVoteResponse,
} from '@shared/schemas';
import { matchKeys } from './match.queries';

const API_URL = import.meta.env.VITE_MATCH_SERVICE_API || '';

// Create a match with template (multi-human support)
export function useCreateMatchWithTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateType: 'classic_1v3' | 'duo_2v2' | 'admin_custom';
      creatorName: string;
      creatorUserId?: string;
    }): Promise<{ match: Match }> => {
      // For now, use a mock userId if not provided
      const userId = params.creatorUserId || `user-${Date.now()}`;
      
      const response = await fetch(`${API_URL}/matches/create-with-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType: params.templateType,
          creatorUserId: userId,
          creatorName: params.creatorName,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to create match: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const match = data.match;
      if (match?.matchId) {
        // Store match ID in session
        sessionStorage.setItem('currentMatchId', match.matchId);
        
        // Store template type for UI purposes
        sessionStorage.setItem('matchTemplateType', match.templateType || 'classic_1v3');
        
        // If it's a duo match and we're waiting for players, store invite code
        if (match.inviteCode) {
          sessionStorage.setItem('inviteCode', match.inviteCode);
        }
        
        // Invalidate and refetch match queries
        queryClient.invalidateQueries({ queryKey: matchKeys.all });
        
        // Set the match data in cache
        queryClient.setQueryData(
          matchKeys.detail(match.matchId),
          match
        );
      }
    },
  });
}

// Create a new match (legacy - single player only)
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerName: string): Promise<Match> => {
      const requestData = validateRequest(CreateMatchRequestSchema, { playerName });
      
      const response = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create match: ${response.statusText}`);
      }

      const data = await response.json();
      // The API returns the match directly, not wrapped in a response object
      return data as Match;
    },
    onSuccess: (match) => {
      if (match?.matchId) {
        // Store match ID in session
        sessionStorage.setItem('currentMatchId', match.matchId);
        
        // Invalidate and refetch match queries
        queryClient.invalidateQueries({ queryKey: matchKeys.all });
        
        // Set the match data in cache
        queryClient.setQueryData(
          matchKeys.detail(match.matchId),
          match
        );
      }
    },
  });
}

// Submit a response
export function useSubmitResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      matchId: string;
      identity: Identity;
      response: string;
      round: number;
    }): Promise<SubmitResponseResponse> => {
      const requestData = validateRequest(SubmitResponseRequestSchema, {
        identity: params.identity,
        response: params.response,
        round: params.round,
      });

      const response = await fetch(`${API_URL}/matches/${params.matchId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit response: ${response.statusText}`);
      }

      return response.json();
    },
    onMutate: async ({ matchId, identity, response, round }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: matchKeys.detail(matchId) });

      // Snapshot the previous value
      const previousMatch = queryClient.getQueryData<Match>(matchKeys.detail(matchId));

      // Optimistically update the match
      if (previousMatch) {
        const updatedMatch = {
          ...previousMatch,
          rounds: previousMatch.rounds.map((r: Round) => 
            r.roundNumber === round
              ? {
                  ...r,
                  responses: {
                    ...r.responses,
                    [identity]: response,
                  },
                }
              : r
          ),
        };
        
        queryClient.setQueryData(matchKeys.detail(matchId), updatedMatch);
      }

      return { previousMatch };
    },
    onError: (_err, { matchId }, context) => {
      // Rollback on error
      if (context?.previousMatch) {
        queryClient.setQueryData(matchKeys.detail(matchId), context.previousMatch);
      }
    },
    onSettled: (_data, _error, { matchId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}

// Submit a vote
export function useSubmitVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      matchId: string;
      voter: Identity;
      votedFor: Identity;
      round: number;
    }): Promise<SubmitVoteResponse> => {
      const requestData = validateRequest(SubmitVoteRequestSchema, {
        voter: params.voter,
        votedFor: params.votedFor,
        round: params.round,
      });

      const response = await fetch(`${API_URL}/matches/${params.matchId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit vote: ${response.statusText}`);
      }

      return response.json();
    },
    onMutate: async ({ matchId, voter, votedFor, round }) => {
      await queryClient.cancelQueries({ queryKey: matchKeys.detail(matchId) });

      const previousMatch = queryClient.getQueryData<Match>(matchKeys.detail(matchId));

      // Optimistically update the vote
      if (previousMatch) {
        const updatedMatch = {
          ...previousMatch,
          rounds: previousMatch.rounds.map((r: Round) => 
            r.roundNumber === round
              ? {
                  ...r,
                  votes: {
                    ...r.votes,
                    [voter]: votedFor,
                  },
                }
              : r
          ),
        };
        
        queryClient.setQueryData(matchKeys.detail(matchId), updatedMatch);
      }

      return { previousMatch };
    },
    onError: (_err, { matchId }, context) => {
      if (context?.previousMatch) {
        queryClient.setQueryData(matchKeys.detail(matchId), context.previousMatch);
      }
    },
    onSuccess: (data, { matchId }) => {
      // If the response includes updated match data, use it
      if (data.data?.match) {
        queryClient.setQueryData(matchKeys.detail(matchId), data.data.match);
      }
    },
    onSettled: (_data, _error, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}

// Join match by invite code
export function useJoinMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      inviteCode: string;
      displayName: string;
      userId: string;
    }): Promise<{ match: Match }> => {
      const response = await fetch(`${API_URL}/matches/join/${params.inviteCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          displayName: params.displayName,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to join match: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const match = data.match;
      if (match?.matchId) {
        // Store match ID in session
        sessionStorage.setItem('currentMatchId', match.matchId);
        
        // Clear any pending invite code
        sessionStorage.removeItem('pendingInviteCode');
        
        // Invalidate and refetch match queries
        queryClient.invalidateQueries({ queryKey: matchKeys.all });
        
        // Set the match data in cache
        queryClient.setQueryData(
          matchKeys.detail(match.matchId),
          match
        );
      }
    },
  });
}

// Leave match
export function useLeaveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // In the future, this might notify the server
      // For now, just clear local state
      sessionStorage.removeItem('currentMatchId');
      sessionStorage.removeItem('authToken');
    },
    onSuccess: () => {
      // Clear all match data from cache
      queryClient.removeQueries({ queryKey: matchKeys.all });
    },
  });
}