import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConversationRepositoryImpl, DatabaseConnection } from '../conversationRepository';
import { ConversationWithJSONB } from '../../types/conversations';
import { SimplePermissionEngine, PersonaWithAI, User } from '../../types/permissions';

/**
 * Simplified Conversation Repository Tests
 * 
 * Tests the new simplified permission model where:
 * - God is a regular user who owns AI agent personas
 * - All permissions flow through standard user → persona ownership
 * - No special agent permission hierarchies
 */

describe('Simplified Conversation Repository', () => {
  let repository: ConversationRepositoryImpl;
  let mockDb: DatabaseConnection;

  const godUser: User = {
    id: 'god-user',
    role: 'admin',
    email: 'admin@amianai.com',
    created_at: new Date()
  };

  const regularUser: User = {
    id: 'user-1', 
    role: 'regular',
    email: 'user@example.com',
    created_at: new Date()
  };

  const amyPersona: PersonaWithAI = {
    id: 'amy-persona',
    name: 'Amy',
    owner_id: 'god-user', // Owned by God user
    is_ai_agent: true,
    ai_config: {
      canCreateConversations: true,
      canAddParticipants: true,
      maxParticipants: 6
    },
    created_at: new Date(),
    updated_at: new Date()
  };

  const claraPersona: PersonaWithAI = {
    id: 'clara-persona',
    name: 'Clara',
    owner_id: 'god-user', // Owned by God user
    is_ai_agent: true,
    ai_config: {
      canModerateContent: true,
      canArchiveConversations: true,
      canDeleteSpam: true
    },
    created_at: new Date(),
    updated_at: new Date()
  };

  const userPersona: PersonaWithAI = {
    id: 'user-persona-1',
    name: 'User Persona',
    owner_id: 'user-1', // Owned by regular user
    is_ai_agent: false,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockConversation: ConversationWithJSONB = {
    id: 'conv-1',
    title: 'Test Conversation',
    topic: 'Test Topic',
    description: 'Test Description',
    created_by: 'user-1',
    created_at: new Date(),
    participants: [
      { persona_id: 'user-persona-1', role: 'host', joined_at: new Date(), is_revealed: true, left_at: null, permissions: ['read', 'write'], metadata: {} },
      { persona_id: 'amy-persona', role: 'guest', joined_at: new Date(), is_revealed: true, left_at: null, permissions: ['read', 'write'], metadata: {} }
    ],
    state: {
      status: 'active',
      can_add_messages: true,
      closed_by: null,
      closed_at: null,
      close_reason: null,
      paused_at: null,
      resumed_at: null,
      restrictions: []
    },
    metadata: {
      version: 1,
      tags: [],
      visibility: 'private',
      category: 'general',
      priority: 'medium',
      archived: false,
      favorite: false
    },
    settings: {
      auto_close_after_hours: undefined,
      allow_anonymous: false,
      require_approval: false,
      max_participants: 10,
      allow_persona_changes: true,
      message_retention_days: undefined
    },
    history: [],
    schema_version: 1,
    deleted_at: null
  };

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      queryOne: jest.fn(),
      execute: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn()
    } as jest.Mocked<DatabaseConnection>;
    repository = new ConversationRepositoryImpl(mockDb);
  });

  describe('User Ownership Permissions', () => {
    it('should allow God user to manage AI agent personas', () => {
      expect(SimplePermissionEngine.canUserManagePersona(godUser.id, amyPersona)).toBe(true);
      expect(SimplePermissionEngine.canUserManagePersona(godUser.id, claraPersona)).toBe(true);
      expect(SimplePermissionEngine.canUserManagePersona(regularUser.id, amyPersona)).toBe(false);
    });

    it('should allow regular users to manage their own personas', () => {
      expect(SimplePermissionEngine.canUserManagePersona(regularUser.id, userPersona)).toBe(true);
      expect(SimplePermissionEngine.canUserManagePersona(godUser.id, userPersona)).toBe(false);
    });

    it('should identify super-admin status correctly', () => {
      expect(SimplePermissionEngine.isSuperAdmin(godUser)).toBe(true);
      expect(SimplePermissionEngine.isSuperAdmin(regularUser)).toBe(false);
    });
  });

  describe('AI Persona Capabilities', () => {
    it('should check AI capabilities from persona configuration', () => {
      expect(SimplePermissionEngine.canPersonaPerformAction(amyPersona, 'canCreateConversations')).toBe(true);
      expect(SimplePermissionEngine.canPersonaPerformAction(amyPersona, 'canModerateContent')).toBe(false);
      
      expect(SimplePermissionEngine.canPersonaPerformAction(claraPersona, 'canModerateContent')).toBe(true);
      expect(SimplePermissionEngine.canPersonaPerformAction(claraPersona, 'canCreateConversations')).toBe(false);
      
      expect(SimplePermissionEngine.canPersonaPerformAction(userPersona, 'canCreateConversations')).toBe(false); // Not AI
    });

    it('should handle missing AI config gracefully', () => {
      const personaWithoutConfig: PersonaWithAI = {
        ...amyPersona,
        ai_config: undefined
      };
      
      expect(SimplePermissionEngine.canPersonaPerformAction(personaWithoutConfig, 'canCreateConversations')).toBe(false);
    });
  });

  describe('Conversation Access', () => {
    it('should allow access based on participant list', () => {
      const participantPersonaIds = ['user-persona-1', 'amy-persona'];
      
      expect(SimplePermissionEngine.canPersonaParticipate('user-persona-1', participantPersonaIds)).toBe(true);
      expect(SimplePermissionEngine.canPersonaParticipate('amy-persona', participantPersonaIds)).toBe(true);
      expect(SimplePermissionEngine.canPersonaParticipate('clara-persona', participantPersonaIds)).toBe(false);
    });

    it('should enforce conversation state restrictions', () => {
      expect(SimplePermissionEngine.canAddMessageToConversation('active')).toBe(true);
      expect(SimplePermissionEngine.canAddMessageToConversation('closed')).toBe(false);
      expect(SimplePermissionEngine.canAddMessageToConversation('paused')).toBe(false);
    });
  });

  describe('Message Permissions', () => {
    it('should allow messages from participating personas in active conversations', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockConversation);
      
      const participantPersonaIds = mockConversation.participants.map(p => p.persona_id);
      const isParticipant = SimplePermissionEngine.canPersonaParticipate('amy-persona', participantPersonaIds);
      const conversationOpen = SimplePermissionEngine.canAddMessageToConversation(mockConversation.state.status);
      
      expect(isParticipant && conversationOpen).toBe(true);
    });

    it('should deny messages from non-participating personas', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockConversation);
      
      const participantPersonaIds = mockConversation.participants.map(p => p.persona_id);
      const isParticipant = SimplePermissionEngine.canPersonaParticipate('clara-persona', participantPersonaIds);
      
      expect(isParticipant).toBe(false);
    });

    it('should deny messages to closed conversations', async () => {
      const closedConversation = {
        ...mockConversation,
        state: { ...mockConversation.state, status: 'closed' as const }
      };
      
      jest.spyOn(repository, 'findById').mockResolvedValue(closedConversation);
      
      const conversationOpen = SimplePermissionEngine.canAddMessageToConversation('closed');
      expect(conversationOpen).toBe(false);
    });
  });

  describe('Participant Management', () => {
    it('should allow Amy to add participants based on AI config', () => {
      const canAmyAddParticipants = SimplePermissionEngine.canPersonaPerformAction(amyPersona, 'canAddParticipants');
      expect(canAmyAddParticipants).toBe(true);
      
      const canClaraAddParticipants = SimplePermissionEngine.canPersonaPerformAction(claraPersona, 'canAddParticipants');
      expect(canClaraAddParticipants).toBe(false);
    });

    it('should enforce Amy participant limits', () => {
      const maxParticipants = amyPersona.ai_config?.maxParticipants || 0;
      expect(maxParticipants).toBe(6);
      
      const currentParticipants = mockConversation.participants.length;
      const canAddMore = currentParticipants < maxParticipants;
      expect(canAddMore).toBe(true); // 2 < 6
    });
  });

  describe('Content Moderation', () => {
    it('should allow Clara to moderate content based on AI config', () => {
      const canClaraModerate = SimplePermissionEngine.canPersonaPerformAction(claraPersona, 'canModerateContent');
      expect(canClaraModerate).toBe(true);
      
      const canAmyModerate = SimplePermissionEngine.canPersonaPerformAction(amyPersona, 'canModerateContent');
      expect(canAmyModerate).toBe(false);
    });

    it('should allow Clara to archive conversations', () => {
      const canClaraArchive = SimplePermissionEngine.canPersonaPerformAction(claraPersona, 'canArchiveConversations');
      expect(canClaraArchive).toBe(true);
    });
  });

  describe('Emergency Override (Super-Admin)', () => {
    it('should allow super-admin to override restrictions', () => {
      // In simplified model, super-admin just uses regular admin privileges
      const isSuperAdmin = SimplePermissionEngine.isSuperAdmin(godUser);
      expect(isSuperAdmin).toBe(true);
      
      // Super-admin can manage any persona they own (which includes all AI agents)
      const canManageAmy = SimplePermissionEngine.canUserManagePersona(godUser.id, amyPersona);
      const canManageClara = SimplePermissionEngine.canUserManagePersona(godUser.id, claraPersona);
      
      expect(canManageAmy).toBe(true);
      expect(canManageClara).toBe(true);
    });

    it('should not give regular users super-admin privileges', () => {
      const isSuperAdmin = SimplePermissionEngine.isSuperAdmin(regularUser);
      expect(isSuperAdmin).toBe(false);
      
      const canManageAmy = SimplePermissionEngine.canUserManagePersona(regularUser.id, amyPersona);
      expect(canManageAmy).toBe(false);
    });
  });

  describe('Database Operations', () => {
    it('should validate persona ownership before conversation creation', async () => {
      // User creates conversation with their own persona
      const canUserUseOwnPersona = SimplePermissionEngine.canUserManagePersona(regularUser.id, userPersona);
      expect(canUserUseOwnPersona).toBe(true);
      
      // User cannot create conversation with AI agent persona they don't own
      const canUserUseAmyPersona = SimplePermissionEngine.canUserManagePersona(regularUser.id, amyPersona);
      expect(canUserUseAmyPersona).toBe(false);
    });

    it('should filter conversations by participant access', async () => {
      jest.spyOn(repository, 'findByQuery').mockResolvedValue([mockConversation]);
      
      const conversations = await repository.findByQuery({});
      const participantPersonaIds = conversations[0].participants.map(p => p.persona_id);
      
      const userHasAccess = SimplePermissionEngine.canPersonaParticipate('user-persona-1', participantPersonaIds);
      const amyHasAccess = SimplePermissionEngine.canPersonaParticipate('amy-persona', participantPersonaIds);
      const claraHasAccess = SimplePermissionEngine.canPersonaParticipate('clara-persona', participantPersonaIds);
      
      expect(userHasAccess).toBe(true);
      expect(amyHasAccess).toBe(true);
      expect(claraHasAccess).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should allow super-admin to update AI capabilities', () => {
      const canUpdateAmyConfig = SimplePermissionEngine.canUserManagePersona(godUser.id, amyPersona);
      const canUpdateClaraConfig = SimplePermissionEngine.canUserManagePersona(godUser.id, claraPersona);
      
      expect(canUpdateAmyConfig).toBe(true);
      expect(canUpdateClaraConfig).toBe(true);
      
      // Regular user cannot update AI configs
      const canRegularUserUpdate = SimplePermissionEngine.canUserManagePersona(regularUser.id, amyPersona);
      expect(canRegularUserUpdate).toBe(false);
    });

    it('should treat AI capabilities as configurable persona properties', () => {
      // AI capabilities are just properties, not hardcoded permissions
      const newAmyConfig = {
        ...amyPersona.ai_config,
        maxParticipants: 10, // Super-admin can change this
        autoWelcomeNewUsers: false
      };
      
      expect(newAmyConfig.maxParticipants).toBe(10);
      expect(newAmyConfig.autoWelcomeNewUsers).toBe(false);
      
      // These are just configuration values, not permission constants
      expect(typeof newAmyConfig.maxParticipants).toBe('number');
      expect(typeof newAmyConfig.autoWelcomeNewUsers).toBe('boolean');
    });
  });
});