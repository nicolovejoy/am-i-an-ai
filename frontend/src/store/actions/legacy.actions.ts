import type { StateCreator } from 'zustand';
import type { SessionStore } from '../types';

export type LegacyActions = Pick<
  SessionStore,
  'connect' | 'disconnect' | 'sendMessage' | 'reset'
>;

export const createLegacyActions: StateCreator<
  SessionStore,
  [],
  [],
  LegacyActions
> = (_, get) => ({
  // Legacy connect method - redirects to dashboard
  connect: () => {
    window.location.href = '/dashboard';
  },

  // Legacy disconnect method
  disconnect: () => {
    const { resetSession } = get();
    resetSession();
  },

  // Legacy sendMessage - delegate to submitResponse
  sendMessage: (content: string) => {
    const { submitResponse } = get();
    submitResponse(content);
  },

  // Legacy reset method (alias to resetSession)
  reset: () => {
    const { resetSession } = get();
    resetSession();
  },
});