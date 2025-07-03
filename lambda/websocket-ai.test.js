// WebSocket AI Integration Tests
// Tests for integrating AI responses into the WebSocket handler

const { 
  handleAIResponse,
  scheduleAIResponse,
  processMessageForAI,
  getActiveAIParticipants
} = require('./websocket-ai-handler');

describe('WebSocket AI Integration', () => {

  describe('AI Response Scheduling', () => {
    test('should schedule AI response after human message', async () => {
      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { connectionId: 'conn1', type: 'human', identity: 'A' },
          'B': { connectionId: 'conn2', type: 'ai', identity: 'B' },
          'C': { connectionId: 'conn3', type: 'human', identity: 'C' },
          'D': { connectionId: 'conn4', type: 'ai', identity: 'D' }
        },
        messages: [
          { sender: 'A', content: 'Hello everyone!', timestamp: Date.now() }
        ],
        mode: 'production'
      };

      const humanMessage = {
        sender: 'A',
        content: 'What does everyone think about space exploration?',
        timestamp: Date.now()
      };

      const scheduledResponses = await processMessageForAI(session, humanMessage);

      expect(Array.isArray(scheduledResponses)).toBe(true);
      expect(scheduledResponses.length).toBeGreaterThan(0);
      expect(scheduledResponses.length).toBeLessThanOrEqual(2); // Max 2 AI participants in production

      scheduledResponses.forEach(response => {
        expect(response).toHaveProperty('aiIdentity');
        expect(response).toHaveProperty('delay');
        expect(response).toHaveProperty('sessionId');
        expect(['B', 'D']).toContain(response.aiIdentity); // Production mode AI identities
      });
    });

    test('should handle testing mode with 3 AI participants', async () => {
      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { connectionId: 'conn1', type: 'human', identity: 'A' },
          'B': { connectionId: 'conn2', type: 'ai', identity: 'B' },
          'C': { connectionId: 'conn3', type: 'ai', identity: 'C' },
          'D': { connectionId: 'conn4', type: 'ai', identity: 'D' }
        },
        messages: [],
        mode: 'testing'
      };

      const humanMessage = {
        sender: 'A',
        content: 'Anyone here like pizza?',
        timestamp: Date.now()
      };

      const scheduledResponses = await processMessageForAI(session, humanMessage);

      expect(scheduledResponses.length).toBeLessThanOrEqual(3); // Max 3 AI participants in testing
      
      const aiIdentities = scheduledResponses.map(r => r.aiIdentity);
      aiIdentities.forEach(identity => {
        expect(['B', 'C', 'D']).toContain(identity);
      });
    });

    test('should not schedule response if AI recently responded', async () => {
      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { connectionId: 'conn1', type: 'human', identity: 'A' },
          'B': { connectionId: 'conn2', type: 'ai', identity: 'B' }
        },
        messages: [
          { sender: 'A', content: 'Hello!', timestamp: Date.now() - 5000 },
          { sender: 'B', content: 'Hi there!', timestamp: Date.now() - 1000 } // Recent AI response
        ],
        mode: 'testing'
      };

      const humanMessage = {
        sender: 'A',
        content: 'How are you?',
        timestamp: Date.now()
      };

      const scheduledResponses = await processMessageForAI(session, humanMessage);

      // Should be less likely to respond immediately after recent response
      const bResponses = scheduledResponses.filter(r => r.aiIdentity === 'B');
      expect(bResponses.length).toBe(0);
    });
  });

  describe('AI Response Execution', () => {
    test('should generate and send AI response', async () => {
      const mockApiGateway = {
        postToConnection: jest.fn().mockResolvedValue({})
      };

      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { connectionId: 'conn1', type: 'human', identity: 'A' },
          'B': { connectionId: 'conn2', type: 'ai', identity: 'B' }
        },
        messages: [
          { sender: 'A', content: 'What\'s your favorite color?', timestamp: Date.now() - 2000 }
        ],
        mode: 'production'
      };

      const responseData = {
        aiIdentity: 'B',
        sessionId: 'test-session'
      };

      const result = await handleAIResponse(responseData, mockApiGateway);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.messageId).toBeDefined();
    });

    test('should save AI response to session messages', async () => {
      const mockDynamoDB = {
        get: jest.fn().mockResolvedValue({
          Item: {
            sessionId: 'test-session',
            messages: [
              { sender: 'A', content: 'Hello AI!', timestamp: Date.now() - 3000 }
            ],
            participants: {
              'B': { connectionId: 'conn2', type: 'ai', identity: 'B' }
            },
            mode: 'production'
          }
        }),
        update: jest.fn().mockResolvedValue({})
      };

      const responseData = {
        aiIdentity: 'B',
        sessionId: 'test-session'
      };

      const result = await handleAIResponse(responseData, null, mockDynamoDB);

      expect(mockDynamoDB.update).toHaveBeenCalled();
      
      const updateCall = mockDynamoDB.update.mock.calls[0][0];
      expect(updateCall.UpdateExpression).toContain('list_append(messages');
      expect(updateCall.UpdateExpression).toContain('messageCount + :inc');
    });

    test('should handle API failures gracefully', async () => {
      const mockApiGateway = {
        postToConnection: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };

      const responseData = {
        aiIdentity: 'B',
        sessionId: 'test-session'
      };

      const result = await handleAIResponse(responseData, mockApiGateway);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('AI Participant Management', () => {
    test('should identify active AI participants in production mode', () => {
      const session = {
        participants: {
          'A': { type: 'human', identity: 'A' },
          'B': { type: 'human', identity: 'B' },
          'C': { type: 'ai', identity: 'C' },
          'D': { type: 'ai', identity: 'D' }
        },
        mode: 'production'
      };

      const aiParticipants = getActiveAIParticipants(session);

      expect(aiParticipants).toHaveLength(2);
      expect(aiParticipants).toContain('C');
      expect(aiParticipants).toContain('D');
    });

    test('should identify active AI participants in testing mode', () => {
      const session = {
        participants: {
          'A': { type: 'human', identity: 'A' },
          'B': { type: 'ai', identity: 'B' },
          'C': { type: 'ai', identity: 'C' },
          'D': { type: 'ai', identity: 'D' }
        },
        mode: 'testing'
      };

      const aiParticipants = getActiveAIParticipants(session);

      expect(aiParticipants).toHaveLength(3);
      expect(aiParticipants).toContain('B');
      expect(aiParticipants).toContain('C');
      expect(aiParticipants).toContain('D');
    });
  });

  describe('Response Probability and Timing', () => {
    test('should calculate response probability based on conversation flow', () => {
      const recentMessages = [
        { sender: 'A', content: 'What does everyone think?', timestamp: Date.now() - 2000 },
        { sender: 'C', content: 'I think it\'s interesting', timestamp: Date.now() - 1000 }
      ];

      // This would test internal probability calculation
      // Implementation will depend on the actual algorithm
      expect(true).toBe(true); // Placeholder
    });

    test('should avoid all AIs responding simultaneously', async () => {
      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { type: 'human', identity: 'A' },
          'B': { type: 'ai', identity: 'B' },
          'C': { type: 'ai', identity: 'C' },
          'D': { type: 'ai', identity: 'D' }
        },
        messages: [],
        mode: 'testing'
      };

      const humanMessage = {
        sender: 'A',
        content: 'This is a really controversial topic, what do you all think?',
        timestamp: Date.now()
      };

      const scheduledResponses = await processMessageForAI(session, humanMessage);

      // Should not schedule all 3 AIs to respond
      expect(scheduledResponses.length).toBeLessThan(3);
      
      // If multiple responses are scheduled, they should have different delays
      if (scheduledResponses.length > 1) {
        const delays = scheduledResponses.map(r => r.delay);
        const uniqueDelays = new Set(delays);
        expect(uniqueDelays.size).toBe(delays.length); // All delays should be different
      }
    });
  });

  describe('Session Limits with AI', () => {
    test('should not schedule AI responses when session has ended', async () => {
      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { type: 'human', identity: 'A' },
          'B': { type: 'ai', identity: 'B' }
        },
        messages: Array(20).fill(null).map((_, i) => ({
          sender: i % 2 === 0 ? 'A' : 'B',
          content: `Message ${i}`,
          timestamp: Date.now() - (20 - i) * 1000
        })),
        messageCount: 20,
        mode: 'production', // 20 message limit
        status: 'ended'
      };

      const humanMessage = {
        sender: 'A',
        content: 'One more message',
        timestamp: Date.now()
      };

      const scheduledResponses = await processMessageForAI(session, humanMessage);

      expect(scheduledResponses).toHaveLength(0);
    });

    test('should consider message count when scheduling responses', async () => {
      const session = {
        sessionId: 'test-session',
        participants: {
          'A': { type: 'human', identity: 'A' },
          'B': { type: 'ai', identity: 'B' }
        },
        messages: Array(19).fill(null).map((_, i) => ({
          sender: i % 2 === 0 ? 'A' : 'B',
          content: `Message ${i}`,
          timestamp: Date.now() - (19 - i) * 1000
        })),
        messageCount: 19,
        mode: 'production', // Close to 20 message limit
        status: 'active'
      };

      const humanMessage = {
        sender: 'A',
        content: 'Almost at the limit',
        timestamp: Date.now()
      };

      const scheduledResponses = await processMessageForAI(session, humanMessage);

      // Should be very conservative about responding near the limit
      expect(scheduledResponses.length).toBeLessThanOrEqual(1);
    });
  });
});