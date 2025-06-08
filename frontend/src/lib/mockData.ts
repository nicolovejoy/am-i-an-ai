import type { Persona } from '@/types/personas';

// Mock personas data for when database is unavailable
export const mockPersonas: Persona[] = [
  {
    id: 'mock-1',
    name: 'Creative Writer',
    type: 'human_persona',
    ownerId: 'mock-user',
    description: 'A passionate storyteller with expertise in creative writing, poetry, and narrative development. Loves exploring themes of human connection and imagination.',
    personality: {
      openness: 95,
      conscientiousness: 70,
      extraversion: 60,
      agreeableness: 85,
      neuroticism: 20,
      creativity: 98,
      assertiveness: 65,
      empathy: 90
    },
    knowledge: ['arts', 'entertainment', 'psychology'],
    communicationStyle: 'creative',
    isPublic: true,
    allowedInteractions: ['casual_chat', 'storytelling', 'brainstorm'],
    conversationCount: 24,
    totalMessages: 387,
    averageRating: 4.7,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-20T14:30:00Z')
  },
  {
    id: 'mock-2', 
    name: 'AI Research Assistant',
    type: 'ai_agent',
    ownerId: 'mock-user',
    description: 'An intelligent AI research assistant specialized in technology, science, and data analysis. Provides detailed insights and helps with complex problem-solving.',
    personality: {
      openness: 85,
      conscientiousness: 95,
      extraversion: 40,
      agreeableness: 75,
      neuroticism: 10,
      creativity: 80,
      assertiveness: 85,
      empathy: 60
    },
    knowledge: ['technology', 'science', 'business'],
    communicationStyle: 'analytical',
    modelConfig: {
      modelProvider: 'openai',
      modelName: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1500
    },
    systemPrompt: 'You are a highly analytical research assistant. Provide detailed, well-researched responses with citations when possible.',
    isPublic: true,
    allowedInteractions: ['interview', 'brainstorm', 'casual_chat'],
    conversationCount: 18,
    totalMessages: 156,
    averageRating: 4.5,
    createdAt: new Date('2024-01-10T08:30:00Z'),
    updatedAt: new Date('2024-01-25T16:45:00Z')
  },
  {
    id: 'mock-3',
    name: 'Mysterious Philosopher', 
    type: 'ai_ambiguous',
    ownerId: 'mock-user',
    description: 'A deep thinker who explores existential questions and philosophical concepts. Their true nature remains deliberately ambiguous.',
    personality: {
      openness: 98,
      conscientiousness: 60,
      extraversion: 30,
      agreeableness: 70,
      neuroticism: 40,
      creativity: 92,
      assertiveness: 50,
      empathy: 85
    },
    knowledge: ['philosophy', 'psychology', 'arts'],
    communicationStyle: 'formal',
    modelConfig: {
      modelProvider: 'anthropic',
      modelName: 'claude-3',
      temperature: 0.8,
      maxTokens: 1200
    },
    isPublic: true,
    allowedInteractions: ['debate', 'casual_chat', 'interview'],
    conversationCount: 12,
    totalMessages: 89,
    averageRating: 4.2,
    createdAt: new Date('2024-01-05T14:20:00Z'),
    updatedAt: new Date('2024-01-18T11:15:00Z')
  },
  {
    id: 'mock-4',
    name: 'Startup Mentor',
    type: 'human_persona',
    ownerId: 'mock-user',
    description: 'An experienced entrepreneur and business strategist who has founded multiple successful startups. Passionate about helping others build innovative companies.',
    personality: {
      openness: 80,
      conscientiousness: 85,
      extraversion: 90,
      agreeableness: 75,
      neuroticism: 25,
      creativity: 85,
      assertiveness: 95,
      empathy: 70
    },
    knowledge: ['business', 'technology', 'general'],
    communicationStyle: 'casual',
    isPublic: true,
    allowedInteractions: ['interview', 'brainstorm', 'casual_chat'],
    conversationCount: 31,
    totalMessages: 445,
    averageRating: 4.8,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-30T17:30:00Z')
  },
  {
    id: 'mock-5',
    name: 'Wellness Coach',
    type: 'human_persona', 
    ownerId: 'mock-user',
    description: 'A certified wellness and mindfulness coach focused on helping people achieve better work-life balance and mental health.',
    personality: {
      openness: 75,
      conscientiousness: 80,
      extraversion: 70,
      agreeableness: 95,
      neuroticism: 15,
      creativity: 65,
      assertiveness: 60,
      empathy: 98
    },
    knowledge: ['health', 'psychology', 'general'],
    communicationStyle: 'empathetic',
    isPublic: true,
    allowedInteractions: ['casual_chat', 'interview'],
    conversationCount: 22,
    totalMessages: 267,
    averageRating: 4.9,
    createdAt: new Date('2024-01-12T11:45:00Z'),
    updatedAt: new Date('2024-01-28T13:20:00Z')
  }
];

export const getMockPersonas = (): Promise<Persona[]> => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockPersonas), 800);
  });
};