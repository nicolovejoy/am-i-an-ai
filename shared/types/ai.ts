/**
 * Shared AI-related type definitions used by both frontend and backend
 */

import { Message } from './messages';
import { Persona } from './personas';

/**
 * Context for AI response generation
 * Provides all necessary information about the conversation state
 */
export interface ConversationContext {
  conversationId: string;
  messages: Message[];
  participants: Persona[];
  currentTopic?: string;
  conversationGoal?: string;
  timeElapsed?: number;
}

/**
 * Configuration for AI model behavior
 */
export interface AIModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: string;
}

/**
 * AI response generation request
 */
export interface AIGenerateRequest {
  conversationId: string;
  personaId: string;
  context?: ConversationContext;
  modelOverrides?: Partial<AIModelConfig>;
}

/**
 * AI response generation result
 */
export interface AIGenerateResponse {
  message: string;
  personaId: string;
  conversationId: string;
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'demo';
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * Prompt building configuration
 */
export interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
  examples?: Array<{
    user: string;
    assistant: string;
  }>;
  constraints?: string[];
}