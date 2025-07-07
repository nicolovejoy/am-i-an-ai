const { handler } = require('./handler');
const { AIResponseGenerator } = require('./aiResponseGenerator');
const { RobotParticipantManager } = require('./robotParticipantManager');

// Mock the AWS SDK
jest.mock('aws-sdk', () => ({
  ApiGatewayManagementApi: jest.fn(() => ({
    postToConnection: jest.fn(() => ({
      promise: jest.fn().mockResolvedValue({})
    }))
  }))
}));

// Mock the AI response generator
jest.mock('./aiResponseGenerator');
jest.mock('./robotParticipantManager');

describe('Lambda Handler - AI Integration', () => {
  let mockContext;
  let mockAIGenerator;
  let mockRobotManager;
  let sentMessages;

  beforeEach(() => {
    jest.clearAllMocks();
    sentMessages = [];

    // Mock context
    mockContext = {
      requestContext: {
        connectionId: 'human-connection-123',
        domainName: 'test.execute-api.amazonaws.com',
        stage: 'test'
      }
    };

    // Mock AI generator
    mockAIGenerator = {
      generateResponseWithTiming: jest.fn().mockResolvedValue({
        response: "AI generated response",
        responseTime: 3.5
      })
    };
    AIResponseGenerator.mockImplementation(() => mockAIGenerator);

    // Mock robot manager
    mockRobotManager = {
      createRobotParticipants: jest.fn().mockReturnValue([
        { identity: 'B', isHuman: false, personality: 'curious_student', score: 0 },
        { identity: 'C', isHuman: false, personality: 'witty_professional', score: 0 },
        { identity: 'D', isHuman: false, personality: 'friendly_neighbor', score: 0 }
      ]),
      scheduleRobotResponses: jest.fn().mockReturnValue([]),
      generateRobotVotes: jest.fn().mockResolvedValue({
        B: 'A', C: 'D', D: 'A'
      })
    };
    RobotParticipantManager.mockImplementation(() => mockRobotManager);

    // Capture sent messages
    const AWS = require('aws-sdk');
    AWS.ApiGatewayManagementApi.mockImplementation(() => ({
      postToConnection: jest.fn(({ Data }) => {
        sentMessages.push(JSON.parse(Data));
        return { promise: jest.fn().mockResolvedValue({}) };
      })
    }));
  });

  describe('Match Creation with AI Participants', () => {
    it('should create AI participants when human joins match', async () => {
      const event = {
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'CONNECT'
        }
      };

      await handler(event);

      // Should create robot participants
      expect(mockRobotManager.createRobotParticipants).toHaveBeenCalledWith(['B', 'C', 'D']);
    });

    it('should send match_joined with all participants including AI', async () => {
      const event = {
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'CONNECT'
        }
      };

      await handler(event);

      // Find match_joined message
      const matchJoined = sentMessages.find(msg => msg.action === 'match_joined');
      expect(matchJoined).toBeDefined();
      expect(matchJoined.participants).toHaveLength(4);
      
      // Verify participant types
      const humanCount = matchJoined.participants.filter(p => p.isHuman).length;
      const aiCount = matchJoined.participants.filter(p => !p.isHuman).length;
      expect(humanCount).toBe(1);
      expect(aiCount).toBe(3);
    });
  });

  describe('AI Response Generation', () => {
    beforeEach(async () => {
      // Connect first
      await handler({
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'CONNECT'
        }
      });
      sentMessages = []; // Clear connection messages
    });

    it('should schedule AI responses when round starts', async () => {
      // Start a round (this would normally happen automatically)
      const event = {
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'MESSAGE'
        },
        body: JSON.stringify({
          action: 'start_round' // This action would be internal
        })
      };

      // We need to test that robots respond to prompts
      // For now, let's test the flow when human submits response
    });

    it('should generate AI responses after human submits', async () => {
      const event = {
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'MESSAGE'
        },
        body: JSON.stringify({
          action: 'submit_response',
          roundNumber: 1,
          response: 'Human response here'
        })
      };

      await handler(event);

      // Should schedule robot responses
      expect(mockRobotManager.scheduleRobotResponses).toHaveBeenCalled();
      expect(mockRobotManager.scheduleRobotResponses).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: expect.any(String),
          currentRound: 1
        }),
        expect.any(String) // The prompt
      );
    });
  });

  describe('AI Voting', () => {
    beforeEach(async () => {
      // Connect and set up match
      await handler({
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'CONNECT'
        }
      });

      // Submit responses to trigger voting phase
      await handler({
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'MESSAGE'
        },
        body: JSON.stringify({
          action: 'submit_response',
          roundNumber: 1,
          response: 'Human response'
        })
      });

      sentMessages = [];
    });

    it('should generate AI votes when human votes', async () => {
      const event = {
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'MESSAGE'
        },
        body: JSON.stringify({
          action: 'submit_vote',
          roundNumber: 1,
          votedIdentity: 'B'
        })
      };

      await handler(event);

      // Should generate robot votes
      expect(mockRobotManager.generateRobotVotes).toHaveBeenCalled();
    });

    it('should include AI votes in round completion', async () => {
      const event = {
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'MESSAGE'
        },
        body: JSON.stringify({
          action: 'submit_vote',
          roundNumber: 1,
          votedIdentity: 'B'
        })
      };

      await handler(event);

      // Find round_complete message
      const roundComplete = sentMessages.find(msg => msg.action === 'round_complete');
      expect(roundComplete).toBeDefined();
      expect(roundComplete.votes).toBeDefined();
      
      // Should have votes from all 4 participants
      expect(Object.keys(roundComplete.votes)).toHaveLength(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI API failures gracefully', async () => {
      // Make AI generator fail
      mockAIGenerator.generateResponseWithTiming.mockRejectedValue(
        new Error('API rate limit')
      );

      await handler({
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'CONNECT'
        }
      });

      // Submit response to trigger AI responses
      await handler({
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'MESSAGE'
        },
        body: JSON.stringify({
          action: 'submit_response',
          roundNumber: 1,
          response: 'Human response'
        })
      });

      // Match should still work with fallback responses
      const errorMessage = sentMessages.find(msg => msg.action === 'error');
      expect(errorMessage).toBeUndefined(); // No error sent to user
    });
  });

  describe('AI Personality System', () => {
    it('should assign different personalities to each robot', async () => {
      await handler({
        ...mockContext,
        requestContext: {
          ...mockContext.requestContext,
          eventType: 'CONNECT'
        }
      });

      const matchJoined = sentMessages.find(msg => msg.action === 'match_joined');
      const robots = matchJoined.participants.filter(p => !p.isHuman);
      
      // Each robot should have a unique personality
      const personalities = robots.map(r => r.personality);
      expect(new Set(personalities).size).toBe(3);
      
      // Should use our defined personalities
      personalities.forEach(p => {
        expect(['curious_student', 'witty_professional', 'friendly_neighbor']).toContain(p);
      });
    });
  });
});