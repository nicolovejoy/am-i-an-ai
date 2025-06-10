/**
 * Shared persona type definitions used by both frontend and backend
 */

export type PersonaType = 'human_persona' | 'ai_agent' | 'ai_ambiguous';

export type InteractionType = 
  | 'casual_chat' 
  | 'debate' 
  | 'roleplay' 
  | 'interview' 
  | 'brainstorm'
  | 'storytelling';

export type CommunicationStyle = 
  | 'formal' 
  | 'casual' 
  | 'academic' 
  | 'creative' 
  | 'technical' 
  | 'empathetic'
  | 'analytical'
  | 'humorous';

export type KnowledgeDomain = 
  | 'technology' 
  | 'science' 
  | 'arts' 
  | 'business' 
  | 'philosophy' 
  | 'history'
  | 'psychology'
  | 'health'
  | 'entertainment'
  | 'politics'
  | 'education'
  | 'general';

export interface PersonalityTraits {
  openness: number; // 0-100
  conscientiousness: number; // 0-100
  extraversion: number; // 0-100
  agreeableness: number; // 0-100
  neuroticism: number; // 0-100
  creativity: number; // 0-100
  assertiveness: number; // 0-100
  empathy: number; // 0-100
}

export interface AIModelConfig {
  modelProvider: 'openai' | 'anthropic' | 'google' | 'custom';
  modelName: string;
  temperature: number; // 0-2
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  customParameters?: Record<string, unknown>;
}

/**
 * Core persona interface
 * Frontend uses camelCase, backend uses snake_case
 * Use transformation utilities to convert between formats
 */
export interface Persona {
  id: string;
  name: string;
  type: PersonaType;
  ownerId?: string; // null for autonomous AI agents
  
  // Persona characteristics
  description: string;
  personality: PersonalityTraits;
  knowledge: KnowledgeDomain[];
  communicationStyle: CommunicationStyle;
  
  // AI-specific fields
  modelConfig?: AIModelConfig;
  systemPrompt?: string;
  
  // Behavior settings
  responseTimeRange?: {
    min: number; // milliseconds
    max: number; // milliseconds
  };
  typingSpeed?: number; // characters per second
  
  // Visibility & permissions
  isPublic: boolean;
  allowedInteractions: InteractionType[];
  
  // Statistics
  conversationCount: number;
  totalMessages: number;
  averageRating: number;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backend persona format (snake_case)
 * This interface represents how personas are stored in the database
 */
export interface PersonaData {
  id: string;
  name: string;
  type: PersonaType;
  owner_id?: string;
  description: string;
  personality_traits: any; // JSON stored as object
  knowledge_areas: KnowledgeDomain[];
  communication_style: CommunicationStyle;
  model_config?: any; // JSON stored as object
  system_prompt?: string;
  response_time_range?: any; // JSON stored as object
  typing_speed?: number;
  is_public: boolean;
  allowed_interactions: InteractionType[];
  conversation_count: number;
  total_messages: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface PersonaCreate {
  name: string;
  type: PersonaType;
  description: string;
  personality: PersonalityTraits;
  knowledge: KnowledgeDomain[];
  communicationStyle: CommunicationStyle;
  modelConfig?: AIModelConfig;
  systemPrompt?: string;
  isPublic?: boolean;
  allowedInteractions?: InteractionType[];
}

export interface PersonaUpdate {
  name?: string;
  description?: string;
  personality?: PersonalityTraits;
  knowledge?: KnowledgeDomain[];
  communicationStyle?: CommunicationStyle;
  modelConfig?: AIModelConfig;
  systemPrompt?: string;
  isPublic?: boolean;
  allowedInteractions?: InteractionType[];
}

export interface PersonaResponse {
  content: string;
  emotionalTone?: 'neutral' | 'positive' | 'negative' | 'mixed';
  confidence: number; // 0-1
  reasoning?: string; // Internal reasoning (not shown to users)
}

export interface PersonaCompatibility {
  personaId1: string;
  personaId2: string;
  compatibilityScore: number; // 0-100
  strengths: string[];
  challenges: string[];
  recommendedInteractions: InteractionType[];
}

export interface PersonaStats {
  personaId: string;
  period: 'day' | 'week' | 'month' | 'all';
  messagesCount: number;
  conversationsCount: number;
  averageResponseTime: number;
  averageMessageLength: number;
  topTopics: string[];
  sentimentDistribution: Record<string, number>;
  engagementScore: number;
  qualityMetrics: {
    clarity: number;
    relevance: number;
    creativity: number;
    empathy: number;
  };
}