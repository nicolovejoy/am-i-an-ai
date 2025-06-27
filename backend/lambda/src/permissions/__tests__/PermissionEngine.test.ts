import { PermissionEngine } from '../PermissionEngine';
import { User } from '../../types/auth';
import { Conversation, Persona } from '../../types/database';

describe('PermissionEngine', () => {
  let engine: PermissionEngine;
  
  const regularUser: User = {
    id: 'user-1',
    username: 'alice',
    role: 'regular',
  };

  const adminUser: User = {
    id: 'admin-1',
    username: 'admin',
    role: 'admin',
  };

  const alicePersona: Persona = {
    id: 'persona-1',
    name: 'Alice',
    type: 'human_persona',
    owner_id: 'user-1',
    description: 'Test persona',
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const bobPersona: Persona = {
    id: 'persona-2',
    name: 'Bob',
    type: 'human_persona',
    owner_id: 'user-2',
    description: 'Another user persona',
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
  };


  const privateConversation: Conversation = {
    id: 'conv-1',
    title: 'Private Chat',
    topic: 'Personal',
    participants: [
      { personaId: 'persona-1', role: 'initiator', isRevealed: false, joinedAt: new Date(), lastActiveAt: new Date() },
      { personaId: 'persona-2', role: 'responder', isRevealed: false, joinedAt: new Date(), lastActiveAt: new Date() },
    ],
    metadata: { visibility: 'private' },
    status: 'active',
    can_add_messages: true,
    initiator_persona_id: 'persona-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const publicConversation: Conversation = {
    id: 'conv-2',
    title: 'Public Discussion',
    topic: 'General',
    participants: [
      { personaId: 'persona-2', role: 'initiator', isRevealed: false, joinedAt: new Date(), lastActiveAt: new Date() },
    ],
    metadata: { visibility: 'public' },
    status: 'active',
    can_add_messages: true,
    initiator_persona_id: 'persona-2',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const closedConversation: Conversation = {
    ...privateConversation,
    id: 'conv-3',
    status: 'completed',
    can_add_messages: false,
  };

  beforeEach(() => {
    engine = new PermissionEngine();
  });

  describe('Conversation View Permissions', () => {
    it('allows participants to view private conversations', async () => {
      const canView = await engine.canUserViewConversation(
        regularUser,
        privateConversation,
        [alicePersona]
      );
      expect(canView).toBe(true);
    });

    it('denies non-participants from viewing private conversations', async () => {
      const canView = await engine.canUserViewConversation(
        { ...regularUser, id: 'user-3' },
        privateConversation,
        [] // No personas in conversation
      );
      expect(canView).toBe(false);
    });

    it('allows anyone to view public conversations', async () => {
      const canView = await engine.canUserViewConversation(
        { ...regularUser, id: 'user-3' },
        publicConversation,
        [] // Even with no personas
      );
      expect(canView).toBe(true);
    });

    it('allows admins to view any conversation', async () => {
      const canView = await engine.canUserViewConversation(
        adminUser,
        privateConversation,
        [] // Even with no personas
      );
      expect(canView).toBe(true);
    });
  });

  describe('Message Posting Permissions', () => {
    it('allows participants to post in active conversations', async () => {
      const canPost = await engine.canUserPostMessage(
        regularUser,
        privateConversation,
        'persona-1',
        [alicePersona]
      );
      expect(canPost).toBe(true);
    });

    it('denies posting with unowned personas', async () => {
      const canPost = await engine.canUserPostMessage(
        regularUser,
        privateConversation,
        'persona-2', // Bob's persona - user doesn't own this
        [alicePersona] // User only owns Alice's persona
      );
      expect(canPost).toBe(false);
    });

    it('denies posting in closed conversations', async () => {
      const canPost = await engine.canUserPostMessage(
        regularUser,
        closedConversation,
        'persona-1',
        [alicePersona]
      );
      expect(canPost).toBe(false);
    });

    it('denies non-participants from posting', async () => {
      const canPost = await engine.canUserPostMessage(
        regularUser,
        publicConversation, // Alice not a participant
        'persona-1',
        [alicePersona]
      );
      expect(canPost).toBe(false);
    });

    it('denies admins from posting as unowned personas', async () => {
      const canPost = await engine.canUserPostMessage(
        adminUser,
        privateConversation,
        'persona-1', // Admin doesn't own Alice's persona
        []
      );
      expect(canPost).toBe(false);
    });
  });

  describe('Conversation Management Permissions', () => {
    it('allows initiators to close conversations', async () => {
      const result = await engine.evaluatePermissions({
        user: regularUser,
        action: 'close',
        resource: privateConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [alicePersona] },
      });
      expect(result.permissions.canClose).toBe(true);
    });

    it('denies non-initiators from closing conversations', async () => {
      const result = await engine.evaluatePermissions({
        user: { ...regularUser, id: 'user-2' },
        action: 'close',
        resource: privateConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [bobPersona] },
      });
      expect(result.permissions.canClose).toBe(false);
    });

    it('allows admins to close any conversation', async () => {
      const result = await engine.evaluatePermissions({
        user: adminUser,
        action: 'close',
        resource: privateConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [] },
      });
      expect(result.permissions.canClose).toBe(true);
    });
  });

  describe('Public Conversation Joining', () => {
    it('allows anyone to join public conversations', async () => {
      const result = await engine.evaluatePermissions({
        user: regularUser,
        action: 'join',
        resource: publicConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [alicePersona] },
      });
      expect(result.permissions.canJoin).toBe(true);
    });

    it('denies joining private conversations', async () => {
      const result = await engine.evaluatePermissions({
        user: { ...regularUser, id: 'user-3' },
        action: 'join',
        resource: privateConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [] },
      });
      expect(result.permissions.canJoin).toBe(false);
    });
  });

  describe('Complete Permission Evaluation', () => {
    it('returns full permission set for conversation initiator', async () => {
      const result = await engine.evaluatePermissions({
        user: regularUser,
        action: 'all',
        resource: privateConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [alicePersona] },
      });

      expect(result.permissions).toEqual({
        canView: true,
        canAddMessage: true,
        canJoin: false, // Already a participant
        canClose: true,
        canAddParticipant: true,
        canRemoveParticipant: true,
        canDelete: false, // Only admins can delete
      });
    });

    it('returns limited permissions for non-initiator participant', async () => {
      const result = await engine.evaluatePermissions({
        user: { ...regularUser, id: 'user-2' },
        action: 'all',
        resource: privateConversation,
        resourceType: 'conversation',
        metadata: { userPersonas: [bobPersona] },
      });

      expect(result.permissions).toEqual({
        canView: true,
        canAddMessage: true,
        canJoin: false,
        canClose: false,
        canAddParticipant: false,
        canRemoveParticipant: false,
        canDelete: false,
      });
    });
  });
});