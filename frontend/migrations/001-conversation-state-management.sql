-- Migration: Add conversation state management fields
-- Date: 2025-06-20
-- Description: Add fields to support conversation closing and message blocking

-- Add conversation state management columns
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS can_add_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS close_reason TEXT,
ADD COLUMN IF NOT EXISTS closed_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Update existing conversations to have the default state
UPDATE conversations 
SET can_add_messages = true 
WHERE can_add_messages IS NULL;

-- Add index for efficient queries on conversation status
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_can_add_messages ON conversations(can_add_messages);

-- Add check constraint to ensure status consistency
-- When conversation is closed, can_add_messages should be false
ALTER TABLE conversations 
ADD CONSTRAINT check_closed_conversation_state 
CHECK (
  (status IN ('completed', 'terminated') AND can_add_messages = false) OR
  (status NOT IN ('completed', 'terminated'))
);

-- Comments for documentation
COMMENT ON COLUMN conversations.can_add_messages IS 'Whether new messages can be added to this conversation';
COMMENT ON COLUMN conversations.close_reason IS 'Reason why the conversation was closed (if applicable)';
COMMENT ON COLUMN conversations.closed_by IS 'User ID or system identifier that closed the conversation';
COMMENT ON COLUMN conversations.closed_at IS 'Timestamp when the conversation was closed';