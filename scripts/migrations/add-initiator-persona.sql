-- Add initiator_persona_id to track conversation creator
-- This enables permission rules based on who started the conversation

-- Add the column
ALTER TABLE conversations 
ADD COLUMN initiator_persona_id UUID REFERENCES personas(id);

-- Create index for performance
CREATE INDEX idx_conversations_initiator 
ON conversations(initiator_persona_id);

-- Backfill existing conversations
-- The first participant becomes the initiator for existing data
UPDATE conversations 
SET initiator_persona_id = (participants->0->>'personaId')::UUID
WHERE initiator_persona_id IS NULL
  AND jsonb_array_length(participants) > 0;

-- Add permission_overrides for future extensibility
ALTER TABLE conversations
ADD COLUMN permission_overrides JSONB DEFAULT '{}';

-- Add index for visibility queries
CREATE INDEX idx_conversations_visibility 
ON conversations((metadata->>'visibility'))
WHERE metadata->>'visibility' IS NOT NULL;

-- Add comment documenting the permission model
COMMENT ON COLUMN conversations.initiator_persona_id IS 
'The persona who created this conversation. Used for permission checks - initiators can close conversations and manage participants.';

COMMENT ON COLUMN conversations.permission_overrides IS 
'Custom permission rules for this conversation. Allows future extensibility without schema changes. Example: {"allowedActions": ["view"], "blockedUsers": ["user-id"]}';