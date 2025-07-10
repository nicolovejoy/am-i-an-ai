import type { StateCreator } from 'zustand';
import type { SessionStore, Identity } from '../types';
import { matchService } from '../api/matchService';

export type GameActions = Pick<
  SessionStore,
  'submitResponse' | 'submitVote'
>;

export const createGameActions: StateCreator<
  SessionStore,
  [],
  [],
  GameActions
> = (set, get) => ({
  submitResponse: (response: string) => {
    const state = get();
    
    if (!state.match?.matchId || !state.myIdentity) {
      console.error("Cannot submit response: no active match or identity");
      return;
    }

    // Update UI immediately
    set({
      myResponse: response.trim(),
      hasSubmittedResponse: true,
    });

    // Submit async
    const submitAsync = async () => {
      try {
        const result = await matchService.submitResponse(
          state.match!.matchId,
          state.myIdentity!,
          response,
          state.match!.currentRound || 1
        );
        
        // Update match state if response includes updated data
        if (result.match) {
          set({ match: result.match });
          
          // Update current prompt if we moved to a new round
          const currentRound = result.match.rounds?.find(
            r => r.roundNumber === result.match!.currentRound
          );
          
          if (currentRound?.prompt) {
            set({ currentPrompt: currentRound.prompt });
          }
          
          // Update round responses
          if (currentRound?.responses) {
            set({ roundResponses: currentRound.responses });
          }
        }
      } catch (error) {
        console.error("Failed to submit response:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Failed to submit response";
        set({ lastError: errorMessage });
        
        // Revert UI state on error
        set({
          hasSubmittedResponse: false,
          myResponse: null,
        });
      }
    };

    submitAsync();
  },

  submitVote: (humanIdentity: Identity) => {
    const state = get();
    
    if (!state.match?.matchId || !state.myIdentity) {
      console.error("Cannot submit vote: no active match or identity");
      return;
    }

    // Update UI immediately
    set({ hasSubmittedVote: true });

    // Submit async
    const submitAsync = async () => {
      try {
        const result = await matchService.submitVote(
          state.match!.matchId,
          state.myIdentity!,
          humanIdentity,
          state.match!.currentRound || 1
        );
        
        // Update match state if response includes updated data
        if (result.match) {
          set({ match: result.match });
          
          // Check if we moved to a new round
          const currentRound = result.match.rounds?.find(
            r => r.roundNumber === result.match!.currentRound
          );
          
          if (currentRound?.prompt && currentRound.prompt !== state.currentPrompt) {
            set({ currentPrompt: currentRound.prompt });
            
            // Reset round state for new round
            get().resetRoundState();
          }
        }
      } catch (error) {
        console.error("Failed to submit vote:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Failed to submit vote";
        set({ lastError: errorMessage });
        
        // Revert UI state on error
        set({ hasSubmittedVote: false });
      }
    };

    submitAsync();
  },
});