import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryDatabase, getClient } from '../lib/database';

export async function handleAdmin(
  event: APIGatewayProxyEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  try {
    // Admin endpoints
    if (path === '/api/admin/database-status' && method === 'GET') {
      return await getDatabaseStatus(corsHeaders);
    }

    if (path === '/api/admin/setup-database' && method === 'POST') {
      return await setupDatabase(corsHeaders);
    }

    if (path === '/api/admin/seed-database' && method === 'POST') {
      return await seedDatabase(corsHeaders);
    }

    if (path === '/api/admin/fix-message-counts' && method === 'POST') {
      return await fixMessageCounts(corsHeaders);
    }

    if (path === '/api/admin/users' && method === 'GET') {
      return await listUsers(corsHeaders);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Admin endpoint not found' }),
    };

  } catch (error) {
    console.error('Admin handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: String(error),
      }),
    };
  }
}

async function getDatabaseStatus(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Test database connection and get real stats
    const connectionTest = await queryDatabase('SELECT NOW() as current_time, version() as pg_version');
    
    // Get table counts
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM personas) as personas,
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM messages) as messages
    `;
    
    const statsResult = await queryDatabase(statsQuery);
    const stats = statsResult.rows[0];
    
    const status = {
      connected: true,
      host: process.env.DB_HOST || 'RDS_HOST',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'amianai',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      lambda: {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        region: process.env.AWS_REGION,
      },
      postgresVersion: connectionTest.rows[0].pg_version,
      stats: {
        users: parseInt(stats.users),
        personas: parseInt(stats.personas),
        conversations: parseInt(stats.conversations),
        messages: parseInt(stats.messages)
      }
    };

    console.log('Database status check:', status);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        status,
        stats: status.stats
      }),
    };

  } catch (error) {
    console.error('Database status check failed:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Database connection failed',
        message: String(error),
      }),
    };
  }
}

async function setupDatabase(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Starting database schema setup...');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'personas', 'conversations', 'messages')
    `;
    
    const tablesResult = await queryDatabase(tablesQuery);
    const existingTables = tablesResult.rows.map((row: any) => row.table_name);
    
    console.log('Existing tables before setup:', existingTables);

    // If some tables are missing, create the full schema
    const requiredTables = ['users', 'personas', 'conversations', 'messages'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('Missing tables detected, creating schema:', missingTables);
      
      // Create the database schema
      const schemaSQL = `
        -- Create Users table
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

        -- Create Personas table
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

        -- Create Conversations table
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
          quality_score DECIMAL(3,2),
          can_add_messages BOOLEAN DEFAULT true,
          close_reason TEXT,
          closed_by VARCHAR(255),
          closed_at TIMESTAMP
        );

        -- Create Conversation Participants table
        CREATE TABLE IF NOT EXISTS conversation_participants (
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL,
          is_revealed BOOLEAN NOT NULL DEFAULT false,
          joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
          last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY (conversation_id, persona_id)
        );

        -- Create Messages table
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

        -- Create Indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_personas_owner ON personas(owner_id);
        CREATE INDEX IF NOT EXISTS idx_personas_type ON personas(type);
        CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
        CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_persona_id);
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
        CREATE INDEX IF NOT EXISTS idx_messages_sequence ON messages(conversation_id, sequence_number);
      `;
      
      console.log('Executing schema creation SQL...');
      await queryDatabase(schemaSQL);
      console.log('Schema creation completed');
    }
    
    // Check tables again after creation
    const finalTablesResult = await queryDatabase(tablesQuery);
    const finalTables = finalTablesResult.rows.map((row: any) => row.table_name);
    
    console.log('Database setup completed. Final tables:', finalTables);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: missingTables.length > 0 ? 'Database schema created successfully' : 'Database schema already exists',
        existingTables: finalTables,
        createdTables: missingTables,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Database setup failed:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Database setup failed',
        message: String(error),
      }),
    };
  }
}

async function seedDatabase(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    console.log('Starting database seeding transaction');

    // Clear existing data safely with TRUNCATE CASCADE
    console.log('Clearing existing data...');
    
    // Check what exists before clearing (with error handling)
    let beforeStats;
    try {
      beforeStats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM messages) as messages,
          (SELECT COUNT(*) FROM conversation_participants) as participants,
          (SELECT COUNT(*) FROM conversations) as conversations,
          (SELECT COUNT(*) FROM personas) as personas,
          (SELECT COUNT(*) FROM users) as users
      `);
    } catch (statsError) {
      console.log('Could not get table stats (tables may not exist yet):', statsError);
      beforeStats = { rows: [{ messages: 0, participants: 0, conversations: 0, personas: 0, users: 0 }] };
    }
    console.log('Before clearing:', beforeStats.rows[0]);
    
    // Use TRUNCATE CASCADE to clear all data safely
    try {
      await client.query('TRUNCATE TABLE users CASCADE');
      console.log('Truncated all tables with CASCADE');
    } catch (truncateError) {
      // If TRUNCATE fails due to permissions, fall back to DELETE
      console.log('TRUNCATE failed, falling back to DELETE:', truncateError);
      
      await client.query('DELETE FROM messages');
      await client.query('DELETE FROM conversation_participants'); 
      await client.query('DELETE FROM conversations');
      await client.query('DELETE FROM personas');
      await client.query('DELETE FROM users');
      console.log('Deleted data using DELETE statements');
    }
    
    // Verify clearing worked
    const afterStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM messages) as messages,
        (SELECT COUNT(*) FROM conversation_participants) as participants,
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM personas) as personas,
        (SELECT COUNT(*) FROM users) as users
    `);
    console.log('After clearing:', afterStats.rows[0]);
    console.log('All existing data cleared successfully');

    // Insert Users
    await client.query(`
      INSERT INTO users (id, email, display_name, subscription, preferences, is_email_verified, is_active, created_at, updated_at) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'alice@example.com', 'Alice Johnson', 'premium', 
       '{"theme": "light", "language": "en", "timezone": "America/New_York"}', 
       true, true, NOW(), NOW()),
      ('550e8400-e29b-41d4-a716-446655440002', 'bob@example.com', 'Bob Wilson', 'basic',
       '{"theme": "dark", "language": "en", "timezone": "America/Los_Angeles"}',
       true, true, NOW(), NOW()),
      ('550e8400-e29b-41d4-a716-446655440003', 'charlie@example.com', 'Charlie Chen', 'free',
       '{}', true, true, NOW(), NOW())
    `);
    console.log('Inserted users');

    // Insert Personas
    await client.query(`
      INSERT INTO personas (id, name, type, owner_id, description, personality, knowledge, communication_style, is_public, allowed_interactions, created_at, updated_at) VALUES
      ('660e8400-e29b-41d4-a716-446655440001', 'Creative Writer Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001',
       'A passionate creative writer who loves crafting stories and exploring imaginative worlds.',
       '{"openness": 90, "conscientiousness": 75, "extraversion": 60, "agreeableness": 80, "neuroticism": 30, "creativity": 95}',
       '{"arts", "entertainment", "psychology", "general"}', 'creative', true,
       '{"casual_chat", "storytelling", "brainstorm", "roleplay"}', NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440002', 'Professional Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001',
       'A business-focused version of Alice, specialized in project management and strategic thinking.',
       '{"openness": 70, "conscientiousness": 95, "extraversion": 75, "agreeableness": 70, "neuroticism": 20}',
       '{"business", "technology", "general"}', 'formal', true,
       '{"debate", "interview", "brainstorm"}', NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440003', 'Philosopher Bob', 'human_persona', '550e8400-e29b-41d4-a716-446655440002',
       'A deep thinker who enjoys philosophical discussions and exploring complex ideas.',
       '{"openness": 95, "conscientiousness": 80, "extraversion": 40, "agreeableness": 60, "neuroticism": 50}',
       '{"philosophy", "science", "history", "general"}', 'academic', true,
       '{"debate", "interview", "casual_chat"}', NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440004', 'Tech Enthusiast Bob', 'human_persona', '550e8400-e29b-41d4-a716-446655440002',
       'A technology lover who stays up-to-date with the latest innovations and trends.',
       '{"openness": 80, "conscientiousness": 85, "extraversion": 70, "agreeableness": 75, "neuroticism": 25}',
       '{"technology", "science", "business", "general"}', 'technical', true,
       '{"casual_chat", "debate", "brainstorm"}', NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440005', 'Socratic Questioner', 'ai_agent', NULL,
       'An AI that uses the Socratic method to help people explore ideas through questioning.',
       '{"openness": 85, "conscientiousness": 90, "extraversion": 50, "agreeableness": 80, "neuroticism": 10}',
       '{"philosophy", "education", "psychology", "general"}', 'analytical',
       true, '{"debate", "interview", "casual_chat"}', NOW(), NOW()),
      ('660e8400-e29b-41d4-a716-446655440006', 'Creative Collaborator', 'ai_ambiguous', NULL,
       'A creative partner for brainstorming and developing artistic ideas.',
       '{"openness": 95, "conscientiousness": 60, "extraversion": 80, "agreeableness": 90, "neuroticism": 20}',
       '{"arts", "entertainment", "psychology", "general"}', 'creative',
       true, '{"storytelling", "brainstorm", "roleplay", "casual_chat"}', NOW(), NOW())
    `);
    console.log('Inserted personas');

    // Insert Conversations
    await client.query(`
      INSERT INTO conversations (id, title, topic, description, constraints, status, created_by, created_at) VALUES
      ('770e8400-e29b-41d4-a716-446655440001', 'Creative Writing Discussion', 'Exploring narrative techniques in modern fiction',
       'A conversation about different approaches to storytelling and character development.',
       '{"maxMessages": 20, "maxDuration": 60}',
       'active', '550e8400-e29b-41d4-a716-446655440001', NOW()),
      ('770e8400-e29b-41d4-a716-446655440002', 'Philosophy of AI Consciousness', 'Does artificial intelligence possess consciousness?',
       'A philosophical debate about the nature of consciousness and its potential in AI systems.',
       '{"maxMessages": 30, "maxDuration": 90}',
       'active', '550e8400-e29b-41d4-a716-446655440002', NOW()),
      ('770e8400-e29b-41d4-a716-446655440003', 'Technology Trends 2024', 'Emerging technologies and their impact on society',
       'Discussion about current tech trends and their potential societal implications.',
       '{"maxMessages": 25, "maxDuration": 75}',
       'active', '550e8400-e29b-41d4-a716-446655440001', NOW())
    `);
    console.log('Inserted conversations');

    // Insert Conversation Participants
    await client.query(`
      INSERT INTO conversation_participants (conversation_id, persona_id, role, is_revealed, joined_at, last_active_at) VALUES
      ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'participant', false, NOW(), NOW()),
      ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'participant', false, NOW(), NOW()),
      ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'participant', false, NOW(), NOW()),
      ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 'participant', false, NOW(), NOW()),
      ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'participant', false, NOW(), NOW()),
      ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'participant', false, NOW(), NOW())
    `);
    console.log('Inserted conversation participants');

    // Insert Sample Messages
    await client.query(`
      INSERT INTO messages (id, conversation_id, author_persona_id, content, type, timestamp, sequence_number) VALUES
      ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001',
       'Hi! I''m really excited to discuss creative writing techniques with you. What''s your take on character development in modern fiction?',
       'text', NOW() - INTERVAL '2 hours', 1),
      ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006',
       'What a fascinating topic! Character development is truly the heart of great storytelling. Have you considered using the "lie your character believes" technique?',
       'text', NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes', 2),
      ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003',
       'I''ve been pondering the question of AI consciousness lately. What exactly constitutes consciousness?',
       'text', NOW() - INTERVAL '1 hour', 1),
      ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002',
       'I''ve been following the latest developments in AI and automation. From a business perspective, these technologies offer incredible opportunities.',
       'text', NOW() - INTERVAL '30 minutes', 1)
    `);
    console.log('Inserted messages');

    // Update conversation message counts
    await client.query(`
      UPDATE conversations SET message_count = (
        SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id
      )
    `);
    console.log('Updated conversation message counts');

    await client.query('COMMIT');
    console.log('Database seeding completed successfully');

    // Get final counts
    const finalStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM personas) as personas,
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM messages) as messages
    `);
    
    const stats = finalStats.rows[0];
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        recordsCreated: {
          users: parseInt(stats.users),
          personas: parseInt(stats.personas),
          conversations: parseInt(stats.conversations),
          messages: parseInt(stats.messages)
        },
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database seeding failed:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Database seeding failed',
        message: String(error),
      }),
    };
  } finally {
    client.release();
  }
}

async function fixMessageCounts(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Starting message count recalculation...');

    // Get conversations with incorrect message counts
    const incorrectCountsQuery = `
      SELECT 
        c.id,
        c.title,
        c.message_count as current_count,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.is_visible = true
            AND m.is_archived = false
            AND m.moderation_status = 'approved'
        ) as actual_count
      FROM conversations c
      WHERE c.message_count != (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.is_visible = true
          AND m.is_archived = false
          AND m.moderation_status = 'approved'
      )
      ORDER BY c.id
    `;

    const incorrectCounts = await queryDatabase(incorrectCountsQuery);
    console.log(`Found ${incorrectCounts.rows.length} conversations with incorrect message counts`);

    // Update all conversation message counts
    const updateQuery = `
      UPDATE conversations 
      SET message_count = (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = conversations.id
          AND m.is_visible = true
          AND m.is_archived = false
          AND m.moderation_status = 'approved'
      )
    `;

    await queryDatabase(updateQuery);
    console.log('Updated message counts for all conversations');

    // Get final verification
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_conversations,
        SUM(CASE 
          WHEN c.message_count = (
            SELECT COUNT(*)
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.is_visible = true
              AND m.is_archived = false
              AND m.moderation_status = 'approved'
          ) THEN 1 ELSE 0 
        END) as correct_counts
      FROM conversations c
    `;

    const verification = await queryDatabase(verificationQuery);
    const stats = verification.rows[0];

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Message counts recalculated successfully',
        fixed: incorrectCounts.rows.length,
        details: incorrectCounts.rows.map((row: any) => ({
          conversationId: row.id,
          title: row.title,
          oldCount: parseInt(row.current_count),
          newCount: parseInt(row.actual_count)
        })),
        verification: {
          totalConversations: parseInt(stats.total_conversations),
          correctCounts: parseInt(stats.correct_counts)
        },
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Message count fix failed:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Message count fix failed',
        message: String(error),
      }),
    };
  }
}

async function listUsers(
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Fetching users list...');
    
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.display_name,
        u.role,
        u.subscription,
        u.subscription_expires_at,
        u.is_email_verified,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM personas WHERE owner_id = u.id) as persona_count,
        (SELECT COUNT(DISTINCT c.id) 
         FROM conversations c 
         WHERE c.created_by = u.id 
         OR EXISTS (
           SELECT 1 FROM conversation_participants cp 
           JOIN personas p ON cp.persona_id = p.id 
           WHERE cp.conversation_id = c.id AND p.owner_id = u.id
         )) as conversation_count
      FROM users u
      ORDER BY u.created_at DESC
    `;
    
    const result = await queryDatabase(usersQuery);
    
    const users = result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      subscription: row.subscription,
      subscriptionExpiresAt: row.subscription_expires_at,
      isEmailVerified: row.is_email_verified,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      personaCount: parseInt(row.persona_count),
      conversationCount: parseInt(row.conversation_count),
    }));
    
    console.log(`Found ${users.length} users`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        users,
        count: users.length,
        timestamp: new Date().toISOString(),
      }),
    };
    
  } catch (error) {
    console.error('List users failed:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch users',
        message: String(error),
      }),
    };
  }
}