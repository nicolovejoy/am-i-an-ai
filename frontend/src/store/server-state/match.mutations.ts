import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Match,
  Identity,
  CreateMatchRequest,
  CreateMatchResponse,
  SubmitResponseRequest,
  SubmitResponseResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
  validateRequest,
  CreateMatchRequestSchema,
  SubmitResponseRequestSchema,
  SubmitVoteRequestSchema,
} from '@shared/schemas';
import { matchKeys } from './match.queries';

const API_URL = import.meta.env.VITE_MATCH_SERVICE_API || '';

// Create a new match
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerName: string): Promise<CreateMatchResponse> => {
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

      return response.json();
    },
    onSuccess: (data) => {
      if (data.data?.match) {
        // Store match ID in session
        sessionStorage.setItem('currentMatchId', data.data.match.matchId);
        
        // Invalidate and refetch match queries
        queryClient.invalidateQueries({ queryKey: matchKeys.all });
        
        // Set the match data in cache
        queryClient.setQueryData(
          matchKeys.detail(data.data.match.matchId),
          data.data.match
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
          rounds: previousMatch.rounds.map(r => 
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
    onError: (err, { matchId }, context) => {
      // Rollback on error
      if (context?.previousMatch) {
        queryClient.setQueryData(matchKeys.detail(matchId), context.previousMatch);
      }
    },
    onSettled: (data, error, { matchId }) => {
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
          rounds: previousMatch.rounds.map(r => 
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
    onError: (err, { matchId }, context) => {
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
    onSettled: (data, error, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    },
  });
}

// Leave match
export function useLeaveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
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