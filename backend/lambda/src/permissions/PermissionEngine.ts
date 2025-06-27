import { User } from '../types/auth';
import { Conversation, Persona } from '../types/database';

export interface PermissionContext {
  user: User;
  action: string;
  resource: Conversation | Persona;
  resourceType: 'conversation' | 'persona';
  metadata?: Record<string, any>;
}

export interface PermissionSet {
  canView: boolean;
  canAddMessage: boolean;
  canJoin: boolean;
  canClose: boolean;
  canAddParticipant: boolean;
  canRemoveParticipant: boolean;
  canDelete: boolean;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  permissions: PermissionSet;
  constraints?: {
    maxMessageLength?: number;
    allowedPersonas?: string[];
  };
}

export interface PermissionRule {
  name: string;
  evaluate(context: PermissionContext): Promise<{
    permissions?: Partial<PermissionSet>;
    allowed?: boolean;
    reason?: string;
    constraints?: PermissionResult['constraints'];
  }>;
}

export class PermissionEngine {
  private rules: PermissionRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.addRule(new ConversationViewRule());
    this.addRule(new ConversationMessageRule());
    this.addRule(new ConversationManagementRule());
    this.addRule(new AdminOverrideRule());
  }

  addRule(rule: PermissionRule) {
    this.rules.push(rule);
  }

  async evaluatePermissions(context: PermissionContext): Promise<PermissionResult> {
    const result: PermissionResult = {
      allowed: false,
      permissions: {
        canView: false,
        canAddMessage: false,
        canJoin: false,
        canClose: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      },
    };

    for (const rule of this.rules) {
      const ruleResult = await rule.evaluate(context);
      
      // Merge permissions (OR logic - if any rule allows, it's allowed)
      if (ruleResult.permissions) {
        Object.keys(ruleResult.permissions).forEach((key) => {
          const permKey = key as keyof typeof result.permissions;
          if (ruleResult.permissions![permKey] === true) {
            result.permissions[permKey] = true;
          }
        });
      }

      if (ruleResult.allowed !== undefined) {
        result.allowed = result.allowed || ruleResult.allowed;
      }

      if (ruleResult.reason && !result.reason) {
        result.reason = ruleResult.reason;
      }

      if (ruleResult.constraints) {
        result.constraints = { ...result.constraints, ...ruleResult.constraints };
      }
    }

    return result;
  }

  async canUserViewConversation(user: User, conversation: Conversation, userPersonas: Persona[]): Promise<boolean> {
    const context: PermissionContext = {
      user,
      action: 'view',
      resource: conversation,
      resourceType: 'conversation',
      metadata: { userPersonas },
    };

    const result = await this.evaluatePermissions(context);
    return result.permissions.canView;
  }

  async canUserPostMessage(user: User, conversation: Conversation, personaId: string, userPersonas: Persona[]): Promise<boolean> {
    const context: PermissionContext = {
      user,
      action: 'addMessage',
      resource: conversation,
      resourceType: 'conversation',
      metadata: { userPersonas, personaId },
    };

    const result = await this.evaluatePermissions(context);
    return result.permissions.canAddMessage;
  }
}

class ConversationViewRule implements PermissionRule {
  name = 'ConversationViewRule';

  async evaluate(context: PermissionContext) {
    if (context.resourceType !== 'conversation') {
      return {};
    }

    const conversation = context.resource as Conversation;
    const userPersonas = context.metadata?.userPersonas || [];
    const visibility = conversation.metadata?.visibility || 'private';

    const permissions: Partial<PermissionSet> = {};

    // Public conversations can be viewed by anyone
    if (visibility === 'public') {
      permissions.canView = true;
      permissions.canJoin = true;
    }

    // Check if user owns a participating persona
    const userPersonaIds = userPersonas.map((p: Persona) => p.id);
    const isParticipant = conversation.participants.some(p => 
      userPersonaIds.includes(p.personaId)
    );

    if (isParticipant) {
      permissions.canView = true;
      // Don't set canAddMessage here - let ConversationMessageRule handle it
    }

    return { permissions };
  }
}

class ConversationMessageRule implements PermissionRule {
  name = 'ConversationMessageRule';

  async evaluate(context: PermissionContext) {
    if (context.resourceType !== 'conversation') {
      return {};
    }

    const conversation = context.resource as Conversation;
    const userPersonas = context.metadata?.userPersonas || [];
    const personaId = context.metadata?.personaId;

    const permissions: Partial<PermissionSet> = {};

    // Check if conversation allows messages
    if (!conversation.can_add_messages || conversation.status !== 'active') {
      permissions.canAddMessage = false;
      return { permissions, reason: 'Conversation is closed for new messages' };
    }

    // If no specific persona is provided, check if user can post as any of their personas
    if (!personaId) {
      const userPersonaIds = userPersonas.map((p: Persona) => p.id);
      const canPostAsAny = conversation.participants.some(p => 
        userPersonaIds.includes(p.personaId)
      );
      permissions.canAddMessage = canPostAsAny;
      return { permissions };
    }

    // Check if user owns the persona they're trying to post as
    const ownsPersona = userPersonas.some((p: Persona) => p.id === personaId);
    if (!ownsPersona) {
      permissions.canAddMessage = false;
      return { permissions, reason: 'User does not own this persona' };
    }

    // Check if persona is a participant
    const isParticipant = conversation.participants.some(p => p.personaId === personaId);
    if (!isParticipant) {
      permissions.canAddMessage = false;
      return { permissions, reason: 'Persona is not a participant in this conversation' };
    }

    permissions.canAddMessage = true;
    return { permissions };
  }
}

class ConversationManagementRule implements PermissionRule {
  name = 'ConversationManagementRule';

  async evaluate(context: PermissionContext) {
    if (context.resourceType !== 'conversation') {
      return {};
    }

    const conversation = context.resource as Conversation;
    const userPersonas = context.metadata?.userPersonas || [];
    const userPersonaIds = userPersonas.map((p: Persona) => p.id);

    const permissions: Partial<PermissionSet> = {};

    // Check if user owns the initiator persona
    const isInitiator = conversation.initiator_persona_id && 
      userPersonaIds.includes(conversation.initiator_persona_id);

    if (isInitiator) {
      permissions.canClose = true;
      permissions.canAddParticipant = true;
      permissions.canRemoveParticipant = true;
    }

    return { permissions };
  }
}

class AdminOverrideRule implements PermissionRule {
  name = 'AdminOverrideRule';

  async evaluate(context: PermissionContext) {
    if (context.user.role !== 'admin') {
      return {};
    }

    // Admins can view and manage all conversations
    const permissions: Partial<PermissionResult['permissions']> = {
      canView: true,
      canClose: true,
      canAddParticipant: true,
      canRemoveParticipant: true,
      canDelete: true,
    };

    // Admins still can't post as personas they don't own
    // This maintains identity integrity
    
    return { permissions };
  }
}