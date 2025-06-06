import { User, UserUpdate, UserProfile, UserNotification } from './users';
import { Persona, PersonaCreate, PersonaUpdate, PersonaStats, PersonalityTraits } from './personas';
import { Conversation, ConversationCreate, ConversationUpdate, ConversationSummary, ConversationAnalytics } from './conversations';
import { Message, MessageCreate, MessageUpdate, ConversationHistory, MessageSearch, MessageSearchResult } from './messages';

// Common types for all services
export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// User Management Service
export interface UserService {
  // User CRUD
  getUser(id: string): Promise<ServiceResponse<User>>;
  updateUser(id: string, updates: UserUpdate): Promise<ServiceResponse<User>>;
  deleteUser(id: string): Promise<ServiceResponse<boolean>>;
  
  // User profile
  getUserProfile(id: string): Promise<ServiceResponse<UserProfile>>;
  searchUsers(query: string, limit?: number): Promise<ServiceResponse<UserProfile[]>>;
  
  // Notifications
  getUserNotifications(userId: string, limit?: number): Promise<ServiceResponse<PaginatedResponse<UserNotification>>>;
  markNotificationRead(notificationId: string): Promise<ServiceResponse<boolean>>;
  
  // Usage tracking
  incrementUsage(userId: string, type: 'messages' | 'conversations' | 'personas'): Promise<ServiceResponse<boolean>>;
  checkLimits(userId: string): Promise<ServiceResponse<boolean>>;
}

// Persona Management Service
export interface PersonaService {
  // Persona CRUD
  createPersona(userId: string, persona: PersonaCreate): Promise<ServiceResponse<Persona>>;
  getPersona(id: string): Promise<ServiceResponse<Persona>>;
  updatePersona(id: string, updates: PersonaUpdate): Promise<ServiceResponse<Persona>>;
  deletePersona(id: string): Promise<ServiceResponse<boolean>>;
  
  // Persona discovery
  getUserPersonas(userId: string): Promise<ServiceResponse<Persona[]>>;
  getPublicPersonas(limit?: number, offset?: number): Promise<ServiceResponse<PaginatedResponse<Persona>>>;
  searchPersonas(query: string, filters?: PersonaSearchFilters): Promise<ServiceResponse<PaginatedResponse<Persona>>>;
  
  // Persona matching
  findCompatiblePersonas(personaId: string, criteria: MatchCriteria): Promise<ServiceResponse<Persona[]>>;
  
  // Persona analytics
  getPersonaStats(personaId: string): Promise<ServiceResponse<PersonaStats>>;
  
  // AI agent management
  deployAIAgent(config: AIAgentConfig): Promise<ServiceResponse<Persona>>;
  updateAIBehavior(personaId: string, updates: BehaviorUpdate): Promise<ServiceResponse<Persona>>;
}

// Conversation Management Service
export interface ConversationService {
  // Conversation lifecycle
  createConversation(config: ConversationCreate): Promise<ServiceResponse<Conversation>>;
  getConversation(id: string): Promise<ServiceResponse<Conversation>>;
  updateConversation(id: string, updates: ConversationUpdate): Promise<ServiceResponse<Conversation>>;
  deleteConversation(id: string): Promise<ServiceResponse<boolean>>;
  
  // Conversation state management
  startConversation(id: string): Promise<ServiceResponse<Conversation>>;
  pauseConversation(id: string): Promise<ServiceResponse<Conversation>>;
  resumeConversation(id: string): Promise<ServiceResponse<Conversation>>;
  endConversation(id: string, reason?: string): Promise<ServiceResponse<Conversation>>;
  
  // Conversation discovery
  getUserConversations(userId: string, status?: string): Promise<ServiceResponse<ConversationSummary[]>>;
  getPersonaConversations(personaId: string): Promise<ServiceResponse<ConversationSummary[]>>;
  
  // Conversation analytics
  getConversationAnalytics(id: string): Promise<ServiceResponse<ConversationAnalytics>>;
  
  // Matchmaking
  findConversationOpportunities(personaId: string): Promise<ServiceResponse<ConversationOpportunity[]>>;
}

// Message Management Service
export interface MessageService {
  // Message CRUD
  sendMessage(message: MessageCreate): Promise<ServiceResponse<Message>>;
  getMessage(id: string): Promise<ServiceResponse<Message>>;
  updateMessage(id: string, updates: MessageUpdate): Promise<ServiceResponse<Message>>;
  deleteMessage(id: string): Promise<ServiceResponse<boolean>>;
  
  // Message retrieval
  getConversationHistory(conversationId: string, limit?: number, cursor?: string): Promise<ServiceResponse<ConversationHistory>>;
  searchMessages(criteria: MessageSearch): Promise<ServiceResponse<PaginatedResponse<MessageSearchResult>>>;
  
  // Real-time features
  subscribeToConversation(conversationId: string, callback: (message: Message) => void): () => void;
  setTypingIndicator(conversationId: string, personaId: string, isTyping: boolean): Promise<ServiceResponse<boolean>>;
  
  // Message moderation
  flagMessage(messageId: string, reason: string): Promise<ServiceResponse<boolean>>;
  moderateMessage(messageId: string, action: string): Promise<ServiceResponse<Message>>;
}

// AI Agent Service
export interface AIAgentService {
  // AI response generation
  generateResponse(conversationId: string, personaId: string, context: ConversationContext): Promise<ServiceResponse<string>>;
  
  // Behavior simulation
  simulateTyping(personaId: string, messageLength: number): Promise<ServiceResponse<number>>; // returns typing duration
  calculateResponseDelay(personaId: string, context: ConversationContext): Promise<ServiceResponse<number>>;
  
  // Persona behavior
  updatePersonaBehavior(personaId: string, interactions: InteractionHistory): Promise<ServiceResponse<boolean>>;
  
  // AI agent coordination
  scheduleResponse(conversationId: string, personaId: string, delay: number): Promise<ServiceResponse<string>>; // returns job ID
  cancelScheduledResponse(jobId: string): Promise<ServiceResponse<boolean>>;
}

// Analytics Service
export interface AnalyticsService {
  // Conversation analytics
  analyzeConversation(conversationId: string): Promise<ServiceResponse<ConversationAnalytics>>;
  getConversationMetrics(timeRange: TimeRange): Promise<ServiceResponse<ConversationMetrics>>;
  
  // Persona analytics
  analyzePersonaPerformance(personaId: string): Promise<ServiceResponse<PersonaAnalytics>>;
  getPersonaEngagementMetrics(personaId: string, timeRange: TimeRange): Promise<ServiceResponse<EngagementMetrics>>;
  
  // System analytics
  getSystemMetrics(): Promise<ServiceResponse<SystemMetrics>>;
  getUserBehaviorInsights(userId: string): Promise<ServiceResponse<BehaviorInsights>>;
}

// Supporting types for service interfaces
export interface PersonaSearchFilters {
  type?: string[];
  knowledge?: string[];
  communicationStyle?: string[];
  interactionTypes?: string[];
  rating?: [number, number];
  isPublic?: boolean;
}

export interface MatchCriteria {
  compatibility: number; // 0-1
  sharedInterests: string[];
  oppositeTraits?: boolean;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  conversationGoal?: string;
}

export interface AIAgentConfig {
  personaConfig: PersonaCreate;
  deploymentSettings: {
    autoStart: boolean;
    maxConcurrentConversations: number;
    operatingHours?: { start: string; end: string };
    targetTopics?: string[];
  };
}

export interface BehaviorUpdate {
  personality?: Partial<PersonalityTraits>;
  communicationStyle?: string;
  responsePatterns?: unknown[]; // Will be defined later
  learningEnabled?: boolean;
}

export interface ConversationContext {
  conversationId: string;
  messageHistory: Message[];
  participants: Persona[];
  currentTopic: string;
  conversationGoal?: string;
  timeElapsed: number;
}

export interface InteractionHistory {
  totalInteractions: number;
  successfulInteractions: number;
  averageRating: number;
  commonTopics: string[];
  preferredPartnerTypes: string[];
}

export interface ConversationOpportunity {
  personaId: string;
  personaName: string;
  topic: string;
  estimatedMatch: number; // 0-1
  suggestedDuration: number; // minutes
  interactionType: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ConversationMetrics {
  totalConversations: number;
  averageDuration: number;
  completionRate: number;
  averageRating: number;
  topTopics: string[];
  participantBreakdown: Record<string, number>;
}

export interface PersonaAnalytics {
  conversationCount: number;
  averageRating: number;
  responseTime: number;
  engagementScore: number;
  topicExpertise: Record<string, number>;
  improvementAreas: string[];
}

export interface EngagementMetrics {
  messageCount: number;
  averageMessageLength: number;
  responseRate: number;
  initiationRate: number;
  retentionRate: number;
}

export interface SystemMetrics {
  activeUsers: number;
  activeConversations: number;
  messagesPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  aiAgentPerformance: Record<string, number>;
}

export interface BehaviorInsights {
  preferredInteractionTypes: string[];
  optimalConversationLength: number;
  peakActivityTimes: string[];
  socialPatterns: string[];
  improvementSuggestions: string[];
}