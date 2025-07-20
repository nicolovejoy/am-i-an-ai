// @ts-ignore - Zod will be resolved by the bundler
import { z } from 'zod';
import { IdentitySchema, MatchSchema } from './match.schema';

// SQS Message types for robot-worker queue
export const RobotTaskTypeSchema = z.enum([
  'generate_response',
  'analyze_round',
  'prepare_vote',
]);
export type RobotTaskType = z.infer<typeof RobotTaskTypeSchema>;

export const RobotTaskMessageSchema = z.object({
  type: RobotTaskTypeSchema,
  matchId: z.string(),
  roundNumber: z.number().int().positive(),
  robotIdentity: IdentitySchema,
  prompt: z.string(),
  timestamp: z.string().datetime(),
  retryCount: z.number().int().nonnegative().default(0),
});
export type RobotTaskMessage = z.infer<typeof RobotTaskMessageSchema>;

// State update messages (for the new state-updates queue)
export const StateUpdateTypeSchema = z.enum([
  'ROBOT_RESPONSE_COMPLETE',
  'ROUND_TRANSITION',
  'MATCH_COMPLETE',
  'ERROR',
]);
export type StateUpdateType = z.infer<typeof StateUpdateTypeSchema>;

export const StateUpdateMessageSchema = z.object({
  type: StateUpdateTypeSchema,
  matchId: z.string(),
  roundNumber: z.number().int().positive().optional(),
  robotId: IdentitySchema.optional(),
  response: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type StateUpdateMessage = z.infer<typeof StateUpdateMessageSchema>;

// Frontend real-time events (for future WebSocket/SSE)
export const RealtimeEventTypeSchema = z.enum([
  'connection_established',
  'match_state_sync',
  'participant_typing',
  'participant_submitted',
  'round_transition',
  'reveal_identities',
  'error',
]);
export type RealtimeEventType = z.infer<typeof RealtimeEventTypeSchema>;

export const ParticipantTypingEventSchema = z.object({
  type: z.literal('participant_typing'),
  matchId: z.string(),
  identity: IdentitySchema,
  isTyping: z.boolean(),
});

export const ParticipantSubmittedEventSchema = z.object({
  type: z.literal('participant_submitted'),
  matchId: z.string(),
  identity: IdentitySchema,
  roundNumber: z.number(),
});

export const RoundTransitionEventSchema = z.object({
  type: z.literal('round_transition'),
  matchId: z.string(),
  fromRound: z.number(),
  toRound: z.number(),
  newPrompt: z.string(),
});

export const RevealIdentitiesEventSchema = z.object({
  type: z.literal('reveal_identities'),
  matchId: z.string(),
  identities: z.record(IdentitySchema, z.object({
    isAI: z.boolean(),
    playerName: z.string(),
    personality: z.string().optional(),
  })),
});

// Union of all realtime events
export const RealtimeEventSchema = z.discriminatedUnion('type', [
  ParticipantTypingEventSchema,
  ParticipantSubmittedEventSchema,
  RoundTransitionEventSchema,
  RevealIdentitiesEventSchema,
  z.object({
    type: z.literal('connection_established'),
    matchId: z.string(),
    identity: IdentitySchema,
  }),
  z.object({
    type: z.literal('match_state_sync'),
    match: MatchSchema,
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
    code: z.string().optional(),
  }),
]);
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

// Event validation helpers
export const validateRobotTask = (data: unknown): RobotTaskMessage => {
  return RobotTaskMessageSchema.parse(data);
};

export const validateStateUpdate = (data: unknown): StateUpdateMessage => {
  return StateUpdateMessageSchema.parse(data);
};

export const validateRealtimeEvent = (data: unknown): RealtimeEvent => {
  return RealtimeEventSchema.parse(data);
};