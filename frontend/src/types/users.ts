export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type UserRole = 'user' | 'moderator' | 'admin';
export type NotificationPreference = 'all' | 'important' | 'none';
export type ThemePreference = 'light' | 'dark' | 'system';
export type PrivacyLevel = 'connections' | 'network' | 'public';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface SubscriptionLimits {
  maxPersonas: number;
  maxActiveConversations: number;
  maxMonthlyMessages: number;
  maxAIAgents: number;
  canCreateAmbiguousPersonas: boolean;
  canAccessAnalytics: boolean;
  prioritySupport: boolean;
}

export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  timezone: string;
  notifications: {
    email: NotificationPreference;
    push: NotificationPreference;
    inApp: NotificationPreference;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowPublicPersonas: boolean;
    allowConversationInvites: boolean;
    dataRetentionDays: number;
  };
  conversation: {
    defaultPersonaId?: string;
    autoRevealAfterMessages?: number;
    autoRevealAfterMinutes?: number;
    preferredConversationLength: 'short' | 'medium' | 'long';
    defaultInteractionTypes: string[];
  };
}

export interface UserStats {
  totalPersonas: number;
  totalConversations: number;
  totalMessages: number;
  averageConversationRating: number;
  timeSpentInConversations: number; // minutes
  favoriteTopics: string[];
  preferredPersonaTypes: Record<string, number>;
  conversationCompletionRate: number;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  
  // Account details
  role: UserRole;
  subscription: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  
  // Privacy and trust
  privacyLevel: PrivacyLevel;
  trustScore: number;
  connectionCount: number;
  
  // Preferences and settings
  preferences: UserPreferences;
  
  // Usage and limits
  currentUsage: {
    personaCount: number;
    activeConversationCount: number;
    monthlyMessageCount: number;
    aiAgentCount: number;
  };
  limits: SubscriptionLimits;
  
  // Account state
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreate {
  email: string;
  displayName?: string;
  subscription?: SubscriptionTier;
  preferences?: Partial<UserPreferences>;
}

export interface UserUpdate {
  displayName?: string;
  bio?: string;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  bio?: string;
  trustScore: number;
  connectionCount: number;
  joinedAt: Date;
  lastSeen?: Date; // Only visible to connections
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'conversations' | 'personas' | 'engagement' | 'quality' | 'community';
  requirement: string;
  unlockedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'conversation_started' | 'conversation_completed' | 'persona_created' | 'achievement_unlocked' | 'rating_given';
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'conversation_invite' | 'conversation_ended' | 'rating_received' | 'achievement_unlocked' | 'system_announcement';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface UserConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  trustScore: number;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  activePersonaId?: string;
  activeConversationId?: string;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}