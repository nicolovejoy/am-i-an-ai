/**
 * Core type definitions for 5-Round Match System
 * Clean Match/Round architecture replacing Session/Message terminology
 */

export type Identity = 'A' | 'B' | 'C' | 'D';
export type MatchStatus = 'waiting' | 'round_active' | 'round_voting' | 'completed';
export type ParticipantType = 'human' | 'ai';

export interface Participant {
  /** Unique identifier for this participant */
  id: string;
  /** WebSocket connection ID (null for AI participants) */
  connectionId: string | null;
  /** Anonymous identity (A/B/C/D) */
  identity: Identity;
  /** Human or AI participant */
  type: ParticipantType;
  /** AI personality (only for AI participants) */
  personality?: string;
}

export interface Round {
  /** Round number (1-5) */
  roundNumber: number;
  /** The prompt/question for this round */
  prompt: string;
  /** Response from each participant (A/B/C/D) */
  responses: Partial<Record<Identity, string>>;
  /** Votes: who each participant thinks is human */
  votes: Partial<Record<Identity, Identity>>;
  /** Points earned this round by each participant */
  scores: Partial<Record<Identity, number>>;
  /** AI-generated summary of this round */
  summary?: string;
  /** When this round started */
  startTime: number;
  /** When this round ended */
  endTime?: number;
}

export interface MatchSettings {
  /** Maximum seconds for response phase */
  responseTimeLimit: number;
  /** Maximum seconds for voting phase */
  votingTimeLimit: number;
  /** Maximum seconds for entire round */
  roundTimeLimit: number;
  /** Total number of rounds */
  totalRounds: number;
}

export interface Match {
  /** Unique match identifier */
  matchId: string;
  /** Current match status */
  status: MatchStatus;
  /** Current round number (1-5) */
  currentRound: number;
  /** All participants in this match */
  participants: Participant[];
  /** Round-by-round data */
  rounds: Round[];
  /** Match configuration */
  settings: MatchSettings;
  /** When this match was created */
  createdAt: number;
  /** When this match completed */
  completedAt?: number;
  /** Final scores across all rounds */
  finalScores?: Record<Identity, number>;
}

/**
 * WebSocket message types for round-based gameplay
 */
export interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

export interface JoinMatchMessage extends WebSocketMessage {
  action: 'join_match';
}

export interface SubmitResponseMessage extends WebSocketMessage {
  action: 'submit_response';
  roundNumber: number;
  response: string;
}

export interface SubmitVoteMessage extends WebSocketMessage {
  action: 'submit_vote';
  roundNumber: number;
  humanIdentity: Identity; // Who they think is human
}

export interface MatchStateMessage extends WebSocketMessage {
  action: 'match_state';
  match: Match;
}

export interface RoundStartMessage extends WebSocketMessage {
  action: 'round_start';
  roundNumber: number;
  prompt: string;
  timeLimit: number;
}

export interface RoundVotingMessage extends WebSocketMessage {
  action: 'round_voting';
  roundNumber: number;
  responses: Record<Identity, string>;
  timeLimit: number;
}

export interface RoundCompleteMessage extends WebSocketMessage {
  action: 'round_complete';
  roundNumber: number;
  scores: Record<Identity, number>;
  summary: string;
  isMatchComplete: boolean;
}

export interface MatchCompleteMessage extends WebSocketMessage {
  action: 'match_complete';
  finalScores: Record<Identity, number>;
  rounds: Round[];
}

/**
 * Hardcoded prompts for MVP (replace with AI generation later)
 */
export const MATCH_PROMPTS = [
  "What's one thing that recently surprised you in a good way?",
  "If you could teleport anywhere right now, where would you go?",
  "What's one small thing that often makes your day better?",
  "What's a random act of kindness you've seen or done?",
  "What's a beloved sound or smell that triggers nostalgia?",
  "What's a new idea you just came up with?"
] as const;

/**
 * Default match settings for MVP
 */
export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  responseTimeLimit: 90,    // 90 seconds max per response
  votingTimeLimit: 30,      // 30 seconds for voting
  roundTimeLimit: 300,      // 5 minutes total per round
  totalRounds: 5            // 5 rounds per match
};

/**
 * AI personalities for mock responses
 */
export const AI_PERSONALITIES = {
  curious_student: "Curious and asking questions, uses casual language",
  witty_professional: "Professional but with dry humor, concise responses", 
  friendly_skeptic: "Friendly but questions assumptions, thoughtful responses"
} as const;

export type AIPersonality = keyof typeof AI_PERSONALITIES;