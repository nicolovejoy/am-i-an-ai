// @ts-ignore - Zod will be resolved by the bundler
import { z } from 'zod';

// Core game types
// Extended to support up to 8 players for variable match formats
export const IdentitySchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
export type Identity = z.infer<typeof IdentitySchema>;

export const MatchStatusSchema = z.enum([
  'waiting',
  'round_active', 
  'round_voting',
  'completed',
  'waiting_for_players' // New state for multi-human matches
]);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

// New match status for multi-human support (Phase 3)
export const MatchStatusV2Schema = z.enum([
  'initiated',     // Waiting for all humans to join
  'active',        // Match in progress
  'completed'      // Match finished
]);
export type MatchStatusV2 = z.infer<typeof MatchStatusV2Schema>;

export const RoundStatusSchema = z.enum(['responding', 'voting', 'complete']);
export type RoundStatus = z.infer<typeof RoundStatusSchema>;

// Participant schema
export const ParticipantSchema = z.object({
  identity: IdentitySchema,
  isAI: z.boolean(),
  playerName: z.string(),
  isConnected: z.boolean(),
  personality: z.string().optional(),
  // New fields for multi-human support
  userId: z.string().optional(),
  displayName: z.string().optional(),
  isReady: z.boolean().optional(),
  joinedAt: z.string().optional()
});
export type Participant = z.infer<typeof ParticipantSchema>;

// New participant schema for user-based system (Phase 1)
export const ParticipantV2Schema = z.object({
  userId: z.string().uuid(),
  hasResponded: z.boolean().default(false),
  joinedAt: z.string().datetime(),
  lastSeen: z.string().datetime(),
});
export type ParticipantV2 = z.infer<typeof ParticipantV2Schema>;

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

// Match template type
export const MatchTemplateTypeSchema = z.enum(['classic_1v3', 'duo_2v2', 'admin_custom', 'trio_3v3', 'solo_1v5', 'duel_2v1', 'mega_4v4']);
export type MatchTemplateType = z.infer<typeof MatchTemplateTypeSchema>;

// Base Match schema (without refinements)
const MatchBaseSchema = z.object({
  matchId: z.string(),
  status: MatchStatusSchema,
  currentRound: z.number().int().positive(),
  totalRounds: z.number().int().positive(),
  totalParticipants: z.number().int().positive().optional(), // Expected total from template
  participants: z.array(ParticipantSchema),
  rounds: z.array(RoundSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  // New fields for multi-human support
  templateType: MatchTemplateTypeSchema.optional(),
  inviteCode: z.string().optional(),
  waitingFor: z.object({
    humans: z.number(),
    ai: z.number()
  }).optional(),
  inviteUrl: z.string().optional()
});

// Main Match schema with refinements
export const MatchSchema = MatchBaseSchema.superRefine((data: z.infer<typeof MatchBaseSchema>, ctx: z.RefinementCtx) => {
  // Get expected total from totalParticipants or default to 4
  const expectedTotal = data.totalParticipants || 4;
  
  if (data.status === 'waiting_for_players') {
    // During waiting, allow 1 to expectedTotal participants
    if (data.participants.length < 1 || data.participants.length > expectedTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Waiting matches must have 1-${expectedTotal} participants`,
        path: ['participants']
      });
    }
  } else {
    // Active matches must have exact count
    if (data.participants.length !== expectedTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Active matches must have exactly ${expectedTotal} participants`,
        path: ['participants']
      });
    }
  }
});
export type Match = z.infer<typeof MatchSchema>;

// Validation helpers
export const validateMatch = (data: unknown): Match => {
  return MatchSchema.parse(data);
};

export const validateMatchPartial = (data: unknown): Partial<Match> => {
  return MatchBaseSchema.partial().parse(data);
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

export const hasAllResponses = (round: Round, totalParticipants: number = 4): boolean => {
  return Object.keys(round.responses || {}).length === totalParticipants;
};

export const hasAllVotes = (round: Round, totalParticipants: number = 4): boolean => {
  return Object.keys(round.votes || {}).length === totalParticipants;
};

export const hasParticipantResponded = (
  round: Round, 
  identity: Identity
): boolean => {
  return !!(round.responses && round.responses[identity]);
};