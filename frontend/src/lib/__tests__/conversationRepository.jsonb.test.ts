import {
  ConversationJSONBRepository,
  ConversationRepositoryImpl,
  ConversationQuery,
  ConversationCreate,
  ConversationUpdate
} from '../conversationRepository';
import { ConversationWithJSONB, ConversationParticipant } from '../../types/conversations';

// Mock database
const mockDatabase = {
  query: jest.fn(),
};

describe('ConversationJSONBRepository', () => {
  let repository: ConversationJSONBRepository;

  beforeEach(() => {
    repository = new ConversationRepositoryImpl(mockDatabase as any);
    jest.clearAllMocks();
  });

  const mockConversation: ConversationWithJSONB = {
    id: 'conv-123',
    title: 'Test Conversation',
    topic: 'Testing',
    description: 'A test conversation',
    created_by: 'user-123',
    created_at: new Date('2025-01-01T10:00:00Z'),
    participants: [
      {
        persona_id: 'persona-1',
        role: 'host',
        joined_at: new Date('2025-01-01T10:00:00Z'),
        is_revealed: false,
        left_at: null,
        permissions: ['read', 'write', 'moderate', 'close'],
        metadata: {}
      },
      {
        persona_id: 'persona-2',
        role: 'guest',
        joined_at: new Date('2025-01-01T10:05:00Z'),
        is_revealed: false,
        left_at: null,
        permissions: ['read', 'write'],
        metadata: {}
      }
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
      tags: ['test'],
      visibility: 'private'
    },
    settings: {
      max_participants: 5,
      allow_late_joining: true
    },
    history: [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        action: 'conversation_created',
        actor: 'user-123',
        details: { title: 'Test Conversation' }
      }
    ],
    schema_version: 2,
    deleted_at: null
  };

  describe('create', () => {
    it('should create a conversation with JSONB fields', async () => {
      const createData: ConversationCreate = {
        title: 'New Conversation',
        topic: 'New Topic',
        description: 'A new conversation',
        created_by: 'user-123',
        participants: [
          {
            persona_id: 'persona-1',
            role: 'host',
            permissions: ['read', 'write', 'moderate', 'close']
          }
        ],
        state: {
          status: 'active',
          can_add_messages: true
        },
        metadata: { visibility: 'public' },
        settings: { max_participants: 3 }
      };

      mockDatabase.query.mockResolvedValue({
        rows: [{ ...mockConversation, ...createData }]
      });

      const result = await repository.create(createData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO conversations'),
        expect.arrayContaining([
          createData.title,
          createData.topic,
          createData.description,
          createData.created_by
        ])
      );

      expect(result.title).toBe(createData.title);
      expect(result.participants).toHaveLength(1);
    });

    it('should initialize conversation with history entry', async () => {
      const createData: ConversationCreate = {
        title: 'New Conversation',
        topic: 'New Topic',
        created_by: 'user-123',
        participants: [],
        state: { status: 'active', can_add_messages: true },
        metadata: {},
        settings: {}
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      await repository.create(createData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO conversations'),
        expect.any(Array)
      );
    });
  });

  describe('findById', () => {
    it('should find conversation by ID with proper JSON parsing', async () => {
      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      const result = await repository.findById('conv-123');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM conversations'),
        ['conv-123']
      );

      expect(result).toEqual(mockConversation);
      expect(result?.participants).toHaveLength(2);
      expect(result?.state.status).toBe('active');
    });

    it('should return null for non-existent conversation', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should exclude soft-deleted conversations', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      await repository.findById('conv-123');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        ['conv-123']
      );
    });
  });

  describe('findByQuery', () => {
    it('should find conversations by user ID', async () => {
      const query: ConversationQuery = {
        created_by: 'user-123'
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      const result = await repository.findByQuery(query);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('created_by'),
        expect.arrayContaining(['user-123'])
      );

      expect(result).toHaveLength(1);
    });

    it('should find conversations by participant', async () => {
      const query: ConversationQuery = {
        participant_persona_id: 'persona-1'
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      await repository.findByQuery(query);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('participants @> $1'),
        [JSON.stringify([{ persona_id: 'persona-1' }])]
      );
    });

    it('should find conversations by status', async () => {
      const query: ConversationQuery = {
        status: 'active'
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      await repository.findByQuery(query);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining("state->>'status' = $1"),
        ['active']
      );
    });

    it('should support pagination', async () => {
      const query: ConversationQuery = {
        limit: 10,
        offset: 20
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      await repository.findByQuery(query);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        expect.arrayContaining([10, 20])
      );
    });
  });

  describe('update', () => {
    it('should update conversation with JSONB fields', async () => {
      const updates: ConversationUpdate = {
        title: 'Updated Title',
        state: {
          status: 'paused',
          can_add_messages: false,
          paused_at: new Date()
        },
        metadata: {
          tags: ['updated', 'test']
        }
      };

      mockDatabase.query.mockResolvedValue({
        rows: [{ ...mockConversation, ...updates }]
      });

      const result = await repository.update('conv-123', updates);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversations'),
        expect.arrayContaining([
          updates.title
        ])
      );

      expect(result.title).toBe(updates.title);
    });

    it('should add history entry for updates', async () => {
      const updates: ConversationUpdate = {
        state: { status: 'closed' }
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      await repository.update('conv-123', updates, 'user-123');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversations'),
        expect.any(Array)
      );
    });
  });

  describe('addParticipant', () => {
    it('should add participant to conversation', async () => {
      const newParticipant: ConversationParticipant = {
        persona_id: 'persona-3',
        role: 'guest',
        joined_at: new Date(),
        is_revealed: false,
        left_at: null,
        permissions: ['read', 'write'],
        metadata: {}
      };

      // First call returns existing conversation, second call returns updated conversation
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [mockConversation] })
        .mockResolvedValueOnce({
          rows: [{
            ...mockConversation,
            participants: [...mockConversation.participants, newParticipant]
          }]
        });

      const result = await repository.addParticipant('conv-123', newParticipant);

      expect(mockDatabase.query).toHaveBeenCalledTimes(2);
      expect(result.participants).toHaveLength(3);
    });

    it('should not add duplicate participants', async () => {
      const existingParticipant: ConversationParticipant = {
        persona_id: 'persona-1', // Already exists
        role: 'guest',
        joined_at: new Date(),
        is_revealed: false,
        left_at: null,
        permissions: ['read', 'write'],
        metadata: {}
      };

      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation] // No change
      });

      const result = await repository.addParticipant('conv-123', existingParticipant);

      expect(result.participants).toHaveLength(2); // Unchanged
    });
  });

  describe('closeConversation', () => {
    it('should close conversation and update state', async () => {
      const closedConversation = {
        ...mockConversation,
        state: {
          ...mockConversation.state,
          status: 'closed',
          can_add_messages: false,
          closed_by: 'user-123',
          closed_at: new Date(),
          close_reason: 'Test completed'
        }
      };

      mockDatabase.query.mockResolvedValue({
        rows: [closedConversation]
      });

      const result = await repository.closeConversation(
        'conv-123',
        'user-123',
        'Test completed'
      );

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversations'),
        expect.arrayContaining(['conv-123'])
      );

      expect(result.state.status).toBe('closed');
      expect(result.state.can_add_messages).toBe(false);
    });
  });

  describe('canUserAddMessage', () => {
    it('should check if user can add message', async () => {
      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      const canAdd = await repository.canUserAddMessage('conv-123', 'persona-1');

      expect(canAdd).toBe(true);
    });

    it('should return false for closed conversation', async () => {
      const closedConversation = {
        ...mockConversation,
        state: { ...mockConversation.state, can_add_messages: false }
      };

      mockDatabase.query.mockResolvedValue({
        rows: [closedConversation]
      });

      const canAdd = await repository.canUserAddMessage('conv-123', 'persona-1');

      expect(canAdd).toBe(false);
    });

    it('should return false for non-participant', async () => {
      mockDatabase.query.mockResolvedValue({
        rows: [mockConversation]
      });

      const canAdd = await repository.canUserAddMessage('conv-123', 'persona-999');

      expect(canAdd).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should mark conversation as deleted', async () => {
      mockDatabase.query.mockResolvedValue({
        rows: [{ ...mockConversation, deleted_at: new Date() }]
      });

      const result = await repository.softDelete('conv-123');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at'),
        ['conv-123']
      );

      expect(result).toBe(true);
    });
  });
});