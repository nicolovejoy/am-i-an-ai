import { z } from 'zod';

// Define the schema once
export const AIRequestSchema = z.object({
  task: z.enum(['generate_prompt', 'robot_response', 'analyze_match', 'summarize', 'custom']),
  model: z.enum(['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus']).optional(),
  inputs: z.record(z.any()),
  options: z.object({
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(1).max(4096).optional(),
    streaming: z.boolean().optional()
  }).optional()
});

// Export the TypeScript type inferred from the schema
export type AIRequest = z.infer<typeof AIRequestSchema>;

// Response schemas
export const PromptResultSchema = z.object({
  prompt: z.string(),
  metadata: z.object({
    round: z.number(),
    basedOn: z.string(),
    theme: z.string().optional(),
    model: z.string(),
    timestamp: z.string()
  })
});

export type PromptResult = z.infer<typeof PromptResultSchema>;

export const RobotResponseResultSchema = z.object({
  response: z.string()
});

export type RobotResponseResult = z.infer<typeof RobotResponseResultSchema>;

export const AIResponseSchema = z.object({
  success: z.boolean(),
  task: AIRequestSchema.shape.task,
  model: z.enum(['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus']),
  result: z.any() // This could be more specific based on task
});

export type AIResponse<T = any> = Omit<z.infer<typeof AIResponseSchema>, 'result'> & {
  result: T;
};