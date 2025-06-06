export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type UserRole = 'user' | 'moderator' | 'admin';
export type NotificationPreference = 'all' | 'important' | 'none';
export type ThemePreference = 'light' | 'dark' | 'system';

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
  avatar?: string;
  
  // Account details
  role: UserRole;
  subscription: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  
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
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  publicPersonas: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    conversationCount: number;
    rating: number;
  }>;
  stats: UserStats;
  achievements: UserAchievement[];
  joinedAt: Date;
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
  details: Record<string, any>;
  timestamp: Date;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'conversation_invite' | 'conversation_ended' | 'rating_received' | 'achievement_unlocked' | 'system_announcement';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
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