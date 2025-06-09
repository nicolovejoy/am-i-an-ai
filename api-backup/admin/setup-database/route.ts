import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';

// Safety: Only allow when explicitly enabled
// eslint-disable-next-line no-undef
const isAdminEnabled = process.env.ENABLE_DB_ADMIN === 'true';

export async function POST() {
  if (!isAdminEnabled) {
    return NextResponse.json(
      { error: 'Database administration not enabled. Set ENABLE_DB_ADMIN=true' },
      { status: 403 }
    );
  }

  try {
    console.log('🔧 Setting up database schema...');
    const db = await getDatabase();

    // Create Users table
    await db.execute(`
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
      )
    `);

    // Create Personas table
    await db.execute(`
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
      )
    `);

    // Create Conversations table
    await db.execute(`
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
      )
    `);

    // Create Conversation Participants table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        is_revealed BOOLEAN NOT NULL DEFAULT false,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (conversation_id, persona_id)
      )
    `);

    // Create Messages table
    await db.execute(`
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
      )
    `);

    // Create indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_personas_owner ON personas(owner_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)');

    console.log('✅ Database schema created successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database schema created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json(
      { 
        error: 'Database setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}