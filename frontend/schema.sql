-- AmIAnAI Database Schema
-- PostgreSQL 16+ required for gen_random_uuid()

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  avatar TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  subscription VARCHAR(50) NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  preferences JSONB NOT NULL DEFAULT '{}',
  current_usage JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  personality JSONB NOT NULL DEFAULT '{}',
  knowledge TEXT[] NOT NULL DEFAULT '{}',
  communication_style VARCHAR(50) NOT NULL,
  model_config JSONB,
  system_prompt TEXT,
  response_time_range JSONB,
  typing_speed INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT false,
  allowed_interactions TEXT[] NOT NULL DEFAULT '{}',
  conversation_count INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  description TEXT,
  constraints JSONB NOT NULL DEFAULT '{}',
  goal JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_turn INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  paused_at TIMESTAMP,
  resumed_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_characters INTEGER NOT NULL DEFAULT 0,
  average_response_time INTEGER NOT NULL DEFAULT 0,
  topic_tags TEXT[] NOT NULL DEFAULT '{}',
  quality_score DECIMAL(3,2)
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, persona_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'text',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  sequence_number INTEGER NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP,
  original_content TEXT,
  reply_to_message_id UUID REFERENCES messages(id),
  thread_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  moderation_status VARCHAR(50) NOT NULL DEFAULT 'approved',
  moderation_flags JSONB[] DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  reactions JSONB DEFAULT '{}',
  quality_rating DECIMAL(3,2)
);

-- Analytics Tables (Optional - can be added later)

-- Persona reveals analytics table
CREATE TABLE IF NOT EXISTS persona_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  revealed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revealed_by VARCHAR(50) NOT NULL,
  reveal_type VARCHAR(50) NOT NULL,
  reveal_context TEXT
);

-- Persona interactions analytics table
CREATE TABLE IF NOT EXISTS persona_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona1_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  persona2_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  conversation_count INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMP NOT NULL DEFAULT NOW(),
  compatibility_score DECIMAL(3,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Performance Indexes

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Persona indexes
CREATE INDEX IF NOT EXISTS idx_personas_owner ON personas(owner_id);
CREATE INDEX IF NOT EXISTS idx_personas_type ON personas(type);
CREATE INDEX IF NOT EXISTS idx_personas_public ON personas(is_public);
CREATE INDEX IF NOT EXISTS idx_personas_knowledge ON personas USING GIN(knowledge);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_persona_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sequence ON messages(conversation_id, sequence_number);

-- Full-text search on message content
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING GIN(to_tsvector('english', content));