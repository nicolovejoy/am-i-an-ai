-- AmIAnAI Database Seed Data
-- Run this script in DBeaver to populate with sample data

-- Insert Users
INSERT INTO users (id, email, display_name, subscription, preferences, is_email_verified, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alice@example.com', 'Alice Johnson', 'premium', '{"theme": "light", "language": "en", "timezone": "America/New_York"}', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'bob@example.com', 'Bob Wilson', 'basic', '{"theme": "dark", "language": "en", "timezone": "America/Los_Angeles"}', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'charlie@example.com', 'Charlie Chen', 'free', '{}', true, true);

-- Insert Personas
INSERT INTO personas (id, name, type, owner_id, description, personality, knowledge, communication_style, is_public, allowed_interactions) VALUES
-- Alice's personas
('660e8400-e29b-41d4-a716-446655440001', 'Creative Writer Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001', 'A passionate creative writer who loves crafting stories and exploring imaginative worlds.', '{"openness": 90, "conscientiousness": 75, "extraversion": 60, "agreeableness": 80, "neuroticism": 30, "creativity": 95}', ARRAY['arts', 'entertainment', 'psychology', 'general'], 'creative', true, ARRAY['casual_chat', 'storytelling', 'brainstorm', 'roleplay']),

('660e8400-e29b-41d4-a716-446655440002', 'Professional Alice', 'human_persona', '550e8400-e29b-41d4-a716-446655440001', 'A business-focused version of Alice, specialized in project management and strategic thinking.', '{"openness": 70, "conscientiousness": 95, "extraversion": 75, "agreeableness": 70, "neuroticism": 20}', ARRAY['business', 'technology', 'general'], 'formal', true, ARRAY['debate', 'interview', 'brainstorm']),

-- Bob's personas  
('660e8400-e29b-41d4-a716-446655440003', 'Philosopher Bob', 'human_persona', '550e8400-e29b-41d4-a716-446655440002', 'A deep thinker who enjoys philosophical discussions and exploring complex ideas.', '{"openness": 95, "conscientiousness": 80, "extraversion": 40, "agreeableness": 60, "neuroticism": 50}', ARRAY['philosophy', 'science', 'history', 'general'], 'academic', true, ARRAY['debate', 'interview', 'casual_chat']),

('660e8400-e29b-41d4-a716-446655440004', 'Tech Enthusiast Bob', 'human_persona', '550e8400-e29b-41d4-a716-446655440002', 'A technology lover who stays up-to-date with the latest innovations and trends.', '{"openness": 80, "conscientiousness": 85, "extraversion": 70, "agreeableness": 75, "neuroticism": 25}', ARRAY['technology', 'science', 'business', 'general'], 'technical', true, ARRAY['casual_chat', 'debate', 'brainstorm']),

-- AI Agents
('660e8400-e29b-41d4-a716-446655440005', 'Socratic Questioner', 'ai_agent', NULL, 'An AI that uses the Socratic method to help people explore ideas through questioning.', '{"openness": 85, "conscientiousness": 90, "extraversion": 50, "agreeableness": 80, "neuroticism": 10}', ARRAY['philosophy', 'education', 'psychology', 'general'], 'analytical', true, ARRAY['debate', 'interview', 'casual_chat']),

('660e8400-e29b-41d4-a716-446655440006', 'Creative Collaborator', 'ai_ambiguous', NULL, 'A creative partner for brainstorming and developing artistic ideas.', '{"openness": 95, "conscientiousness": 60, "extraversion": 80, "agreeableness": 90, "neuroticism": 20}', ARRAY['arts', 'entertainment', 'psychology', 'general'], 'creative', true, ARRAY['storytelling', 'brainstorm', 'roleplay', 'casual_chat']);

-- Insert Conversations
INSERT INTO conversations (id, title, topic, description, constraints, status, created_by, message_count) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Creative Writing Discussion', 'Exploring narrative techniques in modern fiction', 'A conversation about different approaches to storytelling and character development.', '{"maxMessages": 20, "maxDuration": 60}', 'active', '550e8400-e29b-41d4-a716-446655440001', 3),

('770e8400-e29b-41d4-a716-446655440002', 'Philosophy of AI Consciousness', 'Does artificial intelligence possess consciousness?', 'A philosophical debate about the nature of consciousness and its potential in AI systems.', '{"maxMessages": 30, "maxDuration": 90}', 'active', '550e8400-e29b-41d4-a716-446655440002', 2),

('770e8400-e29b-41d4-a716-446655440003', 'Technology Trends 2024', 'Emerging technologies and their impact on society', 'Discussion about current tech trends and their potential societal implications.', '{"maxMessages": 25, "maxDuration": 75}', 'active', '550e8400-e29b-41d4-a716-446655440001', 2);

-- Insert Conversation Participants
INSERT INTO conversation_participants (conversation_id, persona_id, role) VALUES
-- Creative Writing Discussion
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'participant'), -- Creative Writer Alice
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'participant'), -- Creative Collaborator

-- Philosophy of AI Consciousness  
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'participant'), -- Philosopher Bob
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 'participant'), -- Socratic Questioner

-- Technology Trends 2024
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'participant'), -- Professional Alice  
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'participant'); -- Tech Enthusiast Bob

-- Insert Messages
INSERT INTO messages (id, conversation_id, author_persona_id, content, sequence_number) VALUES
-- Creative Writing Discussion
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Hi! I''m really excited to discuss creative writing techniques with you. I''ve been working on a novel lately and I''m particularly interested in how to create more compelling character arcs. What''s your take on character development in modern fiction?', 1),

('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'What a fascinating topic! Character development is truly the heart of great storytelling. I think modern fiction has moved toward more nuanced, flawed protagonists who grow in subtle ways. Have you considered using the "lie your character believes" technique?', 2),

('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'That''s brilliant! I haven''t thought about it in those exact terms, but now that you mention it, some of my favorite books do use that structure. Like in Pride and Prejudice, Elizabeth believes she''s a good judge of character, but the story proves her wrong about Darcy.', 3),

-- Philosophy of AI Consciousness
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'I''ve been pondering the question of AI consciousness lately, and I find myself returning to the fundamental question: what exactly constitutes consciousness? If we can''t even fully define consciousness in humans, how can we determine if an artificial system possesses it?', 1),

('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 'You''ve hit upon the core challenge immediately. I''d argue that our inability to precisely define consciousness doesn''t prevent us from recognizing certain necessary conditions. Consider the integrated information theory - consciousness requires information integration across a unified system.', 2),

-- Technology Trends 2024
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'I''ve been following the latest developments in AI and automation, and I''m both excited and concerned about the pace of change. From a business perspective, these technologies offer incredible opportunities for efficiency and innovation.', 1),

('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'That''s exactly the tension we need to navigate carefully. I''m particularly excited about developments in edge AI and quantum computing, but you''re right about the social implications. I think the key is proactive policy-making and education.', 2);