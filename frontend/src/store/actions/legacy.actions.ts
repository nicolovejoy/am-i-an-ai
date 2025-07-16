// Temporary stub file - will be removed after migration
import type { StateCreator } from 'zustand';
import type { SessionStore } from '../types';

export type LegacyActions = Pick<
  SessionStore,
  'connect' | 'disconnect' | 'sendMessage' | 'setTestingMode' | 'reset'
>;

export const createLegacyActions: StateCreator<
  SessionStore,
  [],
  [],
  LegacyActions
> = (set, get) => ({
  connect: () => {
    console.log('Legacy connect called - redirecting to dashboard');
    window.location.href = '/dashboard';
  },

  disconnect: () => {
    set({
      connectionStatus: "disconnected",
      match: null,
      myIdentity: null,
      messages: [],
      currentPrompt: null,
      myResponse: null,
      hasSubmittedResponse: false,
      roundResponses: {},
      hasSubmittedVote: false,
      isSessionActive: false,
    });
  },

  sendMessage: (content: string) => {
    console.log('Legacy sendMessage called:', content);
    // No-op for now
  },

  setTestingMode: (enabled: boolean) => {
    console.log('Legacy setTestingMode called:', enabled);
    // No-op for now
  },

  reset: () => {
    get().disconnect();
  },
});