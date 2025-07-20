// @ts-ignore - Zod will be resolved by the bundler
import { z } from 'zod';

// User types
export const UserTypeSchema = z.enum(['human', 'ai']);
export type UserType = z.infer<typeof UserTypeSchema>;

// Model configuration for AI users
export const ModelConfigSchema = z.object({
  provider: z.literal('bedrock'),
  model: z.enum(['claude-3-haiku', 'claude-3-sonnet']),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// User schema
export const UserSchema = z.object({
  userId: z.string().uuid(),
  userType: UserTypeSchema,
  displayName: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
  
  // Human-specific fields
  cognitoId: z.string().optional(),
  email: z.string().email().optional(),
  
  // AI-specific fields
  personality: z.string().optional(),
  modelConfig: ModelConfigSchema.optional(),
  
  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// Create user request schemas
export const CreateHumanUserSchema = z.object({
  cognitoId: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  isAdmin: z.boolean().optional(),
});

export const CreateAIUserSchema = z.object({
  displayName: z.string().min(1).max(100),
  personality: z.string(),
  modelConfig: ModelConfigSchema,
});

export type CreateHumanUser = z.infer<typeof CreateHumanUserSchema>;
export type CreateAIUser = z.infer<typeof CreateAIUserSchema>;