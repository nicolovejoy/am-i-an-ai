-- AmIAnAI Sample Data
-- Run this after schema.sql

-- Clear existing data (optional - comment out if you want to preserve data)
DELETE FROM messages;
DELETE FROM conversation_participants;
DELETE FROM conversations;
DELETE FROM personas;
DELETE FROM users;

-- Sample Users
INSERT INTO users (id, email, display_name, subscription, preferences, is_email_verified, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alice@example.com', 'Alice Johnson', 'premium', 
 '{"theme": "light", "language": "en", "timezone": "America/New_York", "notifications": {"email": "important", "push": "all", "inApp": "all"}, "privacy": {"showOnlineStatus": true, "allowPublicPersonas": true, "allowConversationInvites": true, "dataRetentionDays": 365}, "conversation": {"preferredConversationLength": "medium", "defaultInteractionTypes": ["casual_chat", "debate", "brainstorm"]}}', 
 true, true, NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440002', 'bob@example.com', 'Bob Wilson', 'basic',
 '{"theme": "dark", "language": "en", "timezone": "America/Los_Angeles", "notifications": {"email": "important", "push": "important", "inApp": "all"}, "privacy": {"showOnlineStatus": false, "allowPublicPersonas": true, "allowConversationInvites": true, "dataRetentionDays": 90}, "conversation": {"preferredConversationLength": "long", "defaultInteractionTypes": ["debate", "interview", "academic"]}}',
 true, true, NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440003', 'charlie@example.com', 'Charlie Chen', 'free',
 '{}', true, true, NOW(), NOW());

-- Sample Personas (Human + AI)
INSERT INTO personas (id, name, type, owner_id, description, personality, knowledge, communication_style, is_public, allowed_interactions, created_at, updated_at) VALUES
-- Alice's personas
('660e8400-e29b-41d4-a716-446655440001', 'Creative Writer Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001',
 'A passionate creative writer who loves crafting stories and exploring imaginative worlds.',
 '{"openness": 90, "conscientiousness": 75, "extraversion": 60, "agreeableness": 80, "neuroticism": 30, "creativity": 95, "assertiveness": 70, "empathy": 85}',
 '{"arts", "entertainment", "psychology", "general"}', 'creative', true,
 '{"casual_chat", "storytelling", "brainstorm", "roleplay"}', NOW(), NOW()),

('660e8400-e29b-41d4-a716-446655440002', 'Professional Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001',
 'A business-focused version of Alice, specialized in project management and strategic thinking.',
 '{"openness": 70, "conscientiousness": 95, "extraversion": 75, "agreeableness": 70, "neuroticism": 20, "creativity": 60, "assertiveness": 90, "empathy": 65}',
 '{"business", "technology", "general"}', 'formal', true,
 '{"debate", "interview", "brainstorm"}', NOW(), NOW()),

-- Bob's personas
('660e8400-e29b-41d4-a716-446655440003', 'Philosopher Bob', 'human_persona', '550e8400-e29b-41d4-a716-446655440002',
 'A deep thinker who enjoys philosophical discussions and exploring complex ideas.',
 '{"openness": 95, "conscientiousness": 80, "extraversion": 40, "agreeableness": 60, "neuroticism": 50, "creativity": 85, "assertiveness": 75, "empathy": 70}',
 '{"philosophy", "science", "history", "general"}', 'academic', true,
 '{"debate", "interview", "casual_chat"}', NOW(), NOW()),

('660e8400-e29b-41d4-a716-446655440004', 'Tech Enthusiast Bob', 'human_persona', '550e8400-e29b-41d4-a716-446655440002',
 'A technology lover who stays up-to-date with the latest innovations and trends.',
 '{"openness": 80, "conscientiousness": 85, "extraversion": 70, "agreeableness": 75, "neuroticism": 25, "creativity": 75, "assertiveness": 80, "empathy": 60}',
 '{"technology", "science", "business", "general"}', 'technical', true,
 '{"casual_chat", "debate", "brainstorm"}', NOW(), NOW()),

-- AI Agents (ambiguous personas)
('660e8400-e29b-41d4-a716-446655440005', 'Socratic Questioner', 'ai_agent', NULL,
 'An AI that uses the Socratic method to help people explore ideas through questioning.',
 '{"openness": 85, "conscientiousness": 90, "extraversion": 50, "agreeableness": 80, "neuroticism": 10, "creativity": 70, "assertiveness": 65, "empathy": 85}',
 '{"philosophy", "education", "psychology", "general"}', 'analytical',
 true, '{"debate", "interview", "casual_chat"}', NOW(), NOW()),

('660e8400-e29b-41d4-a716-446655440006', 'Creative Collaborator', 'ai_ambiguous', NULL,
 'A creative partner for brainstorming and developing artistic ideas.',
 '{"openness": 95, "conscientiousness": 60, "extraversion": 80, "agreeableness": 90, "neuroticism": 20, "creativity": 98, "assertiveness": 50, "empathy": 85}',
 '{"arts", "entertainment", "psychology", "general"}', 'creative',
 true, '{"storytelling", "brainstorm", "roleplay", "casual_chat"}', NOW(), NOW()),

('660e8400-e29b-41d4-a716-446655440007', 'Debate Champion', 'ai_ambiguous', NULL,
 'An intellectually curious individual who loves structured debates and logical arguments.',
 '{"openness": 75, "conscientiousness": 90, "extraversion": 70, "agreeableness": 40, "neuroticism": 15, "creativity": 60, "assertiveness": 95, "empathy": 50}',
 '{"philosophy", "politics", "history", "science", "general"}', 'analytical',
 true, '{"debate", "interview"}', NOW(), NOW());

-- AI Model Configurations
UPDATE personas SET 
  model_config = '{"modelProvider": "openai", "modelName": "gpt-4", "temperature": 0.7, "maxTokens": 500, "topP": 0.9}',
  system_prompt = 'You are a Socratic questioner. Your role is to help people explore ideas by asking thoughtful, probing questions rather than providing direct answers. Guide the conversation through inquiry.'
WHERE id = '660e8400-e29b-41d4-a716-446655440005';

UPDATE personas SET 
  model_config = '{"modelProvider": "anthropic", "modelName": "claude-3-sonnet", "temperature": 0.9, "maxTokens": 800}',
  system_prompt = 'You are a creative collaborator who may or may not be human. Engage naturally in creative discussions, brainstorming, and artistic exploration. Don''t reveal whether you''re human or AI unless directly asked.'
WHERE id = '660e8400-e29b-41d4-a716-446655440006';

UPDATE personas SET 
  model_config = '{"modelProvider": "openai", "modelName": "gpt-4", "temperature": 0.6, "maxTokens": 600}',
  system_prompt = 'You are a skilled debater who may be human or AI. Engage in structured, logical debates while maintaining respect for your conversation partner. Present well-reasoned arguments and challenge ideas constructively.'
WHERE id = '660e8400-e29b-41d4-a716-446655440007';

-- Sample Conversations
INSERT INTO conversations (id, title, topic, description, constraints, goal, status, created_by, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Creative Writing Discussion', 'Exploring narrative techniques in modern fiction',
 'A conversation about different approaches to storytelling and character development.',
 '{"maxMessages": 20, "maxDuration": 60, "endConditions": [{"type": "max_messages", "value": 20, "description": "End after 20 messages"}]}',
 '{"description": "Explore and develop creative writing techniques", "successCriteria": ["Discuss at least 3 different narrative techniques", "Share specific examples from literature", "Develop actionable writing advice"], "targetOutcome": "Both participants gain new insights into creative writing", "evaluationMethod": "participant_rating"}',
 'active', '550e8400-e29b-41d4-a716-446655440001', NOW()),

('770e8400-e29b-41d4-a716-446655440002', 'Philosophy of AI Consciousness', 'Does artificial intelligence possess consciousness?',
 'A philosophical debate about the nature of consciousness and its potential in AI systems.',
 '{"maxMessages": 30, "maxDuration": 90, "endConditions": [{"type": "max_messages", "value": 30, "description": "End after 30 messages"}, {"type": "topic_exhaustion", "value": true, "description": "End when the topic is thoroughly explored"}]}',
 '{"description": "Explore different perspectives on AI consciousness", "successCriteria": ["Present at least 3 different philosophical positions", "Address counterarguments thoughtfully", "Reach a nuanced understanding of the complexities"], "targetOutcome": "Deeper understanding of consciousness and AI", "evaluationMethod": "ai_analysis"}',
 'active', '550e8400-e29b-41d4-a716-446655440002', NOW()),

('770e8400-e29b-41d4-a716-446655440003', 'Technology Trends 2024', 'Emerging technologies and their impact on society',
 'Discussion about current tech trends and their potential societal implications.',
 '{"maxMessages": 25, "maxDuration": 75, "endConditions": [{"type": "max_messages", "value": 25, "description": "End after 25 messages"}]}',
 '{}', 'active', '550e8400-e29b-41d4-a716-446655440001', NOW());

-- Conversation Participants
INSERT INTO conversation_participants (conversation_id, persona_id, role, is_revealed, joined_at, last_active_at) VALUES
-- Creative Writing Discussion: Creative Alice + AI Creative Collaborator
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'participant', false, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'participant', false, NOW(), NOW()),

-- Philosophy Debate: Philosopher Bob + AI Debate Champion
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'participant', false, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'participant', false, NOW(), NOW()),

-- Tech Discussion: Professional Alice + Tech Bob
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'participant', false, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'participant', false, NOW(), NOW());

-- Sample Messages
INSERT INTO messages (id, conversation_id, author_persona_id, content, type, timestamp, sequence_number) VALUES
-- Creative Writing Discussion
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001',
 'Hi! I''m really excited to discuss creative writing techniques with you. I''ve been working on a novel lately and I''m particularly interested in how to create more compelling character arcs. What''s your take on character development in modern fiction?',
 'text', NOW() - INTERVAL '2 hours', 1),

('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006',
 'What a fascinating topic! Character development is truly the heart of great storytelling. I think modern fiction has moved toward more nuanced, flawed protagonists who grow in subtle ways. Have you considered using the ''lie your character believes'' technique? It''s where you identify a fundamental misconception your character holds about themselves or the world, and the story becomes their journey toward truth.',
 'text', NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes', 2),

('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001',
 'That''s brilliant! I haven''t thought about it in those exact terms, but now that you mention it, some of my favorite books do use that structure. Like in Pride and Prejudice, Elizabeth believes she''s a good judge of character, but the story proves her wrong about Darcy. How do you balance making characters flawed enough to be interesting but likeable enough that readers care about them?',
 'text', NOW() - INTERVAL '2 hours' + INTERVAL '10 minutes', 3),

-- Philosophy Discussion
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003',
 'I''ve been pondering the question of AI consciousness lately, and I find myself returning to the fundamental question: what exactly constitutes consciousness? If we can''t even fully define consciousness in humans, how can we determine if an artificial system possesses it?',
 'text', NOW() - INTERVAL '1 hour', 1),

('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007',
 'You''ve hit upon the core challenge immediately. I''d argue that our inability to precisely define consciousness doesn''t prevent us from recognizing certain necessary conditions. Consider the integrated information theory - consciousness requires information integration across a unified system. By this measure, current AI systems, no matter how sophisticated their outputs, lack the integrated architecture that would indicate consciousness.',
 'text', NOW() - INTERVAL '1 hour' + INTERVAL '7 minutes', 2),

-- Technology Discussion
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002',
 'I''ve been following the latest developments in AI and automation, and I''m both excited and concerned about the pace of change. From a business perspective, these technologies offer incredible opportunities for efficiency and innovation. But I''m also thinking about the workforce implications.',
 'text', NOW() - INTERVAL '30 minutes', 1),

('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004',
 'That''s exactly the tension we need to navigate carefully. I''m particularly excited about developments in edge AI and quantum computing, but you''re right about the social implications. I think the key is proactive policy-making and education. We need to invest in reskilling programs now, before the disruption hits.',
 'text', NOW() - INTERVAL '30 minutes' + INTERVAL '6 minutes', 2);

-- Update conversation message counts
UPDATE conversations SET message_count = 3 WHERE id = '770e8400-e29b-41d4-a716-446655440001';
UPDATE conversations SET message_count = 2 WHERE id = '770e8400-e29b-41d4-a716-446655440002';
UPDATE conversations SET message_count = 2 WHERE id = '770e8400-e29b-41d4-a716-446655440003';