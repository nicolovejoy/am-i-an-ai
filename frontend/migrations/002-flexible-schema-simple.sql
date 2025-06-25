-- Migration: Flexible Schema with JSONB (Simple Version)
-- Date: 2025-06-25
-- Description: Add flexible JSONB columns for future-proof data storage
-- Author: AmIAnAI Team
-- Version: 2

-- Since there's no production data to preserve, this is a straightforward addition

BEGIN;

-- Add JSONB columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{"status": "active", "can_add_messages": true}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 2;

-- Add soft delete support
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations USING gin(state);
CREATE INDEX IF NOT EXISTS idx_conversations_state_status ON conversations ((state->>'status'));
CREATE INDEX IF NOT EXISTS idx_conversations_state_can_add ON conversations ((state->>'can_add_messages'));
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at ON conversations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_personas_deleted_at ON personas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Create helper functions

-- Function to close a conversation
CREATE OR REPLACE FUNCTION close_conversation(
  p_conversation_id UUID,
  p_closed_by VARCHAR,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET 
    state = state || jsonb_build_object(
      'status', 'closed',
      'can_add_messages', false,
      'closed_by', p_closed_by,
      'closed_at', NOW(),
      'close_reason', p_reason
    ),
    history = history || jsonb_build_array(
      jsonb_build_object(
        'timestamp', NOW(),
        'action', 'conversation_closed',
        'actor', p_closed_by,
        'details', jsonb_build_object('reason', p_reason)
      )
    )
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add a participant
CREATE OR REPLACE FUNCTION add_participant(
  p_conversation_id UUID,
  p_persona_id UUID,
  p_role VARCHAR DEFAULT 'guest'
) RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET 
    participants = participants || jsonb_build_array(
      jsonb_build_object(
        'persona_id', p_persona_id::text,
        'role', p_role,
        'joined_at', NOW(),
        'permissions', CASE 
          WHEN p_role = 'host' THEN '["read", "write", "moderate", "close"]'::jsonb
          ELSE '["read", "write"]'::jsonb
        END
      )
    ),
    history = history || jsonb_build_array(
      jsonb_build_object(
        'timestamp', NOW(),
        'action', 'participant_added',
        'actor', 'system',
        'details', jsonb_build_object(
          'persona_id', p_persona_id::text,
          'role', p_role
        )
      )
    )
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON COLUMN conversations.participants IS 'JSONB array of participants: [{persona_id, role, joined_at, permissions}]';
COMMENT ON COLUMN conversations.state IS 'JSONB object with status, can_add_messages, closed_by, etc.';
COMMENT ON COLUMN conversations.metadata IS 'Flexible JSONB storage for additional conversation data';
COMMENT ON COLUMN conversations.settings IS 'JSONB object for feature flags and conversation settings';
COMMENT ON COLUMN conversations.history IS 'Append-only JSONB array of all state changes';

COMMIT;

-- To run this migration:
-- npm run db:migrate