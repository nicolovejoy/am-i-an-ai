const { RobotParticipantManager } = require('./robotParticipantManager');
const { AIResponseGenerator, ROBOT_PERSONALITIES } = require('./aiResponseGenerator');

describe('RobotParticipantManager', () => {
  let manager;
  let mockAIGenerator;
  let mockBroadcastFn;

  beforeEach(() => {
    // Mock AI generator
    mockAIGenerator = {
      generateResponseWithTiming: jest.fn()
    };

    // Mock broadcast function
    mockBroadcastFn = jest.fn().mockResolvedValue(undefined);

    manager = new RobotParticipantManager({
      aiGenerator: mockAIGenerator,
      broadcastFn: mockBroadcastFn
    });
  });

  describe('createRobotParticipants', () => {
    it('should create 3 robot participants with unique identities', () => {
      const availableIdentities = ['B', 'C', 'D']; // A is taken by human
      const robots = manager.createRobotParticipants(availableIdentities);

      expect(robots).toHaveLength(3);
      expect(robots.map(r => r.identity).sort()).toEqual(['B', 'C', 'D']);
      
      // Each robot should have a unique personality
      const personalities = robots.map(r => r.personality);
      expect(new Set(personalities).size).toBe(3);
      
      robots.forEach(robot => {
        expect(robot.isHuman).toBe(false);
        expect(robot.score).toBe(0);
        expect(robot.connectionId).toBeNull();
        expect(Object.keys(ROBOT_PERSONALITIES)).toContain(robot.personality);
      });
    });

    it('should handle fewer available identities', () => {
      const availableIdentities = ['C', 'D']; // Only 2 slots
      const robots = manager.createRobotParticipants(availableIdentities);

      expect(robots).toHaveLength(2);
      expect(robots.map(r => r.identity).sort()).toEqual(['C', 'D']);
    });
  });

  describe('scheduleRobotResponses', () => {
    const mockMatch = {
      matchId: 'test-match',
      currentRound: 1,
      participants: {
        A: { identity: 'A', isHuman: true },
        B: { identity: 'B', isHuman: false, personality: 'curious_student' },
        C: { identity: 'C', isHuman: false, personality: 'witty_professional' },
        D: { identity: 'D', isHuman: false, personality: 'friendly_neighbor' }
      }
    };

    const testPrompt = "What's your favorite hobby?";

    it('should schedule responses for all robot participants', async () => {
      mockAIGenerator.generateResponseWithTiming
        .mockResolvedValueOnce({ response: "I love reading!", responseTime: 2.5 })
        .mockResolvedValueOnce({ response: "Coding, obviously.", responseTime: 3.1 })
        .mockResolvedValueOnce({ response: "Gardening is so relaxing!", responseTime: 2.8 });

      const responsePromises = manager.scheduleRobotResponses(mockMatch, testPrompt);
      
      expect(responsePromises).toHaveLength(3);
      
      // Wait for all responses
      await Promise.all(responsePromises);

      // Should call AI generator for each robot
      expect(mockAIGenerator.generateResponseWithTiming).toHaveBeenCalledTimes(3);
      
      // Should broadcast participant_responded for each robot
      expect(mockBroadcastFn).toHaveBeenCalledTimes(3);
      
      // Verify broadcast calls
      expect(mockBroadcastFn).toHaveBeenCalledWith(
        mockMatch,
        expect.objectContaining({
          action: 'participant_responded',
          identity: 'B',
          responseTime: 2.5
        })
      );
    });

    it('should handle AI generation failures gracefully', async () => {
      mockAIGenerator.generateResponseWithTiming
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ response: "Working response", responseTime: 2.5 })
        .mockResolvedValueOnce({ response: "Another response", responseTime: 3.0 });

      const responsePromises = manager.scheduleRobotResponses(mockMatch, testPrompt);
      
      // Should not throw, even with one failure
      await expect(Promise.all(responsePromises)).resolves.toBeDefined();
      
      // Should still broadcast for successful responses
      expect(mockBroadcastFn).toHaveBeenCalledTimes(3); // Including fallback
    });

    it('should vary response timing between robots', async () => {
      const responseTimes = [];
      
      mockAIGenerator.generateResponseWithTiming.mockImplementation(
        async (prompt, personality, options) => {
          responseTimes.push(options.minDelay);
          return { response: "Test", responseTime: options.minDelay / 1000 };
        }
      );

      await Promise.all(manager.scheduleRobotResponses(mockMatch, testPrompt));

      // Each robot should have different timing
      expect(new Set(responseTimes).size).toBeGreaterThan(1);
      
      // All times should be within reasonable range
      responseTimes.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(2000);
        expect(time).toBeLessThanOrEqual(8000);
      });
    });
  });

  describe('generateRobotVotes', () => {
    const mockResponses = {
      A: "I love playing guitar and writing songs",
      B: "Reading books is my passion!",
      C: "I enjoy strategic board games",
      D: "Hiking in nature is the best"
    };

    it('should generate votes for all robot participants', async () => {
      mockAIGenerator.generateResponseWithTiming
        .mockResolvedValue({ response: "A", responseTime: 1.5 });

      const votes = await manager.generateRobotVotes(
        { B: 'curious_student', C: 'witty_professional', D: 'friendly_neighbor' },
        mockResponses,
        'A' // correct answer
      );

      expect(votes).toEqual({
        B: expect.any(String),
        C: expect.any(String),
        D: expect.any(String)
      });

      // Each vote should be a valid identity
      Object.values(votes).forEach(vote => {
        expect(['A', 'B', 'C', 'D']).toContain(vote);
      });
    });

    it('should have some robots correctly identify the human', async () => {
      // Mock different voting patterns
      mockAIGenerator.generateResponseWithTiming
        .mockResolvedValueOnce({ response: "A", responseTime: 1.5 }) // Correct
        .mockResolvedValueOnce({ response: "B", responseTime: 1.2 }) // Wrong
        .mockResolvedValueOnce({ response: "A", responseTime: 1.8 }); // Correct

      const votes = await manager.generateRobotVotes(
        { B: 'curious_student', C: 'witty_professional', D: 'friendly_neighbor' },
        mockResponses,
        'A'
      );

      const correctVotes = Object.values(votes).filter(v => v === 'A').length;
      expect(correctVotes).toBeGreaterThan(0); // At least some should be correct
    });
  });

  describe('storeRobotResponse', () => {
    it('should store response data correctly', async () => {
      const matchId = 'test-match';
      const roundNumber = 2;
      const identity = 'B';
      const response = "I love solving puzzles!";
      const responseTime = 3.5;

      const storedData = await manager.storeRobotResponse(
        matchId,
        roundNumber,
        identity,
        response,
        responseTime
      );

      expect(storedData).toEqual({
        matchId,
        roundNumber,
        identity,
        response,
        responseTime,
        isRobot: true,
        timestamp: expect.any(Number)
      });
    });
  });
});