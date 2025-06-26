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

// ===== NEW JSONB-BASED TYPES =====

export interface ConversationState {
  status: 'active' | 'paused' | 'closed' | 'archived';
  can_add_messages: boolean;
  closed_by: string | null;
  closed_at: Date | null;
  close_reason: string | null;
  paused_at: Date | null;
  resumed_at: Date | null;
  restrictions: string[];
}

export interface ConversationParticipant {
  persona_id: string;
  role: 'host' | 'guest' | 'moderator';
  joined_at: Date;
  is_revealed: boolean;
  left_at: Date | null;
  permissions: ('read' | 'write' | 'moderate' | 'close')[];
  metadata: Record<string, any>;
}

export interface ConversationMetadata {
  [key: string]: any;
  tags?: string[];
  visibility?: 'public' | 'private' | 'unlisted';
  featured?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface ConversationSettings {
  max_participants?: number;
  allow_late_joining?: boolean;
  auto_close_after_hours?: number;
  require_moderation?: boolean;
  allow_anonymous?: boolean;
  [key: string]: any;
}

export interface ConversationHistoryEntry {
  timestamp: Date;
  action: 'conversation_created' | 'state_change' | 'participant_added' | 'participant_removed' | 'settings_updated' | 'conversation_closed';
  actor: {
    id: string;
    type: 'user' | 'persona' | 'agent' | 'system';
    name: string;
    role?: 'amy' | 'clara' | 'ray_gooler' | 'god';
  };
  target?: string; // What/who was acted upon
  details: Record<string, any>;
}

// Combined interface using JSONB fields
export interface ConversationWithJSONB {
  // Traditional columns
  id: string;
  title: string;
  topic: string;
  description?: string;
  created_by: string;
  created_at: Date;
  
  // JSONB columns
  participants: ConversationParticipant[];
  state: ConversationState;
  metadata: ConversationMetadata;
  settings: ConversationSettings;
  history: ConversationHistoryEntry[];
  schema_version: number;
  
  // Soft delete
  deleted_at: Date | null;
}

// Utility functions for working with JSONB conversations
export function isConversationOpen(conversation: ConversationWithJSONB): boolean {
  return conversation.state.status === 'active' && conversation.state.can_add_messages;
}

export function canUserAddMessage(conversation: ConversationWithJSONB, personaId: string): boolean {
  if (!conversation.state.can_add_messages) return false;
  
  const participant = conversation.participants.find(p => p.persona_id === personaId);
  if (!participant || participant.left_at) return false;
  
  return participant.permissions.includes('write');
}

export function getParticipantRole(conversation: ConversationWithJSONB, personaId: string): string | null {
  const participant = conversation.participants.find(p => p.persona_id === personaId);
  return participant ? participant.role : null;
}

export function addParticipantToConversation(
  conversation: ConversationWithJSONB,
  personaId: string,
  role: 'guest' | 'moderator' = 'guest'
): ConversationWithJSONB {
  // Check if already a participant
  if (conversation.participants.some(p => p.persona_id === personaId)) {
    return conversation;
  }
  
  const newParticipant: ConversationParticipant = {
    persona_id: personaId,
    role,
    joined_at: new Date(),
    is_revealed: false,
    left_at: null,
    permissions: role === 'moderator' ? ['read', 'write', 'moderate'] : ['read', 'write'],
    metadata: {}
  };
  
  const historyEntry: ConversationHistoryEntry = {
    timestamp: new Date(),
    action: 'participant_added',
    actor: {
      id: 'system',
      type: 'system',
      name: 'System'
    },
    details: { persona_id: personaId, role }
  };
  
  return {
    ...conversation,
    participants: [...conversation.participants, newParticipant],
    history: [...conversation.history, historyEntry]
  };
}

export function closeConversation(
  conversation: ConversationWithJSONB,
  closedBy: string,
  reason?: string
): ConversationWithJSONB {
  const now = new Date();
  
  const historyEntry: ConversationHistoryEntry = {
    timestamp: now,
    action: 'conversation_closed',
    actor: {
      id: closedBy,
      type: 'user',
      name: 'User'
    },
    details: { reason }
  };
  
  return {
    ...conversation,
    state: {
      ...conversation.state,
      status: 'closed',
      can_add_messages: false,
      closed_by: closedBy,
      closed_at: now,
      close_reason: reason || null
    },
    history: [...conversation.history, historyEntry]
  };
}

export function updateConversationState(
  conversation: ConversationWithJSONB,
  updates: Partial<ConversationState>,
  actorId: string
): ConversationWithJSONB {
  const oldState = conversation.state;
  const newState = { ...oldState, ...updates };
  
  const historyEntry: ConversationHistoryEntry = {
    timestamp: new Date(),
    action: 'state_change',
    actor: {
      id: actorId,
      type: 'user',
      name: 'User'
    },
    details: {
      changes: Object.keys(updates).map(key => ({
        field: key,
        old_value: oldState[key as keyof ConversationState],
        new_value: updates[key as keyof ConversationState]
      }))
    }
  };
  
  return {
    ...conversation,
    state: newState,
    history: [...conversation.history, historyEntry]
  };
}