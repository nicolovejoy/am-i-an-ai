// Main types export file - provides clean imports for all types

// Core entities
export * from './users';
export * from './personas';
export * from './conversations';
export * from './messages';

// Service interfaces
export * from './services';

// Database types
export * from './database';

// Re-export auth types (existing)
export * from './auth';
// Note: chat types will be integrated later

// Common utility types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  category?: string;
}

export interface SortOption {
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface FormFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// WebSocket event types for real-time features
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  id: string;
}

export interface ConversationEvent extends WebSocketEvent {
  conversationId: string;
  type: 'message' | 'typing' | 'participant_joined' | 'participant_left' | 'conversation_ended';
}

export interface MessageEvent extends ConversationEvent {
  type: 'message';
  payload: {
    message: any; // Will reference Message type from messages.ts
    authorPersona: {
      id: string;
      name: string;
      type: string;
    };
  };
}

export interface TypingEvent extends ConversationEvent {
  type: 'typing';
  payload: {
    personaId: string;
    personaName: string;
    isTyping: boolean;
  };
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: Date;
}

export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  fieldErrors: FormFieldError[];
}

export interface AuthError extends AppError {
  code: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN';
}

export interface NetworkError extends AppError {
  code: 'NETWORK_ERROR';
  status?: number;
  statusText?: string;
}

// Loading and async states
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  lastUpdated?: Date;
}

export interface LoadingStates {
  [key: string]: boolean;
}

export interface OptimisticUpdate<T> {
  id: string;
  data: T;
  action: 'create' | 'update' | 'delete';
  timestamp: Date;
  pending: boolean;
}

// Feature flags and configuration
export interface FeatureFlags {
  enableAIAgents: boolean;
  enableAmbiguousPersonas: boolean;
  enableConversationAnalytics: boolean;
  enableRealTimeTyping: boolean;
  enableMessageReactions: boolean;
  enableConversationThreads: boolean;
  maxConcurrentConversations: number;
  maxPersonasPerUser: number;
}

export interface AppConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  auth: {
    cognitoUserPoolId: string;
    cognitoClientId: string;
    region: string;
  };
  features: FeatureFlags;
  ui: {
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    enableAnimations: boolean;
  };
  performance: {
    enableQueryOptimization: boolean;
    enableCaching: boolean;
    cacheTimeout: number; // minutes
  };
}

// Component prop types for common patterns
export interface BaseComponentProps {
  className?: string;
  testId?: string;
  children?: React.ReactNode;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface FormComponentProps extends BaseComponentProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

// Route and navigation types
export interface AppRoute {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  roles?: string[]; // Will reference UserRole from users.ts
  title?: string;
  icon?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  children?: NavigationItem[];
  protected?: boolean;
  roles?: string[]; // Will reference UserRole from users.ts
}

// Analytics and tracking types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: Date;
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'form_submit' | 'page_view' | 'search' | 'share';
  element?: string;
  page: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Import the existing auth types to ensure compatibility
import type { SignInFormData, SignUpFormData } from './auth';

// Re-export for convenience
export type { SignInFormData, SignUpFormData };