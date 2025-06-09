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
    console.log('🌱 Seeding database with sample data...');
    const db = await getDatabase();

    // Clear existing data
    await db.execute('DELETE FROM messages');
    await db.execute('DELETE FROM conversation_participants');
    await db.execute('DELETE FROM conversations');
    await db.execute('DELETE FROM personas');
    await db.execute('DELETE FROM users');

    // Insert sample users
    await db.execute(`
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

    // Insert sample personas
    await db.execute(`
      INSERT INTO personas (id, name, type, owner_id, description, personality, knowledge, communication_style, is_public, allowed_interactions, created_at, updated_at) VALUES
      ('660e8400-e29b-41d4-a716-446655440001', 'Creative Writer Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001',
       'A passionate creative writer who loves crafting stories and exploring imaginative worlds.',
       '{"openness": 90, "conscientiousness": 75, "extraversion": 60, "agreeableness": 80, "neuroticism": 30}',
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

      ('660e8400-e29b-41d4-a716-446655440006', 'Creative Collaborator', 'ai_ambiguous', NULL,
       'A creative partner for brainstorming and developing artistic ideas.',
       '{"openness": 95, "conscientiousness": 60, "extraversion": 80, "agreeableness": 90, "neuroticism": 20}',
       '{"arts", "entertainment", "psychology", "general"}', 'creative',
       true, '{"storytelling", "brainstorm", "roleplay", "casual_chat"}', NOW(), NOW())
    `);

    // Update AI persona with model config
    await db.execute(`
      UPDATE personas SET 
        model_config = '{"modelProvider": "anthropic", "modelName": "claude-3-sonnet", "temperature": 0.9, "maxTokens": 800}',
        system_prompt = 'You are a creative collaborator who may or may not be human. Engage naturally in creative discussions, brainstorming, and artistic exploration.'
      WHERE id = '660e8400-e29b-41d4-a716-446655440006'
    `);

    // Insert sample conversation
    await db.execute(`
      INSERT INTO conversations (id, title, topic, description, status, created_by, created_at) VALUES
      ('770e8400-e29b-41d4-a716-446655440001', 'Creative Writing Discussion', 'Exploring narrative techniques in modern fiction',
       'A conversation about different approaches to storytelling and character development.',
       'active', '550e8400-e29b-41d4-a716-446655440001', NOW())
    `);

    // Insert conversation participants
    await db.execute(`
      INSERT INTO conversation_participants (conversation_id, persona_id, role, is_revealed, joined_at, last_active_at) VALUES
      ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'participant', false, NOW(), NOW()),
      ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'participant', false, NOW(), NOW())
    `);

    // Insert sample messages
    await db.execute(`
      INSERT INTO messages (id, conversation_id, author_persona_id, content, type, timestamp, sequence_number) VALUES
      ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001',
       'Hi! I''m excited to discuss creative writing techniques. I''ve been working on a novel and I''m particularly interested in character development. What''s your take on creating compelling character arcs?',
       'text', NOW() - INTERVAL ''2 hours'', 1),

      ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006',
       'What a fascinating topic! Character development is truly the heart of great storytelling. I think modern fiction has moved toward more nuanced, flawed protagonists who grow in subtle ways. Have you considered using the "lie your character believes" technique?',
       'text', NOW() - INTERVAL ''2 hours'' + INTERVAL ''5 minutes'', 2),

      ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001',
       'That''s brilliant! I haven''t thought about it in those exact terms. Like in Pride and Prejudice, Elizabeth believes she''s a good judge of character, but the story proves her wrong about Darcy. How do you balance making characters flawed but likeable?',
       'text', NOW() - INTERVAL ''2 hours'' + INTERVAL ''10 minutes'', 3)
    `);

    // Update conversation message count
    await db.execute(`UPDATE conversations SET message_count = 3 WHERE id = '770e8400-e29b-41d4-a716-446655440001'`);

    console.log('✅ Database seeded successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded with sample data',
      data: {
        users: 3,
        personas: 4,
        conversations: 1,
        messages: 3
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return NextResponse.json(
      { 
        error: 'Database seeding failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}