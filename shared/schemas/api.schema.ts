// @ts-ignore - Zod will be resolved by the bundler
import { z } from 'zod';
import { IdentitySchema, MatchSchema } from './match.schema';

// Base API response schema
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  });

// Create match request
export const CreateMatchRequestSchema = z.object({
  playerName: z.string().min(1).max(50),
});
export type CreateMatchRequest = z.infer<typeof CreateMatchRequestSchema>;

export const CreateMatchResponseSchema = ApiResponseSchema(
  z.object({
    match: MatchSchema,
    token: z.string().optional(), // For future auth
  })
);
export type CreateMatchResponse = z.infer<typeof CreateMatchResponseSchema>;

// Submit response request
export const SubmitResponseRequestSchema = z.object({
  identity: IdentitySchema,
  response: z.string().min(1).max(280), // Twitter-like limit
  round: z.number().int().positive(),
});
export type SubmitResponseRequest = z.infer<typeof SubmitResponseRequestSchema>;

export const SubmitResponseResponseSchema = ApiResponseSchema(
  z.object({
    match: MatchSchema,
    accepted: z.boolean(),
  })
);
export type SubmitResponseResponse = z.infer<typeof SubmitResponseResponseSchema>;

// Submit vote request
export const SubmitVoteRequestSchema = z.object({
  voter: IdentitySchema,
  votedFor: IdentitySchema,
  round: z.number().int().positive(),
});
export type SubmitVoteRequest = z.infer<typeof SubmitVoteRequestSchema>;

export const SubmitVoteResponseSchema = ApiResponseSchema(
  z.object({
    match: MatchSchema,
    roundComplete: z.boolean(),
    matchComplete: z.boolean(),
  })
);
export type SubmitVoteResponse = z.infer<typeof SubmitVoteResponseSchema>;

// Get match request (just path param)
export const GetMatchResponseSchema = ApiResponseSchema(MatchSchema);
export type GetMatchResponse = z.infer<typeof GetMatchResponseSchema>;

// WebSocket/SSE event schemas
export const MatchEventTypeSchema = z.enum([
  'match_updated',
  'round_started',
  'response_submitted',
  'vote_submitted',
  'round_complete',
  'match_complete',
  'participant_connected',
  'participant_disconnected',
]);
export type MatchEventType = z.infer<typeof MatchEventTypeSchema>;

export const MatchEventSchema = z.object({
  type: MatchEventTypeSchema,
  matchId: z.string(),
  data: z.any(), // Could be more specific per event type
  timestamp: z.string().datetime(),
});
export type MatchEvent = z.infer<typeof MatchEventSchema>;

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation middleware helpers
export const validateRequest = <T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${(error as z.ZodError).errors.map((e: any) => e.message).join(', ')}`);
    }
    throw error;
  }
};