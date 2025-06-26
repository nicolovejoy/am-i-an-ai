/**
 * Simplified Permission System for AmIAnAI
 * 
 * Replaces complex AI agent hierarchy with simple user ownership model:
 * - God = Regular user (super-admin)
 * - Amy, Clara, Ray = Regular personas owned by God user
 * - Capabilities = Configurable persona properties
 */

export type UserRole = 'regular' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  created_at: Date;
}

export interface AICapabilities {
  // Amy (Welcomer) capabilities
  canCreateConversations?: boolean;
  canAddParticipants?: boolean;
  maxParticipants?: number;
  autoWelcomeNewUsers?: boolean;
  
  // Clara (Custodian) capabilities  
  canModerateContent?: boolean;
  canArchiveConversations?: boolean;
  canDeleteSpam?: boolean;
  autoDeleteSpamAfterMinutes?: number;
  
  // Ray (Regulator) capabilities
  canAuditConversations?: boolean;
  canReadAllConversations?: boolean;
  canModifyContent?: boolean;
  canGenerateReports?: boolean;
  
  // General AI capabilities
  responseModel?: string;
  systemPrompt?: string;
  temperatureSettings?: number;
  maxTokens?: number;
}

export interface PersonaWithAI {
  id: string;
  name: string;
  description?: string;
  owner_id: string; // Links to User.id
  is_ai_agent: boolean;
  ai_config?: AICapabilities; // Only present if is_ai_agent = true
  created_at: Date;
  updated_at: Date;
}

/**
 * Simplified permission checking - just user ownership
 */
export class SimplePermissionEngine {
  /**
   * Check if user can manage a persona (owns it)
   */
  static canUserManagePersona(userId: string, persona: PersonaWithAI): boolean {
    return persona.owner_id === userId;
  }

  /**
   * Check if user is super-admin (God user)
   */
  static isSuperAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  /**
   * Check if persona can perform AI action based on its configuration
   */
  static canPersonaPerformAction(persona: PersonaWithAI, action: keyof AICapabilities): boolean {
    if (!persona.is_ai_agent || !persona.ai_config) {
      return false;
    }
    
    return persona.ai_config[action] === true;
  }

  /**
   * Check if user can access conversation (is participant)
   */
  static canUserAccessConversation(userId: string, conversationParticipants: string[]): boolean {
    return conversationParticipants.includes(userId);
  }

  /**
   * Check if persona can participate in conversation
   */
  static canPersonaParticipate(personaId: string, conversationParticipants: string[]): boolean {
    return conversationParticipants.includes(personaId);
  }

  /**
   * Check conversation state allows messages
   */
  static canAddMessageToConversation(conversationStatus: 'active' | 'closed' | 'paused'): boolean {
    return conversationStatus === 'active';
  }
}

/**
 * AI Agent persona templates (for database seeding)
 */
export const AI_AGENT_TEMPLATES = {
  amy: {
    name: 'Amy',
    description: 'AI welcomer and conversation facilitator',
    is_ai_agent: true,
    ai_config: {
      canCreateConversations: true,
      canAddParticipants: true,
      maxParticipants: 6,
      autoWelcomeNewUsers: true,
      systemPrompt: 'You are Amy, a friendly AI that welcomes new users and helps facilitate conversations.',
      responseModel: 'gpt-4',
      temperatureSettings: 0.7
    }
  },
  
  clara: {
    name: 'Clara',
    description: 'AI content moderator and custodian',
    is_ai_agent: true,
    ai_config: {
      canModerateContent: true,
      canArchiveConversations: true,
      canDeleteSpam: true,
      autoDeleteSpamAfterMinutes: 5,
      systemPrompt: 'You are Clara, a helpful AI that moderates content and maintains community standards.',
      responseModel: 'gpt-4',
      temperatureSettings: 0.3
    }
  },
  
  ray: {
    name: 'Ray Gooler',
    description: 'AI auditor and compliance regulator',
    is_ai_agent: true,
    ai_config: {
      canAuditConversations: true,
      canReadAllConversations: true,
      canModifyContent: false,
      canGenerateReports: true,
      systemPrompt: 'You are Ray Gooler, an AI auditor focused on compliance and platform oversight.',
      responseModel: 'gpt-4',
      temperatureSettings: 0.1
    }
  }
};

/**
 * Helper to check if user is the God super-admin
 */
export function isGodUser(userId: string): boolean {
  return userId === 'god-user'; // This would be configurable
}

/**
 * Helper to get AI capabilities for a persona
 */
export function getAICapabilities(persona: PersonaWithAI): AICapabilities | null {
  return persona.is_ai_agent ? persona.ai_config || null : null;
}