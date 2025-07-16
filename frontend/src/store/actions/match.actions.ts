// Temporary stub file - will be removed after migration
import type { StateCreator } from 'zustand';
import type { SessionStore } from '../types';

export type MatchActions = Pick<
  SessionStore,
  'createRealMatch' | 'pollMatchUpdates'
>;

export const createMatchActions: StateCreator<
  SessionStore,
  [],
  [],
  MatchActions
> = (set, get) => ({
  createRealMatch: async (playerName: string) => {
    try {
      set({ connectionStatus: 'connecting' });
      
      const response = await fetch(`${import.meta.env.VITE_MATCH_SERVICE_API}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify({ playerName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create match');
      }

      const data = await response.json();
      
      if (data.match) {
        // Store match data
        set({
          match: data.match,
          connectionStatus: 'connected',
          isSessionActive: true,
          myIdentity: data.match.participants.find((p: any) => !p.isAI)?.identity || 'A',
        });
        
        // Store match ID in session
        sessionStorage.setItem('currentMatchId', data.match.matchId);
        
        // Navigate to match page
        window.location.href = '/match';
      }
    } catch (error) {
      console.error('Failed to create match:', error);
      set({
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Failed to create match',
      });
      throw error;
    }
  },

  pollMatchUpdates: async (matchId: string) => {
    // This is actually used, so let's implement it
    try {
      const response = await fetch(`${import.meta.env.VITE_MATCH_SERVICE_API}/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch match');
      }
      
      const match = await response.json();
      
      // Update state with the fetched match
      set({
        match,
        connectionStatus: "connected",
        isSessionActive: true,
      });
      
      // Find human participant to get identity
      const humanParticipant = match.participants?.find((p: any) => !p.isAI);
      const myIdentity = humanParticipant?.identity || 'A';
      set({ myIdentity });
      
      // Update current round info
      const currentRound = match.rounds?.find(
        (r: any) => r.roundNumber === match.currentRound
      );
      
      if (currentRound) {
        set({
          currentPrompt: currentRound.prompt || null,
          roundResponses: currentRound.responses || {},
        });
      }
      
      // Check for round changes and reset state if needed
      const previousRound = get().match?.currentRound;
      if (previousRound !== undefined && previousRound !== match.currentRound) {
        console.log(`Round changed from ${previousRound} to ${match.currentRound}`);
        get().resetRoundState?.();
      }
      
    } catch (error) {
      console.error('Failed to poll match updates:', error);
      set({ 
        lastError: error instanceof Error ? error.message : 'Failed to fetch match updates' 
      });
    }
  },
});