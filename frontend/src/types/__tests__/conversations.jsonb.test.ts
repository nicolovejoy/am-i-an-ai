import {
  ConversationState,
  ConversationParticipant,
  ConversationMetadata,
  ConversationSettings,
  ConversationHistoryEntry,
  ConversationWithJSONB,
  isConversationOpen,
  canUserAddMessage,
  getParticipantRole,
  addParticipantToConversation,
  closeConversation,
  updateConversationState
} from '../conversations';

describe('JSONB Conversation Types', () => {
  describe('ConversationState', () => {
    it('should define conversation state structure', () => {
      const state: ConversationState = {
        status: 'active',
        can_add_messages: true,
        closed_by: null,
        closed_at: null,
        close_reason: null,
        paused_at: null,
        resumed_at: null,
        restrictions: []
      };

      expect(state.status).toBe('active');
      expect(state.can_add_messages).toBe(true);
    });

    it('should handle closed conversation state', () => {
      const closedState: ConversationState = {
        status: 'closed',
        can_add_messages: false,
        closed_by: 'user-123',
        closed_at: new Date('2025-01-01T12:00:00Z'),
        close_reason: 'Conversation completed successfully',
        paused_at: null,
        resumed_at: null,
        restrictions: ['no_new_messages', 'read_only']
      };

      expect(closedState.status).toBe('closed');
      expect(closedState.can_add_messages).toBe(false);
      expect(closedState.closed_by).toBe('user-123');
      expect(closedState.close_reason).toBeTruthy();
    });
  });

  describe('ConversationParticipant', () => {
    it('should define participant structure', () => {
      const participant: ConversationParticipant = {
        persona_id: 'persona-123',
        role: 'host',
        joined_at: new Date('2025-01-01T10:00:00Z'),
        is_revealed: false,
        left_at: null,
        permissions: ['read', 'write', 'moderate', 'close'],
        metadata: {
          invite_sent_by: 'user-456',
          custom_field: 'value'
        }
      };

      expect(participant.persona_id).toBe('persona-123');
      expect(participant.role).toBe('host');
      expect(participant.permissions).toContain('moderate');
    });

    it('should support flexible participant counts', () => {
      const participants: ConversationParticipant[] = [
        {
          persona_id: 'persona-1',
          role: 'host',
          joined_at: new Date(),
          is_revealed: false,
          left_at: null,
          permissions: ['read', 'write', 'moderate', 'close'],
          metadata: {}
        },
        {
          persona_id: 'persona-2',
          role: 'guest',
          joined_at: new Date(),
          is_revealed: false,
          left_at: null,
          permissions: ['read', 'write'],
          metadata: {}
        },
        {
          persona_id: 'persona-3',
          role: 'guest',
          joined_at: new Date(),
          is_revealed: true,
          left_at: null,
          permissions: ['read', 'write'],
          metadata: {}
        }
      ];

      expect(participants).toHaveLength(3);
      expect(participants.filter(p => p.role === 'guest')).toHaveLength(2);
    });
  });

  describe('ConversationHistoryEntry', () => {
    it('should track conversation changes', () => {
      const historyEntry: ConversationHistoryEntry = {
        timestamp: new Date('2025-01-01T11:00:00Z'),
        action: 'state_change',
        actor: {
          id: 'user-123',
          type: 'user',
          name: 'Test User'
        },
        details: {
          field: 'status',
          old_value: 'active',
          new_value: 'paused'
        }
      };

      expect(historyEntry.action).toBe('state_change');
      expect(historyEntry.details.old_value).toBe('active');
      expect(historyEntry.details.new_value).toBe('paused');
    });

    it('should track participant additions', () => {
      const historyEntry: ConversationHistoryEntry = {
        timestamp: new Date(),
        action: 'participant_added',
        actor: {
          id: 'system',
          type: 'system',
          name: 'System'
        },
        details: {
          persona_id: 'persona-789',
          role: 'guest'
        }
      };

      expect(historyEntry.action).toBe('participant_added');
      expect(historyEntry.details.persona_id).toBe('persona-789');
    });
  });

  describe('ConversationWithJSONB', () => {
    it('should combine traditional and JSONB fields', () => {
      const conversation: ConversationWithJSONB = {
        id: 'conv-123',
        title: 'Test Conversation',
        topic: 'Testing',
        description: 'A test conversation',
        created_by: 'user-123',
        created_at: new Date(),
        
        // JSONB fields
        participants: [
          {
            persona_id: 'persona-1',
            role: 'host',
            joined_at: new Date(),
            is_revealed: false,
            left_at: null,
            permissions: ['read', 'write', 'moderate', 'close'],
            metadata: {}
          },
          {
            persona_id: 'persona-2',
            role: 'guest',
            joined_at: new Date(),
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
          tags: ['test', 'example'],
          visibility: 'private'
        },
        settings: {
          max_participants: 5,
          allow_late_joining: true,
          auto_close_after_hours: 24
        },
        history: [],
        schema_version: 2,
        deleted_at: null
      };

      expect(conversation.participants).toHaveLength(2);
      expect(conversation.state.status).toBe('active');
      expect(conversation.settings.max_participants).toBe(5);
    });
  });

  describe('Utility Functions', () => {
    const mockConversation: ConversationWithJSONB = {
      id: 'conv-123',
      title: 'Test',
      topic: 'Test',
      created_by: 'user-123',
      created_at: new Date(),
      participants: [
        {
          persona_id: 'persona-1',
          role: 'host',
          joined_at: new Date(),
          is_revealed: false,
          left_at: null,
          permissions: ['read', 'write', 'moderate', 'close'],
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
      metadata: {},
      settings: {},
      history: [],
      schema_version: 2,
      deleted_at: null
    };

    describe('isConversationOpen', () => {
      it('should return true for active conversations', () => {
        expect(isConversationOpen(mockConversation)).toBe(true);
      });

      it('should return false for closed conversations', () => {
        const closedConv = {
          ...mockConversation,
          state: { ...mockConversation.state, status: 'closed' as const }
        };
        expect(isConversationOpen(closedConv)).toBe(false);
      });
    });

    describe('canUserAddMessage', () => {
      it('should check if user can add messages', () => {
        expect(canUserAddMessage(mockConversation, 'persona-1')).toBe(true);
      });

      it('should return false if conversation blocks messages', () => {
        const blockedConv = {
          ...mockConversation,
          state: { ...mockConversation.state, can_add_messages: false }
        };
        expect(canUserAddMessage(blockedConv, 'persona-1')).toBe(false);
      });

      it('should return false if user is not a participant', () => {
        expect(canUserAddMessage(mockConversation, 'persona-999')).toBe(false);
      });
    });

    describe('getParticipantRole', () => {
      it('should return participant role', () => {
        expect(getParticipantRole(mockConversation, 'persona-1')).toBe('host');
      });

      it('should return null for non-participants', () => {
        expect(getParticipantRole(mockConversation, 'persona-999')).toBeNull();
      });
    });

    describe('addParticipantToConversation', () => {
      it('should add a new participant', () => {
        const updated = addParticipantToConversation(
          mockConversation,
          'persona-2',
          'guest'
        );

        expect(updated.participants).toHaveLength(2);
        expect(updated.participants[1].persona_id).toBe('persona-2');
        expect(updated.history).toHaveLength(1);
        expect(updated.history[0].action).toBe('participant_added');
      });

      it('should not add duplicate participants', () => {
        const updated = addParticipantToConversation(
          mockConversation,
          'persona-1',
          'guest'
        );

        expect(updated.participants).toHaveLength(1);
        expect(updated.history).toHaveLength(0);
      });
    });

    describe('closeConversation', () => {
      it('should close a conversation', () => {
        const closed = closeConversation(
          mockConversation,
          'user-123',
          'Conversation completed'
        );

        expect(closed.state.status).toBe('closed');
        expect(closed.state.can_add_messages).toBe(false);
        expect(closed.state.closed_by).toBe('user-123');
        expect(closed.state.close_reason).toBe('Conversation completed');
        expect(closed.history).toHaveLength(1);
        expect(closed.history[0].action).toBe('conversation_closed');
      });
    });

    describe('updateConversationState', () => {
      it('should update conversation state', () => {
        const updated = updateConversationState(
          mockConversation,
          { status: 'paused', paused_at: new Date() },
          'user-123'
        );

        expect(updated.state.status).toBe('paused');
        expect(updated.state.paused_at).toBeTruthy();
        expect(updated.history).toHaveLength(1);
        expect(updated.history[0].action).toBe('state_change');
      });
    });
  });
});