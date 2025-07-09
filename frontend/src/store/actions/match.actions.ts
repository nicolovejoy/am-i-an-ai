import { StateCreator } from 'zustand';
import { SessionStore, Match } from '../types';
import { matchService } from '../api/matchService';

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
      // Update UI state
      set({ connectionStatus: "connecting" });

      // Create match via API
      const match = await matchService.createMatch(playerName);
      
      // Find human participant
      const humanParticipant = match.participants?.find(p => !p.isAI);
      const myIdentity = humanParticipant?.identity || 'A';

      // Get current round prompt
      const currentRound = match.rounds?.find(
        r => r.roundNumber === match.currentRound
      );
      const currentPrompt = currentRound?.prompt || "Waiting for match to start...";

      // Update store with match data
      set({
        connectionStatus: "connected",
        match,
        myIdentity,
        isSessionActive: true,
        currentPrompt,
      });

    } catch (error) {
      console.error("Failed to create match:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      set({
        connectionStatus: "error",
        lastError: errorMessage,
      });
      
      // Re-throw for UI handling
      throw error;
    }
  },

  pollMatchUpdates: async (matchId: string) => {
    try {
      const match = await matchService.getMatch(matchId);
      
      // Update match in store
      set({ match });

      // Update current round info if needed
      const currentRound = match.rounds?.find(
        r => r.roundNumber === match.currentRound
      );
      
      if (currentRound) {
        set({
          currentPrompt: currentRound.prompt,
          roundResponses: currentRound.responses || {},
        });
      }
    } catch (error) {
      console.error("Failed to poll match updates:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch match updates";
      set({ lastError: errorMessage });
    }
  },
});