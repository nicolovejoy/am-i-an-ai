import { z } from 'zod';
import { IdentitySchema } from './match.schema';

// Game configuration schemas
export const GameConfigSchema = z.object({
  totalRounds: z.number().int().min(1).max(10).default(5),
  responseTimeLimit: z.number().int().min(30).max(300).default(120), // seconds
  voteTimeLimit: z.number().int().min(30).max(180).default(90), // seconds
  minResponseLength: z.number().int().min(1).default(10),
  maxResponseLength: z.number().int().min(50).max(500).default(280),
  aiPersonalities: z.array(z.string()).default(['Doc', 'Happy', 'Dopey']),
});
export type GameConfig = z.infer<typeof GameConfigSchema>;

// Scoring schemas
export const VoteResultSchema = z.object({
  voter: IdentitySchema,
  votedFor: IdentitySchema,
  correct: z.boolean(),
  points: z.number(),
});
export type VoteResult = z.infer<typeof VoteResultSchema>;

export const RoundScoringSchema = z.object({
  roundNumber: z.number(),
  voteResults: z.array(VoteResultSchema),
  bonusPoints: z.record(IdentitySchema, z.number()).optional(),
  humanIdentity: IdentitySchema,
  successfullyDeceived: z.number(), // How many AI votes the human got
});
export type RoundScoring = z.infer<typeof RoundScoringSchema>;

export const PlayerStatsSchema = z.object({
  identity: IdentitySchema,
  totalScore: z.number(),
  correctVotes: z.number(),
  timesVotedAsHuman: z.number(),
  averageResponseTime: z.number().optional(),
  roundScores: z.array(z.number()),
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

export const MatchResultSchema = z.object({
  matchId: z.string(),
  winner: IdentitySchema.optional(), // Could be a tie
  finalScores: z.record(IdentitySchema, z.number()),
  playerStats: z.array(PlayerStatsSchema),
  mvpIdentity: IdentitySchema.optional(), // Most successful at deception
  completedRounds: z.number(),
  duration: z.number(), // milliseconds
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

// Prompt generation schemas
export const PromptCategorySchema = z.enum([
  'creative',
  'philosophical',
  'humorous',
  'nostalgic',
  'hypothetical',
  'sensory',
  'emotional',
]);
export type PromptCategory = z.infer<typeof PromptCategorySchema>;

export const PromptMetadataSchema = z.object({
  category: PromptCategorySchema,
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['predefined', 'ai_generated']).default('predefined'),
});
export type PromptMetadata = z.infer<typeof PromptMetadataSchema>;

// Achievement schemas (for future gamification)
export const AchievementTypeSchema = z.enum([
  'first_win',
  'perfect_round',
  'master_deceiver',
  'detective',
  'prolific_writer',
  'speed_demon',
]);
export type AchievementType = z.infer<typeof AchievementTypeSchema>;

export const AchievementSchema = z.object({
  type: AchievementTypeSchema,
  unlockedAt: z.string().datetime(),
  matchId: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});
export type Achievement = z.infer<typeof AchievementSchema>;

// Helper functions for game logic
export const calculateVotePoints = (correct: boolean): number => {
  return correct ? 100 : 0;
};

export const calculateDeceptionBonus = (votesReceived: number): number => {
  return votesReceived * 50; // 50 points per AI vote received
};

export const isWinningScore = (score: number, allScores: number[]): boolean => {
  return score === Math.max(...allScores);
};