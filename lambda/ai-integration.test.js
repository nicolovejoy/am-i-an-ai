// AI Integration Tests for amianai v2
// These tests define the expected behavior for OpenAI integration

const { 
  generateAIResponse, 
  getAIPersonality, 
  shouldAIRespond, 
  calculateResponseDelay,
  buildConversationContext,
  initializeAIParticipants 
} = require('./ai-integration');

describe('OpenAI Integration', () => {
  
  describe('AI Response Generation', () => {
    test('should generate response for AI participant', async () => {
      const context = {
        messages: [
          { sender: 'A', content: 'Hello everyone!', timestamp: Date.now() }
        ],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const response = await generateAIResponse(context);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(5);
      expect(response.length).toBeLessThan(200); // Keep responses conversational
    });

    test('should include conversation context in AI responses', async () => {
      const context = {
        messages: [
          { sender: 'A', content: 'What do you think about climate change?', timestamp: Date.now() - 5000 },
          { sender: 'C', content: 'I think it\'s a serious issue we need to address.', timestamp: Date.now() - 3000 }
        ],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const response = await generateAIResponse(context);
      
      // Response should be contextually relevant
      expect(response.toLowerCase()).toMatch(/climate|environment|issue|agree|disagree/);
    });

    test('should fail gracefully with invalid OpenAI API key', async () => {
      // Mock invalid API key scenario
      process.env.OPENAI_API_KEY = 'invalid-key';
      
      const context = {
        messages: [{ sender: 'A', content: 'Hello!', timestamp: Date.now() }],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const response = await generateAIResponse(context);
      
      // Should return fallback response
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('AI Personality System', () => {
    test('should return distinct personality for production mode AI participants', () => {
      const personalityB = getAIPersonality('B', 'production');
      const personalityC = getAIPersonality('C', 'production');
      
      expect(personalityB).toBeDefined();
      expect(personalityC).toBeDefined();
      expect(personalityB.name).not.toBe(personalityC.name);
      expect(personalityB.traits).not.toEqual(personalityC.traits);
    });

    test('should return appropriate personality for testing mode', () => {
      const personalityB = getAIPersonality('B', 'testing');
      const personalityC = getAIPersonality('C', 'testing');
      const personalityD = getAIPersonality('D', 'testing');
      
      expect(personalityB).toBeDefined();
      expect(personalityC).toBeDefined();
      expect(personalityD).toBeDefined();
      
      // All should be distinct
      const personalities = [personalityB, personalityC, personalityD];
      const names = personalities.map(p => p.name);
      expect(new Set(names).size).toBe(3); // All unique
    });

    test('should include personality traits in AI responses', async () => {
      const personality = getAIPersonality('B', 'production');
      
      const context = {
        messages: [{ sender: 'A', content: 'What\'s your favorite hobby?', timestamp: Date.now() }],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const response = await generateAIResponse(context);
      
      // Response should reflect personality traits
      expect(response).toBeDefined();
      // This will depend on the specific personality implementation
    });
  });

  describe('Response Timing', () => {
    test('should determine when AI should respond', () => {
      const recentMessages = [
        { sender: 'A', content: 'Hello!', timestamp: Date.now() - 2000 },
        { sender: 'B', content: 'Hi there!', timestamp: Date.now() - 1000 }
      ];
      
      const shouldRespond = shouldAIRespond('C', recentMessages, 'production');
      expect(typeof shouldRespond).toBe('boolean');
    });

    test('should calculate appropriate response delay', () => {
      const messages = [
        { sender: 'A', content: 'Quick question for everyone', timestamp: Date.now() - 1000 }
      ];
      
      const delay = calculateResponseDelay('B', messages);
      
      expect(delay).toBeGreaterThanOrEqual(2000); // At least 2 seconds
      expect(delay).toBeLessThanOrEqual(8000);    // At most 8 seconds
    });

    test('should vary response delay based on message complexity', () => {
      const shortMessage = [
        { sender: 'A', content: 'Yes', timestamp: Date.now() }
      ];
      
      const longMessage = [
        { sender: 'A', content: 'I\'ve been thinking about this complex philosophical question about the nature of consciousness and whether artificial intelligence can truly understand human emotions or if it\'s just sophisticated pattern matching...', timestamp: Date.now() }
      ];
      
      const shortDelay = calculateResponseDelay('B', shortMessage);
      const longDelay = calculateResponseDelay('B', longMessage);
      
      expect(longDelay).toBeGreaterThan(shortDelay);
    });
  });

  describe('Conversation Context', () => {
    test('should build context from recent messages', () => {
      const messages = [
        { sender: 'A', content: 'Hello everyone!', timestamp: Date.now() - 10000 },
        { sender: 'B', content: 'Hi! How is everyone doing?', timestamp: Date.now() - 8000 },
        { sender: 'C', content: 'Great! What should we talk about?', timestamp: Date.now() - 5000 },
        { sender: 'A', content: 'How about favorite movies?', timestamp: Date.now() - 2000 }
      ];
      
      const context = buildConversationContext(messages, 'D');
      
      expect(context).toBeDefined();
      expect(context.recentMessages).toBeDefined();
      expect(context.conversationTopic).toBeDefined();
      expect(context.participants).toContain('A');
      expect(context.participants).toContain('B');
      expect(context.participants).toContain('C');
    });

    test('should limit context to relevant recent messages', () => {
      const manyMessages = [];
      for (let i = 0; i < 20; i++) {
        manyMessages.push({
          sender: String.fromCharCode(65 + (i % 4)), // A, B, C, D
          content: `Message ${i}`,
          timestamp: Date.now() - (20 - i) * 1000
        });
      }
      
      const context = buildConversationContext(manyMessages, 'A');
      
      // Should limit to reasonable number of recent messages
      expect(context.recentMessages.length).toBeLessThanOrEqual(10);
      expect(context.recentMessages[0].content).toContain('Message 1'); // Most recent first
    });
  });

  describe('Session Mode Handling', () => {
    test('should initialize correct number of AI participants for production mode', () => {
      const aiParticipants = initializeAIParticipants('production');
      
      expect(aiParticipants).toHaveLength(2);
      expect(aiParticipants).toContain('C');
      expect(aiParticipants).toContain('D');
    });

    test('should initialize correct number of AI participants for testing mode', () => {
      const aiParticipants = initializeAIParticipants('testing');
      
      expect(aiParticipants).toHaveLength(3);
      expect(aiParticipants).toContain('B');
      expect(aiParticipants).toContain('C');
      expect(aiParticipants).toContain('D');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty conversation gracefully', async () => {
      const context = {
        messages: [],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const response = await generateAIResponse(context);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      // Should be a conversation starter
      expect(response.length).toBeGreaterThan(10);
    });

    test('should handle rapid message succession', () => {
      const rapidMessages = [
        { sender: 'A', content: 'Quick', timestamp: Date.now() - 1000 },
        { sender: 'A', content: 'Questions', timestamp: Date.now() - 900 },
        { sender: 'A', content: 'In', timestamp: Date.now() - 800 },
        { sender: 'A', content: 'Succession', timestamp: Date.now() - 700 }
      ];
      
      const shouldRespond = shouldAIRespond('B', rapidMessages, 'production');
      
      // AI should be more cautious about responding to rapid messages
      expect(typeof shouldRespond).toBe('boolean');
    });

    test('should maintain consistency in personality across responses', async () => {
      const context1 = {
        messages: [{ sender: 'A', content: 'What do you do for work?', timestamp: Date.now() }],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const context2 = {
        messages: [
          { sender: 'A', content: 'What do you do for work?', timestamp: Date.now() - 5000 },
          { sender: 'B', content: 'I work in tech', timestamp: Date.now() - 3000 },
          { sender: 'C', content: 'That\'s cool! What kind of tech?', timestamp: Date.now() }
        ],
        sessionMode: 'production',
        aiIdentity: 'B'
      };
      
      const response1 = await generateAIResponse(context1);
      const response2 = await generateAIResponse(context2);
      
      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
      
      // Both responses should be consistent with the same personality
      // This would require more sophisticated testing of personality consistency
    });
  });
});