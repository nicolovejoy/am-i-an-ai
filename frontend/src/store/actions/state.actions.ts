import type { StateCreator } from 'zustand';
import type { SessionStore, ConnectionStatus, Identity, Match, Message } from '../types';

export type StateActions = Pick<
  SessionStore,
  | 'setConnectionStatus'
  | 'setLastError'
  | 'setMatch'
  | 'setMyIdentity'
  | 'setMessages'
  | 'setCurrentPrompt'
  | 'setMyResponse'
  | 'setHasSubmittedResponse'
  | 'setRoundResponses'
  | 'setHasSubmittedVote'
  | 'setIsSessionActive'
  | 'setIsRevealed'
  | 'setIdentityReveal'
  | 'setTypingParticipants'
  | 'resetRoundState'
  | 'resetSession'
>;

export const createStateActions: StateCreator<
  SessionStore,
  [],
  [],
  StateActions
> = (set) => ({
  // Individual State Setters
  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),
  setLastError: (error: string | null) => set({ lastError: error }),
  setMatch: (match: Match | null) => set({ match }),
  setMyIdentity: (identity: Identity | null) => set({ myIdentity: identity }),
  setMessages: (messages: Message[]) => set({ messages }),
  setCurrentPrompt: (prompt: string | null) => set({ currentPrompt: prompt }),
  setMyResponse: (response: string | null) => set({ myResponse: response }),
  setHasSubmittedResponse: (submitted: boolean) => set({ hasSubmittedResponse: submitted }),
  setRoundResponses: (responses: Partial<Record<Identity, string>>) => set({ roundResponses: responses }),
  setHasSubmittedVote: (submitted: boolean) => set({ hasSubmittedVote: submitted }),
  setIsSessionActive: (active: boolean) => set({ isSessionActive: active }),
  setIsRevealed: (revealed: boolean) => set({ isRevealed: revealed }),
  setIdentityReveal: (reveal: Record<Identity, { isAI: boolean; personality?: string }> | null) => set({ identityReveal: reveal }),
  setTypingParticipants: (participants: Set<Identity>) => set({ typingParticipants: participants }),

  resetRoundState: () => {
    set({
      hasSubmittedResponse: false,
      hasSubmittedVote: false,
      myResponse: null,
      roundResponses: {},
    });
  },

  resetSession: () => {
    set({
      connectionStatus: "disconnected",
      lastError: null,
      match: null,
      myIdentity: null,
      messages: [],
      currentPrompt: null,
      myResponse: null,
      hasSubmittedResponse: false,
      roundResponses: {},
      hasSubmittedVote: false,
      isSessionActive: false,
      isRevealed: false,
      identityReveal: null,
      typingParticipants: new Set(),
    });
  },
});