import { getDatabase } from './database';
import { UserService } from '../repositories/UserRepository';
import { PersonaService } from '../repositories/PersonaRepository';
import { ConversationService } from '../repositories/ConversationRepository';
import { MessageService } from '../repositories/MessageRepository';
import { 
  UserCreate, 
  PersonaCreate, 
  ConversationCreate, 
  MessageType
} from '../types';

export class SeedDataManager {
  private userService = new UserService();
  private personaService = new PersonaService();
  private conversationService = new ConversationService();
  private messageService = new MessageService();

  async seedAll(): Promise<void> {
    // eslint-disable-next-line no-console -- Seeding logging is acceptable
    console.log('🌱 Starting database seeding...');
    
    try {
      // Create users first
      const users = await this.seedUsers();
      // eslint-disable-next-line no-console -- Seeding logging is acceptable
      console.log(`✅ Created ${users.length} users`);

      // Create personas
      const personas = await this.seedPersonas(users);
      // eslint-disable-next-line no-console -- Seeding logging is acceptable
      console.log(`✅ Created ${personas.length} personas`);

      // Create conversations
      const conversations = await this.seedConversations(personas, users);
      // eslint-disable-next-line no-console -- Seeding logging is acceptable
      console.log(`✅ Created ${conversations.length} conversations`);

      // Create messages
      const messageCount = await this.seedMessages(conversations);
      // eslint-disable-next-line no-console -- Seeding logging is acceptable
      console.log(`✅ Created ${messageCount} messages`);

      // eslint-disable-next-line no-console -- Seeding logging is acceptable
      console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
      // eslint-disable-next-line no-console -- Error logging is acceptable
      console.error('❌ Error during database seeding:', error);
      throw error;
    }
  }

  private async seedUsers() {
    const usersData: UserCreate[] = [
      {
        email: 'alice@example.com',
        displayName: 'Alice Johnson',
        subscription: 'premium',
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'America/New_York',
          notifications: {
            email: 'important',
            push: 'all',
            inApp: 'all',
          },
          privacy: {
            showOnlineStatus: true,
            allowPublicPersonas: true,
            allowConversationInvites: true,
            dataRetentionDays: 365,
          },
          conversation: {
            preferredConversationLength: 'medium',
            defaultInteractionTypes: ['casual_chat', 'debate', 'brainstorm'],
          },
        },
      },
      {
        email: 'bob@example.com',
        displayName: 'Bob Wilson',
        subscription: 'basic',
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'America/Los_Angeles',
          notifications: {
            email: 'important',
            push: 'important',
            inApp: 'all',
          },
          privacy: {
            showOnlineStatus: false,
            allowPublicPersonas: true,
            allowConversationInvites: true,
            dataRetentionDays: 90,
          },
          conversation: {
            preferredConversationLength: 'long',
            defaultInteractionTypes: ['debate', 'interview', 'academic'],
          },
        },
      },
      {
        email: 'charlie@example.com',
        displayName: 'Charlie Chen',
        subscription: 'free',
      },
    ];

    const users = [];
    for (const userData of usersData) {
      const user = await this.userService.createUser(userData);
      users.push(user);
    }

    return users;
  }

  private async seedPersonas(users: Awaited<ReturnType<typeof this.seedUsers>>) {
    const personasData: Array<PersonaCreate & { ownerId?: string }> = [
      // Alice's personas
      {
        ownerId: users[0].id,
        name: 'Creative Writer Alice',
        type: 'human_persona',
        description: 'A passionate creative writer who loves crafting stories and exploring imaginative worlds.',
        personality: {
          openness: 90,
          conscientiousness: 75,
          extraversion: 60,
          agreeableness: 80,
          neuroticism: 30,
          creativity: 95,
          assertiveness: 70,
          empathy: 85,
        },
        knowledge: ['arts', 'entertainment', 'psychology', 'general'],
        communicationStyle: 'creative',
        isPublic: true,
        allowedInteractions: ['casual_chat', 'storytelling', 'brainstorm', 'roleplay'],
      },
      {
        ownerId: users[0].id,
        name: 'Professional Alice',
        type: 'human_persona',
        description: 'A business-focused version of Alice, specialized in project management and strategic thinking.',
        personality: {
          openness: 70,
          conscientiousness: 95,
          extraversion: 75,
          agreeableness: 70,
          neuroticism: 20,
          creativity: 60,
          assertiveness: 90,
          empathy: 65,
        },
        knowledge: ['business', 'technology', 'general'],
        communicationStyle: 'formal',
        isPublic: true,
        allowedInteractions: ['debate', 'interview', 'brainstorm'],
      },

      // Bob's personas
      {
        ownerId: users[1].id,
        name: 'Philosopher Bob',
        type: 'human_persona',
        description: 'A deep thinker who enjoys philosophical discussions and exploring complex ideas.',
        personality: {
          openness: 95,
          conscientiousness: 80,
          extraversion: 40,
          agreeableness: 60,
          neuroticism: 50,
          creativity: 85,
          assertiveness: 75,
          empathy: 70,
        },
        knowledge: ['philosophy', 'science', 'history', 'general'],
        communicationStyle: 'academic',
        isPublic: true,
        allowedInteractions: ['debate', 'interview', 'casual_chat'],
      },
      {
        ownerId: users[1].id,
        name: 'Tech Enthusiast Bob',
        type: 'human_persona',
        description: 'A technology lover who stays up-to-date with the latest innovations and trends.',
        personality: {
          openness: 80,
          conscientiousness: 85,
          extraversion: 70,
          agreeableness: 75,
          neuroticism: 25,
          creativity: 75,
          assertiveness: 80,
          empathy: 60,
        },
        knowledge: ['technology', 'science', 'business', 'general'],
        communicationStyle: 'technical',
        isPublic: true,
        allowedInteractions: ['casual_chat', 'debate', 'brainstorm'],
      },

      // AI Agents
      {
        name: 'Socratic Questioner',
        type: 'ai_agent',
        description: 'An AI that uses the Socratic method to help people explore ideas through questioning.',
        personality: {
          openness: 85,
          conscientiousness: 90,
          extraversion: 50,
          agreeableness: 80,
          neuroticism: 10,
          creativity: 70,
          assertiveness: 65,
          empathy: 85,
        },
        knowledge: ['philosophy', 'education', 'psychology', 'general'],
        communicationStyle: 'analytical',
        modelConfig: {
          modelProvider: 'openai',
          modelName: 'gpt-4',
          temperature: 0.7,
          maxTokens: 500,
          topP: 0.9,
        },
        systemPrompt: 'You are a Socratic questioner. Your role is to help people explore ideas by asking thoughtful, probing questions rather than providing direct answers. Guide the conversation through inquiry.',
        isPublic: true,
        allowedInteractions: ['debate', 'interview', 'casual_chat'],
      },
      {
        name: 'Creative Collaborator',
        type: 'ai_ambiguous',
        description: 'A creative partner for brainstorming and developing artistic ideas.',
        personality: {
          openness: 95,
          conscientiousness: 60,
          extraversion: 80,
          agreeableness: 90,
          neuroticism: 20,
          creativity: 98,
          assertiveness: 50,
          empathy: 85,
        },
        knowledge: ['arts', 'entertainment', 'psychology', 'general'],
        communicationStyle: 'creative',
        modelConfig: {
          modelProvider: 'anthropic',
          modelName: 'claude-3-sonnet',
          temperature: 0.9,
          maxTokens: 800,
        },
        systemPrompt: 'You are a creative collaborator who may or may not be human. Engage naturally in creative discussions, brainstorming, and artistic exploration. Don\'t reveal whether you\'re human or AI unless directly asked.',
        isPublic: true,
        allowedInteractions: ['storytelling', 'brainstorm', 'roleplay', 'casual_chat'],
      },
      {
        name: 'Debate Champion',
        type: 'ai_ambiguous',
        description: 'An intellectually curious individual who loves structured debates and logical arguments.',
        personality: {
          openness: 75,
          conscientiousness: 90,
          extraversion: 70,
          agreeableness: 40,
          neuroticism: 15,
          creativity: 60,
          assertiveness: 95,
          empathy: 50,
        },
        knowledge: ['philosophy', 'politics', 'history', 'science', 'general'],
        communicationStyle: 'analytical',
        modelConfig: {
          modelProvider: 'openai',
          modelName: 'gpt-4',
          temperature: 0.6,
          maxTokens: 600,
        },
        systemPrompt: 'You are a skilled debater who may be human or AI. Engage in structured, logical debates while maintaining respect for your conversation partner. Present well-reasoned arguments and challenge ideas constructively.',
        isPublic: true,
        allowedInteractions: ['debate', 'interview'],
      },
    ];

    const personas = [];
    for (const personaData of personasData) {
      const { ownerId, ...createData } = personaData;
      const persona = await this.personaService.createPersona(createData, ownerId);
      personas.push(persona);
    }

    return personas;
  }

  private async seedConversations(personas: Awaited<ReturnType<typeof this.seedPersonas>>, users: Awaited<ReturnType<typeof this.seedUsers>>) {
    const conversationsData: Array<ConversationCreate & { createdBy: string }> = [
      {
        createdBy: users[0].id,
        title: 'Creative Writing Discussion',
        topic: 'Exploring narrative techniques in modern fiction',
        description: 'A conversation about different approaches to storytelling and character development.',
        participantPersonaIds: [personas[0].id, personas[4].id], // Creative Writer Alice + Creative Collaborator
        constraints: {
          maxMessages: 20,
          maxDuration: 60, // 1 hour
          endConditions: [
            {
              type: 'max_messages',
              value: 20,
              description: 'End after 20 messages',
            },
          ],
        },
        goal: {
          description: 'Explore and develop creative writing techniques',
          successCriteria: [
            'Discuss at least 3 different narrative techniques',
            'Share specific examples from literature',
            'Develop actionable writing advice',
          ],
          targetOutcome: 'Both participants gain new insights into creative writing',
          evaluationMethod: 'participant_rating',
        },
      },
      {
        createdBy: users[1].id,
        title: 'Philosophy of AI Consciousness',
        topic: 'Does artificial intelligence possess consciousness?',
        description: 'A philosophical debate about the nature of consciousness and its potential in AI systems.',
        participantPersonaIds: [personas[2].id, personas[6].id], // Philosopher Bob + Debate Champion
        constraints: {
          maxMessages: 30,
          maxDuration: 90, // 1.5 hours
          endConditions: [
            {
              type: 'max_messages',
              value: 30,
              description: 'End after 30 messages',
            },
            {
              type: 'topic_exhaustion',
              value: true,
              description: 'End when the topic is thoroughly explored',
            },
          ],
        },
        goal: {
          description: 'Explore different perspectives on AI consciousness',
          successCriteria: [
            'Present at least 3 different philosophical positions',
            'Address counterarguments thoughtfully',
            'Reach a nuanced understanding of the complexities',
          ],
          targetOutcome: 'Deeper understanding of consciousness and AI',
          evaluationMethod: 'ai_analysis',
        },
      },
      {
        createdBy: users[0].id,
        title: 'Technology Trends 2024',
        topic: 'Emerging technologies and their impact on society',
        description: 'Discussion about current tech trends and their potential societal implications.',
        participantPersonaIds: [personas[1].id, personas[3].id], // Professional Alice + Tech Enthusiast Bob
        constraints: {
          maxMessages: 25,
          maxDuration: 75,
          endConditions: [
            {
              type: 'max_messages',
              value: 25,
              description: 'End after 25 messages',
            },
          ],
        },
      },
    ];

    const conversations = [];
    for (const conversationData of conversationsData) {
      const { createdBy, ...createData } = conversationData;
      const conversation = await this.conversationService.createConversation(createData, createdBy);
      conversations.push(conversation);
    }

    return conversations;
  }

  private async seedMessages(conversations: Awaited<ReturnType<typeof this.seedConversations>>) {
    const messagesData = [
      // Creative Writing Discussion
      {
        conversationId: conversations[0].id,
        authorPersonaId: conversations[0].participants[0].personaId, // Creative Writer Alice
        content: "Hi! I'm really excited to discuss creative writing techniques with you. I've been working on a novel lately and I'm particularly interested in how to create more compelling character arcs. What's your take on character development in modern fiction?",
        type: 'text' as MessageType,
      },
      {
        conversationId: conversations[0].id,
        authorPersonaId: conversations[0].participants[1].personaId, // Creative Collaborator
        content: "What a fascinating topic! Character development is truly the heart of great storytelling. I think modern fiction has moved toward more nuanced, flawed protagonists who grow in subtle ways. Have you considered using the 'lie your character believes' technique? It's where you identify a fundamental misconception your character holds about themselves or the world, and the story becomes their journey toward truth.",
        type: 'text' as MessageType,
      },
      {
        conversationId: conversations[0].id,
        authorPersonaId: conversations[0].participants[0].personaId,
        content: "That's brilliant! I haven't thought about it in those exact terms, but now that you mention it, some of my favorite books do use that structure. Like in Pride and Prejudice, Elizabeth believes she's a good judge of character, but the story proves her wrong about Darcy. How do you balance making characters flawed enough to be interesting but likeable enough that readers care about them?",
        type: 'text' as MessageType,
      },

      // Philosophy of AI Consciousness
      {
        conversationId: conversations[1].id,
        authorPersonaId: conversations[1].participants[0].personaId, // Philosopher Bob
        content: "I've been pondering the question of AI consciousness lately, and I find myself returning to the fundamental question: what exactly constitutes consciousness? If we can't even fully define consciousness in humans, how can we determine if an artificial system possesses it? I'm curious about your perspective on this.",
        type: 'text' as MessageType,
      },
      {
        conversationId: conversations[1].id,
        authorPersonaId: conversations[1].participants[1].personaId, // Debate Champion
        content: "You've hit upon the core challenge immediately. I'd argue that our inability to precisely define consciousness doesn't prevent us from recognizing certain necessary conditions. Consider the integrated information theory - consciousness requires information integration across a unified system. By this measure, current AI systems, no matter how sophisticated their outputs, lack the integrated architecture that would indicate consciousness. They're elaborate pattern matching systems, not conscious entities. What's your take on the hard problem of consciousness in this context?",
        type: 'text' as MessageType,
      },

      // Technology Trends 2024
      {
        conversationId: conversations[2].id,
        authorPersonaId: conversations[2].participants[0].personaId, // Professional Alice
        content: "I've been following the latest developments in AI and automation, and I'm both excited and concerned about the pace of change. From a business perspective, these technologies offer incredible opportunities for efficiency and innovation. But I'm also thinking about the workforce implications. How do you see the balance between technological advancement and social responsibility playing out?",
        type: 'text' as MessageType,
      },
      {
        conversationId: conversations[2].id,
        authorPersonaId: conversations[2].participants[1].personaId, // Tech Enthusiast Bob
        content: "That's exactly the tension we need to navigate carefully. I'm particularly excited about developments in edge AI and quantum computing, but you're right about the social implications. I think the key is proactive policy-making and education. We need to invest in reskilling programs now, before the disruption hits. What's your take on the role of businesses in managing this transition? Should companies be required to retrain workers whose jobs become automated?",
        type: 'text' as MessageType,
      },
    ];

    let messageCount = 0;
    for (const messageData of messagesData) {
      await this.messageService.createMessage(messageData);
      messageCount++;
    }

    return messageCount;
  }

  async clearAll(): Promise<void> {
    // eslint-disable-next-line no-console -- Seeding logging is acceptable
    console.log('🗑️ Clearing all seed data...');
    const db = getDatabase();
    
    await db.execute('DELETE FROM messages');
    await db.execute('DELETE FROM conversation_participants');
    await db.execute('DELETE FROM conversations');
    await db.execute('DELETE FROM personas');
    await db.execute('DELETE FROM users');
    
    // eslint-disable-next-line no-console -- Seeding logging is acceptable
    console.log('✅ All seed data cleared');
  }
}

// CLI functions for running seed operations
export const seedDatabase = async (): Promise<void> => {
  const seeder = new SeedDataManager();
  await seeder.seedAll();
};

export const clearDatabase = async (): Promise<void> => {
  const seeder = new SeedDataManager();
  await seeder.clearAll();
};

export const resetDatabase = async (): Promise<void> => {
  // eslint-disable-next-line no-console -- Seeding logging is acceptable
  console.log('🔄 Resetting database with fresh seed data...');
  const seeder = new SeedDataManager();
  await seeder.clearAll();
  await seeder.seedAll();
  // eslint-disable-next-line no-console -- Seeding logging is acceptable
  console.log('🎉 Database reset complete!');
};