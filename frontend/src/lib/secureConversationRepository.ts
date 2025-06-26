import {
  ConversationRepositoryImpl,
  ConversationJSONBRepository,
  ConversationQuery,
  ConversationCreate,
  ConversationUpdate
} from './conversationRepository';
import {
  ConversationWithJSONB,
  ConversationParticipant
} from '../types/conversations';
import { SimplePermissionEngine, User, PersonaWithAI } from '../types/permissions';

/**
 * Simplified Secure Conversation Repository
 * 
 * Uses the new simplified permission model where:
 * - God is a regular user who owns AI agent personas
 * - All permissions flow through standard user → persona ownership
 * - No special agent permission hierarchies
 */

export interface SimpleSecurityContext {
  user: User;
  personaId?: string;
}

export class SimpleSecureConversationRepository implements ConversationJSONBRepository {
  constructor(
    private baseRepository: ConversationRepositoryImpl,
    private context: SimpleSecurityContext,
    private getPersona: (id: string) => Promise<PersonaWithAI | null>
  ) {}

  async create(data: ConversationCreate): Promise<ConversationWithJSONB> {
    // Validate user owns the creating persona (if specified)
    if (data.created_by) {
      const creatingPersona = await this.getPersona(data.created_by);
      if (!creatingPersona || !SimplePermissionEngine.canUserManagePersona(this.context.user.id, creatingPersona)) {
        throw new Error('Unauthorized: Cannot create conversation with persona you do not own');
      }
    }

    // Validate all participants personas are owned by user (or public)
    for (const participant of data.participants) {
      const persona = await this.getPersona(participant.persona_id!);
      if (!persona) {
        throw new Error(`Persona ${participant.persona_id} not found`);
      }
      
      // User must own the persona to add it to conversation
      if (!SimplePermissionEngine.canUserManagePersona(this.context.user.id, persona)) {
        throw new Error(`Unauthorized: Cannot add persona ${participant.persona_id} to conversation`);
      }
    }

    return this.baseRepository.create(data);
  }

  async findById(id: string): Promise<ConversationWithJSONB | null> {
    const conversation = await this.baseRepository.findById(id);
    if (!conversation) {
      return null;
    }

    // Check if user can access this conversation (is a participant)
    const userPersonaIds = await this.getUserPersonaIds();
    const participantPersonaIds = conversation.participants.map(p => p.persona_id);
    
    const hasAccess = userPersonaIds.some(personaId => 
      SimplePermissionEngine.canPersonaParticipate(personaId, participantPersonaIds)
    );

    // Super-admin can access any conversation
    if (!hasAccess && !SimplePermissionEngine.isSuperAdmin(this.context.user)) {
      return null;
    }

    return conversation;
  }

  async findByQuery(query: ConversationQuery): Promise<ConversationWithJSONB[]> {
    const conversations = await this.baseRepository.findByQuery(query);
    
    // Filter to only conversations user can access
    const userPersonaIds = await this.getUserPersonaIds();
    
    return conversations.filter(conversation => {
      const participantPersonaIds = conversation.participants.map(p => p.persona_id);
      
      const hasAccess = userPersonaIds.some(personaId => 
        SimplePermissionEngine.canPersonaParticipate(personaId, participantPersonaIds)
      );

      // Super-admin can access any conversation
      return hasAccess || SimplePermissionEngine.isSuperAdmin(this.context.user);
    });
  }

  async update(id: string, data: ConversationUpdate): Promise<ConversationWithJSONB> {
    const conversation = await this.findById(id);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Only conversation owner or super-admin can update
    const isOwner = conversation.created_by === this.context.user.id;
    const isSuperAdmin = SimplePermissionEngine.isSuperAdmin(this.context.user);
    
    if (!isOwner && !isSuperAdmin) {
      throw new Error('Unauthorized: Cannot modify this conversation');
    }

    return this.baseRepository.update(id, data);
  }

  async softDelete(id: string): Promise<boolean> {
    const conversation = await this.findById(id);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Only conversation owner or super-admin can delete
    const isOwner = conversation.created_by === this.context.user.id;
    const isSuperAdmin = SimplePermissionEngine.isSuperAdmin(this.context.user);
    
    if (!isOwner && !isSuperAdmin) {
      throw new Error('Unauthorized: Cannot delete this conversation');
    }

    return this.baseRepository.softDelete(id);
  }

  async addParticipant(conversationId: string, participant: ConversationParticipant): Promise<ConversationWithJSONB> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Check if user can add participants (owns the persona being added)
    const persona = await this.getPersona(participant.persona_id);
    if (!persona || !SimplePermissionEngine.canUserManagePersona(this.context.user.id, persona)) {
      throw new Error('Unauthorized: Cannot add persona you do not own');
    }

    // Check AI agent specific limits (if adding via AI agent)
    if (this.context.personaId) {
      const actingPersona = await this.getPersona(this.context.personaId);
      if (actingPersona?.is_ai_agent && actingPersona.ai_config) {
        const maxParticipants = actingPersona.ai_config.maxParticipants;
        if (maxParticipants && conversation.participants.length >= maxParticipants) {
          throw new Error(`Cannot add participant: Maximum ${maxParticipants} participants allowed`);
        }
      }
    }

    return this.baseRepository.addParticipant(conversationId, participant);
  }

  async removeParticipant(conversationId: string, personaId: string): Promise<ConversationWithJSONB> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Check if user can remove participants (owns the persona being removed or is conversation owner)
    const persona = await this.getPersona(personaId);
    const canManagePersona = persona && SimplePermissionEngine.canUserManagePersona(this.context.user.id, persona);
    const isConversationOwner = conversation.created_by === this.context.user.id;
    const isSuperAdmin = SimplePermissionEngine.isSuperAdmin(this.context.user);
    
    if (!canManagePersona && !isConversationOwner && !isSuperAdmin) {
      throw new Error('Unauthorized: Cannot remove this participant');
    }

    return this.baseRepository.removeParticipant(conversationId, personaId);
  }

  async closeConversation(conversationId: string, closedBy: string, reason: string): Promise<ConversationWithJSONB> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Check if user can close conversations
    const isConversationOwner = conversation.created_by === this.context.user.id;
    const isSuperAdmin = SimplePermissionEngine.isSuperAdmin(this.context.user);
    
    // Check if acting as AI agent with moderation capabilities
    let canAIModerate = false;
    if (this.context.personaId) {
      const actingPersona = await this.getPersona(this.context.personaId);
      canAIModerate = !!(actingPersona?.is_ai_agent && 
                     SimplePermissionEngine.canPersonaPerformAction(actingPersona, 'canModerateContent'));
    }
    
    if (!isConversationOwner && !isSuperAdmin && !canAIModerate) {
      throw new Error('Unauthorized: Cannot close this conversation');
    }

    return this.baseRepository.closeConversation(conversationId, closedBy, reason);
  }

  async canUserAddMessage(conversationId: string, personaId: string): Promise<boolean> {
    const conversation = await this.baseRepository.findById(conversationId);
    if (!conversation) {
      return false;
    }

    // Check if conversation allows messages
    const status = conversation.state.status as 'active' | 'closed' | 'paused';
    if (!SimplePermissionEngine.canAddMessageToConversation(status)) {
      return false;
    }

    // Check if persona is a participant
    const participantPersonaIds = conversation.participants.map(p => p.persona_id);
    if (!SimplePermissionEngine.canPersonaParticipate(personaId, participantPersonaIds)) {
      return false;
    }

    // Check if user owns the persona
    const persona = await this.getPersona(personaId);
    if (!persona || !SimplePermissionEngine.canUserManagePersona(this.context.user.id, persona)) {
      return false;
    }

    return true;
  }

  /**
   * Helper: Get all persona IDs owned by the current user
   */
  private async getUserPersonaIds(): Promise<string[]> {
    // This would typically query the persona repository
    // For now, return the current persona if provided
    return this.context.personaId ? [this.context.personaId] : [];
  }
}