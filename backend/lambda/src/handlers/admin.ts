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
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'personas', 'conversations', 'messages')
    `;
    
    const tablesResult = await queryDatabase(tablesQuery);
    const existingTables = tablesResult.rows.map((row: any) => row.table_name);
    
    console.log('Database setup check completed. Existing tables:', existingTables);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Database schema verified',
        existingTables,
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

    // Clear existing data in correct order (respecting foreign keys)
    console.log('Clearing existing data...');
    
    // Check what exists before deletion
    const beforeStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM messages) as messages,
        (SELECT COUNT(*) FROM conversation_participants) as participants,
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM personas) as personas,
        (SELECT COUNT(*) FROM users) as users
    `);
    console.log('Before deletion:', beforeStats.rows[0]);
    
    // Delete with CASCADE to handle foreign keys
    const messagesResult = await client.query('DELETE FROM messages');
    console.log(`Deleted ${messagesResult.rowCount} messages`);
    
    const participantsResult = await client.query('DELETE FROM conversation_participants');
    console.log(`Deleted ${participantsResult.rowCount} conversation participants`);
    
    const conversationsResult = await client.query('DELETE FROM conversations');
    console.log(`Deleted ${conversationsResult.rowCount} conversations`);
    
    const personasResult = await client.query('DELETE FROM personas');
    console.log(`Deleted ${personasResult.rowCount} personas`);
    
    const usersResult = await client.query('DELETE FROM users');
    console.log(`Deleted ${usersResult.rowCount} users`);
    
    // Verify deletion worked
    const afterStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM messages) as messages,
        (SELECT COUNT(*) FROM conversation_participants) as participants,
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM personas) as personas,
        (SELECT COUNT(*) FROM users) as users
    `);
    console.log('After deletion:', afterStats.rows[0]);
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