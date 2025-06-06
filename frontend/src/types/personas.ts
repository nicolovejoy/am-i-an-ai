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

export interface PersonaCreate {
  name: string;
  type: PersonaType;
  description: string;
  personality: PersonalityTraits;
  knowledge: KnowledgeDomain[];
  communicationStyle: CommunicationStyle;
  modelConfig?: AIModelConfig;
  systemPrompt?: string;
  isPublic: boolean;
  allowedInteractions: InteractionType[];
}

export interface PersonaUpdate {
  name?: string;
  description?: string;
  personality?: Partial<PersonalityTraits>;
  knowledge?: KnowledgeDomain[];
  communicationStyle?: CommunicationStyle;
  modelConfig?: AIModelConfig;
  systemPrompt?: string;
  isPublic?: boolean;
  allowedInteractions?: InteractionType[];
}

export interface PersonaStats {
  personaId: string;
  totalConversations: number;
  totalMessages: number;
  averageConversationLength: number;
  averageResponseTime: number;
  topTopics: string[];
  interactionTypes: Record<InteractionType, number>;
  partnerPersonaTypes: Record<PersonaType, number>;
  rating: {
    average: number;
    count: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
}