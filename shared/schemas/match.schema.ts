// @ts-ignore - Zod will be resolved by the bundler
import { z } from 'zod';

// Core game types
export const IdentitySchema = z.enum(['A', 'B', 'C', 'D']);
export type Identity = z.infer<typeof IdentitySchema>;

export const MatchStatusSchema = z.enum([
  'waiting',
  'round_active', 
  'round_voting',
  'completed'
]);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const RoundStatusSchema = z.enum(['responding', 'voting', 'complete']);
export type RoundStatus = z.infer<typeof RoundStatusSchema>;

// Participant schema
export const ParticipantSchema = z.object({
  identity: IdentitySchema,
  isAI: z.boolean(),
  playerName: z.string(),
  isConnected: z.boolean(),
  personality: z.string().optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

// Round schema
export const RoundSchema = z.object({
  roundNumber: z.number().int().positive(),
  prompt: z.string(),
  responses: z.any().transform((val: any) => val || {}),
  votes: z.any().transform((val: any) => val || {}),
  scores: z.any().transform((val: any) => val || {}),
  status: RoundStatusSchema,
  presentationOrder: z.array(IdentitySchema).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
export type Round = z.infer<typeof RoundSchema>;

// Main Match schema
export const MatchSchema = z.object({
  matchId: z.string(),
  status: MatchStatusSchema,
  currentRound: z.number().int().positive(),
  totalRounds: z.number().int().positive(),
  participants: z.array(ParticipantSchema).length(4), // Always 4 participants
  rounds: z.array(RoundSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});
export type Match = z.infer<typeof MatchSchema>;

// Validation helpers
export const validateMatch = (data: unknown): Match => {
  return MatchSchema.parse(data);
};

export const validateMatchPartial = (data: unknown): Partial<Match> => {
  return MatchSchema.partial().parse(data);
};

// Type guards
export const isValidIdentity = (value: unknown): value is Identity => {
  return IdentitySchema.safeParse(value).success;
};

export const isMatchComplete = (match: Match): boolean => {
  return match.status === 'completed';
};

export const isRoundComplete = (round: Round): boolean => {
  return round.status === 'complete';
};

// Helper functions for common operations
export const getCurrentRound = (match: Match): Round | undefined => {
  return match.rounds.find((r: any) => r.roundNumber === match.currentRound);
};

export const getParticipantByIdentity = (
  match: Match, 
  identity: Identity
): Participant | undefined => {
  return match.participants.find((p: any) => p.identity === identity);
};

export const getHumanParticipant = (match: Match): Participant | undefined => {
  return match.participants.find((p: any) => !p.isAI);
};

export const hasAllResponses = (round: Round): boolean => {
  return Object.keys(round.responses || {}).length === 4;
};

export const hasAllVotes = (round: Round): boolean => {
  return Object.keys(round.votes || {}).length === 4;
};

export const hasParticipantResponded = (
  round: Round, 
  identity: Identity
): boolean => {
  return !!(round.responses && round.responses[identity]);
};