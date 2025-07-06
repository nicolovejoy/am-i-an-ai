// TDD Tests for Match History Consumer Lambda
// Tests for consuming Kafka match events and building match history API

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MatchEvent, EVENT_TYPES } from './kafka-schemas/schemas';
import { MatchHistoryConsumer } from './match-history-consumer';

// Mock AWS SDK
const mockKafkaConsumer = {
  run: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  commitOffsets: jest.fn()
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => ({
    consumer: () => mockKafkaConsumer
  }))
}));

// Types imported from implementation

describe('Match History Consumer', () => {
  let consumer: MatchHistoryConsumer;

  beforeEach(() => {
    consumer = new MatchHistoryConsumer();
  });

  describe('Event Processing', () => {
    it('should create new match record from match.started event', async () => {
      const event: MatchEvent = {
        eventId: 'evt_123',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: Date.now()
        }
      };

      await consumer.processEvent(event);

      const match = consumer.getMatchHistory('match_abc');
      expect(match).toBeDefined();
      expect(match?.matchId).toBe('match_abc');
      expect(match?.status).toBe('in_progress');
      expect(match?.humanParticipant).toBe('A');
      expect(match?.robotParticipants).toEqual(['B', 'C', 'D']);
      expect(match?.rounds).toEqual([]);
    });

    it('should add round when processing round.started event', async () => {
      // First create the match
      const matchStartedEvent: MatchEvent = {
        eventId: 'evt_123',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: Date.now()
        }
      };

      const roundStartedEvent: MatchEvent = {
        eventId: 'evt_124',
        eventType: EVENT_TYPES.ROUND_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          prompt: "What's your favorite memory?",
          activeParticipants: ['A', 'B', 'C', 'D']
        }
      };

      await consumer.processEvent(matchStartedEvent);
      await consumer.processEvent(roundStartedEvent);

      const match = consumer.getMatchHistory('match_abc');
      expect(match?.rounds).toHaveLength(1);
      expect(match?.rounds[0].round).toBe(1);
      expect(match?.rounds[0].prompt).toBe("What's your favorite memory?");
      expect(match?.rounds[0].responses).toEqual([]);
    });

    it('should collect responses in current round', async () => {
      // Setup match and round
      const matchStartedEvent: MatchEvent = {
        eventId: 'evt_123',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: Date.now()
        }
      };

      const roundStartedEvent: MatchEvent = {
        eventId: 'evt_124',
        eventType: EVENT_TYPES.ROUND_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          prompt: "What's your favorite memory?",
          activeParticipants: ['A', 'B', 'C', 'D']
        }
      };

      const humanResponseEvent: MatchEvent = {
        eventId: 'evt_125',
        eventType: EVENT_TYPES.RESPONSE_SUBMITTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          participantId: 'A',
          participantType: 'human',
          response: 'My favorite memory is graduating...',
          submittedAt: Date.now()
        }
      };

      const robotResponseEvent: MatchEvent = {
        eventId: 'evt_126',
        eventType: EVENT_TYPES.RESPONSE_GENERATED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          participantId: 'B',
          participantType: 'robot',
          robotType: 'curious-student',
          response: 'I remember when I first learned about...',
          generatedAt: Date.now(),
          processingTime: 1.2,
          model: 'gpt-4'
        }
      };

      await consumer.processEvent(matchStartedEvent);
      await consumer.processEvent(roundStartedEvent);
      await consumer.processEvent(humanResponseEvent);
      await consumer.processEvent(robotResponseEvent);

      const match = consumer.getMatchHistory('match_abc');
      expect(match?.rounds[0].responses).toHaveLength(2);
      
      const humanResponse = match?.rounds[0].responses.find(r => r.participantId === 'A');
      expect(humanResponse?.participantType).toBe('human');
      expect(humanResponse?.response).toBe('My favorite memory is graduating...');

      const robotResponse = match?.rounds[0].responses.find(r => r.participantId === 'B');
      expect(robotResponse?.participantType).toBe('robot');
      expect(robotResponse?.robotType).toBe('curious-student');
    });

    it('should record vote in current round', async () => {
      // First set up match and round
      const matchStartedEvent: MatchEvent = {
        eventId: 'evt_123',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: Date.now()
        }
      };

      const roundStartedEvent: MatchEvent = {
        eventId: 'evt_124',
        eventType: EVENT_TYPES.ROUND_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          prompt: "What's your favorite memory?",
          activeParticipants: ['A', 'B', 'C', 'D']
        }
      };

      const voteEvent: MatchEvent = {
        eventId: 'evt_129',
        eventType: EVENT_TYPES.VOTE_SUBMITTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          voterId: 'A',
          humanGuess: 'C',
          submittedAt: Date.now()
        }
      };

      await consumer.processEvent(matchStartedEvent);
      await consumer.processEvent(roundStartedEvent);
      await consumer.processEvent(voteEvent);

      const match = consumer.getMatchHistory('match_abc');
      // Should record the human's guess in the current round
      expect(match?.rounds[0]?.humanGuess).toBe('C');
    });

    it('should mark match as completed and record final result', async () => {
      // First create the match
      const matchStartedEvent: MatchEvent = {
        eventId: 'evt_123',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: Date.now()
        }
      };

      const matchCompletedEvent: MatchEvent = {
        eventId: 'evt_130',
        eventType: EVENT_TYPES.MATCH_COMPLETED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          humanParticipant: 'A',
          humanGuess: 'C',
          result: 'incorrect',
          actualRobots: ['B', 'C', 'D'],
          completedAt: Date.now(),
          duration: 300000 // 5 minutes
        }
      };

      await consumer.processEvent(matchStartedEvent);
      await consumer.processEvent(matchCompletedEvent);

      const match = consumer.getMatchHistory('match_abc');
      expect(match?.status).toBe('completed');
      expect(match?.result).toBe('incorrect');
      expect(match?.completedAt).toBeDefined();
      expect(match?.duration).toBe(300000);
    });

    it('should handle events out of order gracefully', async () => {
      // Process response before round started - should queue or handle gracefully
      const responseEvent: MatchEvent = {
        eventId: 'evt_125',
        eventType: EVENT_TYPES.RESPONSE_SUBMITTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          participantId: 'A',
          participantType: 'human',
          response: 'My favorite memory is graduating...',
          submittedAt: Date.now()
        }
      };

      // Should not crash, should handle gracefully
      await expect(consumer.processEvent(responseEvent)).resolves.not.toThrow();
    });
  });

  describe('Query Interface', () => {
    it('should return null for non-existent match', () => {
      const match = consumer.getMatchHistory('non_existent');
      expect(match).toBeNull();
    });

    it('should return all matches sorted by creation time (newest first)', async () => {
      // Create multiple matches
      const match1Event: MatchEvent = {
        eventId: 'evt_1',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_1',
        timestamp: 1000,
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: 1000
        }
      };

      const match2Event: MatchEvent = {
        eventId: 'evt_2',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_2',
        timestamp: 2000,
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: 2000
        }
      };

      await consumer.processEvent(match1Event);
      await consumer.processEvent(match2Event);

      const allMatches = consumer.getAllMatches();
      expect(allMatches).toHaveLength(2);
      expect(allMatches[0].matchId).toBe('match_2'); // Newer first
      expect(allMatches[1].matchId).toBe('match_1');
    });

    it('should filter completed matches only', async () => {
      const match1Event: MatchEvent = {
        eventId: 'evt_1',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_1',
        timestamp: 1000,
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: 1000
        }
      };

      const match1CompletedEvent: MatchEvent = {
        eventId: 'evt_completed',
        eventType: EVENT_TYPES.MATCH_COMPLETED,
        matchId: 'match_1',
        timestamp: 2000,
        data: {
          humanParticipant: 'A',
          humanGuess: 'C',
          result: 'correct',
          actualRobots: ['B', 'C', 'D'],
          completedAt: 2000,
          duration: 300000
        }
      };

      const match2Event: MatchEvent = {
        eventId: 'evt_2',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_2',
        timestamp: 3000,
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: 3000
        }
      };

      await consumer.processEvent(match1Event);
      await consumer.processEvent(match1CompletedEvent);
      await consumer.processEvent(match2Event);

      const completedMatches = consumer.getCompletedMatches();
      expect(completedMatches).toHaveLength(1);
      expect(completedMatches[0].matchId).toBe('match_1');
      expect(completedMatches[0].status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid events', async () => {
      const invalidEvent = {
        eventId: 'evt_123',
        // missing eventType
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {}
      };

      await expect(consumer.processEvent(invalidEvent as any))
        .rejects.toThrow('Invalid event format');
    });

    it('should handle malformed event data gracefully', async () => {
      const malformedEvent: MatchEvent = {
        eventId: 'evt_123',
        eventType: EVENT_TYPES.MATCH_STARTED,
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          // Missing required fields - this will fail validation
          participants: [],
          humanParticipant: '',
          robotParticipants: [],
          createdAt: Date.now()
        }
      };

      // Should handle gracefully, not crash
      await expect(consumer.processEvent(malformedEvent))
        .rejects.toThrow('Invalid match started data');
    });
  });
});

describe('Lambda Handler Integration', () => {
  it('should process Kafka messages and build match history', async () => {
    // This test will verify the Lambda handler integration
    // Will be implemented when we build the actual handler
  });

  it('should return match history via API Gateway event', async () => {
    // This test will verify the API Gateway integration
    // Will be implemented when we build the API handler
  });
});