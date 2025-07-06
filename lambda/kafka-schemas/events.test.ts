// Event Schema Tests for Kafka Migration Phase 1
// Testing event validation and structure for match events

import { validateMatchEvent, validateRobotCommand, validateRobotEvent } from './schemas';

describe('Match Event Schema Validation', () => {
  describe('Match Events', () => {
    test('validates match_started event', () => {
      const event = {
        eventId: 'evt_123',
        eventType: 'match.started',
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          participants: ['A', 'B', 'C', 'D'],
          humanParticipant: 'A',
          robotParticipants: ['B', 'C', 'D'],
          createdAt: Date.now()
        }
      };

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates round_started event', () => {
      const event = {
        eventId: 'evt_124',
        eventType: 'round.started',
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          prompt: "What's your favorite memory?",
          activeParticipants: ['A', 'B', 'C', 'D']
        }
      };

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates human_response_submitted event', () => {
      const event = {
        eventId: 'evt_125',
        eventType: 'response.submitted',
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

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates robot_response_generated event', () => {
      const event = {
        eventId: 'evt_126',
        eventType: 'response.generated',
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

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates round_completed event', () => {
      const event = {
        eventId: 'evt_127',
        eventType: 'round.completed',
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          round: 1,
          responses: [
            { participantId: 'A', response: 'Human response...' },
            { participantId: 'B', response: 'Robot B response...' },
            { participantId: 'C', response: 'Robot C response...' },
            { participantId: 'D', response: 'Robot D response...' }
          ],
          completedAt: Date.now()
        }
      };

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates voting_started event', () => {
      const event = {
        eventId: 'evt_128',
        eventType: 'voting.started',
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          allResponses: [
            { participantId: 'A', response: 'Response A' },
            { participantId: 'B', response: 'Response B' },
            { participantId: 'C', response: 'Response C' },
            { participantId: 'D', response: 'Response D' }
          ],
          startedAt: Date.now()
        }
      };

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates vote_submitted event', () => {
      const event = {
        eventId: 'evt_129',
        eventType: 'vote.submitted',
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          voterId: 'A',
          humanGuess: 'C',
          submittedAt: Date.now()
        }
      };

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('validates match_completed event', () => {
      const event = {
        eventId: 'evt_130',
        eventType: 'match.completed',
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

      expect(validateMatchEvent(event)).toBe(true);
    });

    test('rejects invalid event structure', () => {
      const event = {
        eventId: 'evt_123',
        // missing eventType
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {}
      };

      expect(validateMatchEvent(event)).toBe(false);
    });

    test('rejects event with missing required data fields', () => {
      const event = {
        eventId: 'evt_123',
        eventType: 'match.started',
        matchId: 'match_abc',
        timestamp: Date.now(),
        data: {
          // missing participants
          humanParticipant: 'A'
        }
      };

      expect(validateMatchEvent(event)).toBe(false);
    });
  });

  describe('Robot Commands', () => {
    test('validates generate_response command', () => {
      const command = {
        commandId: 'cmd_123',
        robotId: 'curious-student',
        matchId: 'match_abc',
        action: 'generate_response',
        data: {
          round: 1,
          prompt: "What's your favorite memory?",
          context: {
            otherResponses: [],
            matchPhase: 'round_active'
          }
        }
      };

      expect(validateRobotCommand(command)).toBe(true);
    });

    test('rejects invalid robot command', () => {
      const command = {
        commandId: 'cmd_123',
        // missing robotId
        matchId: 'match_abc',
        action: 'generate_response',
        data: {}
      };

      expect(validateRobotCommand(command)).toBe(false);
    });
  });

  describe('Robot Events', () => {
    test('validates robot response generated event', () => {
      const event = {
        eventId: 'evt_456',
        robotId: 'curious-student',
        matchId: 'match_abc',
        eventType: 'response.generated',
        data: {
          round: 1,
          response: 'I remember the first time I...',
          processingTime: 1.2,
          model: 'gpt-4'
        }
      };

      expect(validateRobotEvent(event)).toBe(true);
    });

    test('validates robot error event', () => {
      const event = {
        eventId: 'evt_457',
        robotId: 'curious-student',
        matchId: 'match_abc',
        eventType: 'response.error',
        data: {
          round: 1,
          error: 'OpenAI API timeout',
          retryCount: 2
        }
      };

      expect(validateRobotEvent(event)).toBe(true);
    });

    test('rejects invalid robot event', () => {
      const event = {
        eventId: 'evt_456',
        // missing robotId
        matchId: 'match_abc',
        eventType: 'response.generated',
        data: {}
      };

      expect(validateRobotEvent(event)).toBe(false);
    });
  });
});

describe('Event Schema Properties', () => {
  test('all events have required base fields', () => {
    // Test that validation enforces required fields
    const incompleteEvent = {
      eventType: 'match.started',
      data: {}
    };

    expect(validateMatchEvent(incompleteEvent)).toBe(false);
  });

  test('event IDs are unique and properly formatted', () => {
    const validEventIds = [
      'evt_123',
      'evt_456789',
      'cmd_abc123',
      'res_xyz789'
    ];

    validEventIds.forEach(id => {
      expect(id).toMatch(/^[a-z]{3}_[a-z0-9]+$/);
    });
  });

  test('timestamps are valid unix timestamps', () => {
    const now = Date.now();
    const validTimestamps = [
      now,
      now - 1000,
      now + 1000
    ];

    validTimestamps.forEach(timestamp => {
      expect(timestamp).toBeGreaterThan(1000000000000); // After 2001
      expect(timestamp).toBeLessThan(4000000000000); // Before 2096
    });
  });
});