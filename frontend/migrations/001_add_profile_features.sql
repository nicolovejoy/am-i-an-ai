-- Migration: Add Profile Features
-- Date: 2025-06-29
-- Description: Add bio, privacy levels, trust scores, and user connections

-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio VARCHAR(160),
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(20) DEFAULT 'connections',
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;

-- Update display_name constraint to 30 chars
ALTER TABLE users ALTER COLUMN display_name TYPE VARCHAR(30);

-- Create user_connections table
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  trust_score INTEGER DEFAULT 50,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  
  -- Ensure bidirectional uniqueness
  CONSTRAINT unique_connection UNIQUE(from_user_id, to_user_id),
  -- Prevent self-connections
  CONSTRAINT no_self_connection CHECK (from_user_id != to_user_id)
);

-- Add character limits to existing tables for consistency
ALTER TABLE personas ALTER COLUMN description TYPE VARCHAR(200);
ALTER TABLE messages ADD CONSTRAINT message_content_length CHECK (LENGTH(content) <= 2000);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_privacy_level ON users(privacy_level);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);
CREATE INDEX IF NOT EXISTS idx_connections_from_user ON user_connections(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_to_user ON user_connections(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status);

-- Update existing users with default values
UPDATE users SET 
  privacy_level = 'connections',
  trust_score = 50
WHERE privacy_level IS NULL OR trust_score IS NULL;