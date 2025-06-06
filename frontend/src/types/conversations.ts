export type ConversationStatus = 'active' | 'paused' | 'completed' | 'terminated';
export type ParticipantRole = 'initiator' | 'responder';
export type RevealTrigger = 'self' | 'system' | 'other_participant' | 'time_based' | 'message_count';
export type EndConditionType = 'max_messages' | 'max_duration' | 'mutual_agreement' | 'topic_exhaustion' | 'goal_achieved';

export interface PersonaInstance {
  personaId: string;
  role: ParticipantRole;
  isRevealed: boolean; // whether their true nature (human/AI) is revealed
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface EndCondition {
  type: EndConditionType;
  value: number | boolean;
  description: string;
}

export interface ConversationConstraints {
  maxMessages?: number;
  maxDuration?: number; // minutes
  maxCharacters?: number;
  minResponseTime?: number; // seconds
  maxResponseTime?: number; // seconds
  allowedTopics?: string[];
  forbiddenTopics?: string[];
  endConditions: EndCondition[];
  revealConditions?: RevealCondition[];
}

export interface RevealCondition {
  trigger: RevealTrigger;
  value?: number; // for time_based (minutes) or message_count
  description: string;
}

export interface ConversationGoal {
  description: string;
  successCriteria: string[];
  targetOutcome: string;
  evaluationMethod: 'participant_rating' | 'ai_analysis' | 'human_review';
}

export interface Conversation {
  id: string;
  title: string;
  topic: string;
  description?: string;
  
  // Participants (exactly 2 for now)
  participants: [PersonaInstance, PersonaInstance];
  
  // Conversation configuration
  constraints: ConversationConstraints;
  goal?: ConversationGoal;
  
  // State management
  status: ConversationStatus;
  currentTurn: number;
  messageCount: number;
  
  // Metadata
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  createdBy: string; // User ID who initiated
  
  // Analytics
  totalCharacters: number;
  averageResponseTime: number;
  topicTags: string[];
  qualityScore?: number;
}

export interface ConversationCreate {
  title: string;
  topic: string;
  description?: string;
  participantPersonaIds: [string, string];
  constraints: ConversationConstraints;
  goal?: ConversationGoal;
}

export interface ConversationUpdate {
  title?: string;
  topic?: string;
  description?: string;
  status?: ConversationStatus;
  constraints?: Partial<ConversationConstraints>;
  goal?: ConversationGoal;
}

export interface ConversationSummary {
  id: string;
  title: string;
  topic: string;
  status: ConversationStatus;
  participants: {
    personaId: string;
    personaName: string;
    personaType: string;
    isRevealed: boolean;
  }[];
  messageCount: number;
  duration: number; // minutes
  createdAt: Date;
  endedAt?: Date;
  qualityScore?: number;
}

export interface PersonaReveal {
  conversationId: string;
  personaId: string;
  revealedAt: Date;
  revealedBy: RevealTrigger;
  revealType: 'human' | 'ai_agent' | 'ai_ambiguous';
  revealContext?: string; // why the reveal happened
}

export interface ParticipantView {
  personaId: string;
  displayName: string;
  isIdentityRevealed: boolean;
  perceivedType?: 'human' | 'ai' | 'unknown';
  lastActiveAt: Date;
  isTyping: boolean;
}

export interface ConversationAnalytics {
  conversationId: string;
  totalMessages: number;
  totalCharacters: number;
  averageMessageLength: number;
  longestMessage: number;
  shortestMessage: number;
  responseTimeStats: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  participantStats: Record<string, {
    messageCount: number;
    characterCount: number;
    averageResponseTime: number;
    sentimentScore: number;
  }>;
  topicProgression: string[];
  sentimentOverTime: Array<{
    messageIndex: number;
    sentiment: number;
    timestamp: Date;
  }>;
  engagementScore: number;
  qualityScore: number;
  analyzedAt: Date;
}