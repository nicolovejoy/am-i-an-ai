-- Migration: Flexible Schema with JSONB
-- Date: 2025-06-25
-- Description: Add flexible JSONB-based schema for future-proof data storage
-- Author: AmIAnAI Team
-- Version: 2

-- NOTE: Since there's no production data to preserve, this is a simple addition
-- of new columns. We can clean up old columns in a future migration if desired.

BEGIN;

-- Step 1: Add schema version tracking table
CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  migration_date TIMESTAMP DEFAULT NOW(),
  breaking_changes BOOLEAN DEFAULT false,
  migration_notes JSONB DEFAULT '{}'
);

-- Record this migration
INSERT INTO schema_versions (version, description, breaking_changes, migration_notes) 
VALUES (
  2, 
  'Flexible JSONB schema for conversations', 
  false,
  '{"features": ["jsonb_participants", "jsonb_state", "history_tracking", "soft_deletes"]}'::jsonb
);

-- Step 2: Add JSONB columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{"status": "active", "can_add_messages": true}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 2;

-- Step 3: Add soft delete columns to all major tables
ALTER TABLE personas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Step 4: Migrate existing conversation participants to JSONB
UPDATE conversations c
SET participants = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'persona_id', cp.persona_id::text,
        'role', cp.role,
        'joined_at', cp.joined_at,
        'is_revealed', cp.is_revealed,
        'left_at', null,
        'permissions', CASE 
          WHEN cp.role = 'host' THEN '["read", "write", "moderate", "close"]'::jsonb
          WHEN cp.role = 'moderator' THEN '["read", "write", "moderate"]'::jsonb
          ELSE '["read", "write"]'::jsonb
        END,
        'metadata', '{}'::jsonb
      ) ORDER BY cp.joined_at
    )
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
  ),
  '[]'::jsonb
)
WHERE c.participants = '[]'::jsonb;

-- Step 5: Migrate existing state fields to JSONB
UPDATE conversations
SET state = jsonb_build_object(
  'status', COALESCE(status, 'active'),
  'can_add_messages', COALESCE(can_add_messages, true),
  'closed_by', closed_by,
  'closed_at', closed_at,
  'close_reason', close_reason,
  'paused_at', paused_at,
  'resumed_at', resumed_at,
  'restrictions', '[]'::jsonb
)
WHERE state = '{"status": "active", "can_add_messages": true}'::jsonb;

-- Step 6: Initialize history with creation event
UPDATE conversations c
SET history = jsonb_build_array(
  jsonb_build_object(
    'timestamp', c.created_at,
    'action', 'conversation_created',
    'actor', c.created_by::text,
    'details', jsonb_build_object(
      'title', c.title,
      'topic', c.topic,
      'initial_participants', c.participants
    )
  )
)
WHERE c.history = '[]'::jsonb;

-- Step 7: Create indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations USING gin(state);
CREATE INDEX IF NOT EXISTS idx_conversations_state_status ON conversations ((state->>'status'));
CREATE INDEX IF NOT EXISTS idx_conversations_state_can_add ON conversations ((state->>'can_add_messages'));
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at ON conversations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_personas_deleted_at ON personas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Step 8: Create views for active records (excluding soft-deleted)
CREATE OR REPLACE VIEW active_conversations AS 
SELECT * FROM conversations WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_personas AS 
SELECT * FROM personas WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_messages AS 
SELECT * FROM messages WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_users AS 
SELECT * FROM users WHERE deleted_at IS NULL;

-- Step 9: Create helper functions for JSONB operations

-- Function to add a participant to a conversation
CREATE OR REPLACE FUNCTION add_conversation_participant(
  p_conversation_id UUID,
  p_persona_id UUID,
  p_role VARCHAR DEFAULT 'guest',
  p_permissions JSONB DEFAULT '["read", "write"]'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_participant JSONB;
  v_history_entry JSONB;
BEGIN
  -- Build participant object
  v_participant := jsonb_build_object(
    'persona_id', p_persona_id::text,
    'role', p_role,
    'joined_at', NOW(),
    'is_revealed', false,
    'left_at', null,
    'permissions', p_permissions,
    'metadata', '{}'::jsonb
  );
  
  -- Update participants array
  UPDATE conversations
  SET participants = participants || v_participant
  WHERE id = p_conversation_id;
  
  -- Add history entry
  v_history_entry := jsonb_build_object(
    'timestamp', NOW(),
    'action', 'participant_added',
    'actor', 'system',
    'details', jsonb_build_object(
      'persona_id', p_persona_id::text,
      'role', p_role
    )
  );
  
  UPDATE conversations
  SET history = history || v_history_entry
  WHERE id = p_conversation_id;
  
  RETURN v_participant;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation state
CREATE OR REPLACE FUNCTION update_conversation_state(
  p_conversation_id UUID,
  p_updates JSONB,
  p_actor VARCHAR
) RETURNS JSONB AS $$
DECLARE
  v_old_state JSONB;
  v_new_state JSONB;
  v_history_entry JSONB;
BEGIN
  -- Get current state
  SELECT state INTO v_old_state
  FROM conversations
  WHERE id = p_conversation_id;
  
  -- Merge updates
  v_new_state := v_old_state || p_updates;
  
  -- Update state
  UPDATE conversations
  SET state = v_new_state
  WHERE id = p_conversation_id;
  
  -- Add history entry
  v_history_entry := jsonb_build_object(
    'timestamp', NOW(),
    'action', 'state_change',
    'actor', p_actor,
    'changes', jsonb_build_object(
      'old', v_old_state,
      'new', v_new_state
    )
  );
  
  UPDATE conversations
  SET history = history || v_history_entry
  WHERE id = p_conversation_id;
  
  RETURN v_new_state;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Add comments for documentation
COMMENT ON COLUMN conversations.participants IS 'JSONB array of conversation participants with roles and permissions';
COMMENT ON COLUMN conversations.state IS 'JSONB object containing conversation state (status, restrictions, etc)';
COMMENT ON COLUMN conversations.metadata IS 'JSONB object for flexible metadata storage';
COMMENT ON COLUMN conversations.settings IS 'JSONB object for conversation-specific settings';
COMMENT ON COLUMN conversations.history IS 'JSONB array tracking all changes to the conversation';
COMMENT ON COLUMN conversations.schema_version IS 'Schema version for data structure compatibility';

-- Add migration completion note
INSERT INTO conversations (
  id,
  title,
  topic,
  description,
  created_by,
  metadata
) VALUES (
  gen_random_uuid(),
  'Migration Test Conversation',
  'System',
  'Test conversation created by migration 002',
  '00000000-0000-0000-0000-000000000000',
  '{"migration": "002-flexible-schema", "test": true}'::jsonb
) ON CONFLICT DO NOTHING;

COMMIT;

-- Rollback script (save this separately as 002-flexible-schema-rollback.sql)
-- BEGIN;
-- ALTER TABLE conversations 
-- DROP COLUMN IF EXISTS participants,
-- DROP COLUMN IF EXISTS state,
-- DROP COLUMN IF EXISTS metadata,
-- DROP COLUMN IF EXISTS settings,
-- DROP COLUMN IF EXISTS history,
-- DROP COLUMN IF EXISTS schema_version;
-- 
-- ALTER TABLE personas DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE messages DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE conversations DROP COLUMN IF EXISTS deleted_at;
-- 
-- DROP VIEW IF EXISTS active_conversations;
-- DROP VIEW IF EXISTS active_personas;
-- DROP VIEW IF EXISTS active_messages;
-- DROP VIEW IF EXISTS active_users;
-- 
-- DROP FUNCTION IF EXISTS add_conversation_participant;
-- DROP FUNCTION IF EXISTS update_conversation_state;
-- 
-- DELETE FROM schema_versions WHERE version = 2;
-- DROP TABLE IF EXISTS schema_versions;
-- COMMIT;