import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { SessionStore, SessionState } from './types';
import { 
  createStateActions,
  createMatchActions,
  createGameActions,
  createLegacyActions 
} from './actions';

// Re-export types for backward compatibility
export type { Identity, Message, Round, Match, Participant, ConnectionStatus } from './types';

const initialState: SessionState = {
  // Connection
  connectionStatus: "disconnected",
  lastError: null,
  
  // Match data
  match: null,
  myIdentity: null,
  messages: [], // Keep for backward compatibility
  
  // Current round state
  currentPrompt: null,
  myResponse: null,
  hasSubmittedResponse: false,
  roundResponses: {},
  hasSubmittedVote: false,
  
  // Timer
  isSessionActive: false,
  
  // Match completion
  isRevealed: false,
  identityReveal: null,
  
  // Testing mode
  identityMapping: { A: 1, B: 2, C: 3, D: 4 },
  typingParticipants: new Set(),
};

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get, api) => ({
      ...initialState,
      ...createStateActions(set, get, api),
      ...createMatchActions(set, get, api),
      ...createGameActions(set, get, api),
      ...createLegacyActions(set, get, api),
    }),
    {
      name: "session-store",
    }
  )
);