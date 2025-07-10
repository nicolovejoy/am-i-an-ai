import type { Identity, Match, Message } from './match.types';

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface SessionState {
  // Connection
  connectionStatus: ConnectionStatus;
  lastError: string | null;

  // Match data
  match: Match | null;
  myIdentity: Identity | null;
  messages: Message[]; // Keep for backward compatibility during transition

  // Current round state
  currentPrompt: string | null;
  myResponse: string | null;
  hasSubmittedResponse: boolean;
  roundResponses: Partial<Record<Identity, string>>;
  hasSubmittedVote: boolean;

  // Timer
  isSessionActive: boolean;

  // Match completion
  isRevealed: boolean;
  identityReveal: Record<Identity, { isAI: boolean; personality?: string }> | null;

  // Testing mode
  identityMapping: Record<string, number>; // Maps A,B,C,D to player numbers 1,2,3,4
  typingParticipants: Set<Identity>;
}

export interface SessionActions {
  // Individual State Setters
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastError: (error: string | null) => void;
  setMatch: (match: Match | null) => void;
  setMyIdentity: (identity: Identity | null) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentPrompt: (prompt: string | null) => void;
  setMyResponse: (response: string | null) => void;
  setHasSubmittedResponse: (submitted: boolean) => void;
  setRoundResponses: (responses: Partial<Record<Identity, string>>) => void;
  setHasSubmittedVote: (submitted: boolean) => void;
  setIsSessionActive: (active: boolean) => void;
  setIsRevealed: (revealed: boolean) => void;
  setIdentityReveal: (reveal: Record<Identity, { isAI: boolean; personality?: string }> | null) => void;
  setTypingParticipants: (participants: Set<Identity>) => void;

  // Complex Actions
  createRealMatch: (playerName: string) => Promise<void>;
  submitResponse: (response: string) => void;
  submitVote: (humanIdentity: Identity) => void;
  pollMatchUpdates: (matchId: string) => Promise<void>;
  resetRoundState: () => void;
  resetSession: () => void;

  // Legacy methods (for backward compatibility)
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  reset: () => void;
}

export type SessionStore = SessionState & SessionActions;