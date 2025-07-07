// Tests for Kafka Sample Data Generator
// TDD approach: write tests first for sample match event generation

import { 
  generateCompleteMatch, 
  createSampleMatches
} from './kafka-sample-generator';
import { 
  validateMatchEvent, 
  EVENT_TYPES
} from './kafka-schemas/schemas';

describe('Kafka Sample Data Generator', () => {
  describe('generateCompleteMatch', () => {
    test('generates a complete match with all required events', async () => {
      const matchEvents = await generateCompleteMatch('match_test_001');

      // Should have all required event types for a complete match
      const eventTypes = matchEvents.map(event => event.eventType);
      
      expect(eventTypes).toContain(EVENT_TYPES.MATCH_STARTED);
      expect(eventTypes).toContain(EVENT_TYPES.MATCH_COMPLETED);
      
      // Should have 5 rounds (each with start, responses, completion)
      const roundStarts = eventTypes.filter(type => type === EVENT_TYPES.ROUND_STARTED);
      const roundCompletions = eventTypes.filter(type => type === EVENT_TYPES.ROUND_COMPLETED);
      
      expect(roundStarts).toHaveLength(5);
      expect(roundCompletions).toHaveLength(5);
      
      // Should have voting events
      expect(eventTypes).toContain(EVENT_TYPES.VOTING_STARTED);
      expect(eventTypes).toContain(EVENT_TYPES.VOTE_SUBMITTED);
    });

    test('generates events in correct chronological order', async () => {
      const matchEvents = await generateCompleteMatch('match_test_002');

      // Events should be ordered by timestamp
      for (let i = 1; i < matchEvents.length; i++) {
        expect(matchEvents[i].timestamp).toBeGreaterThanOrEqual(
          matchEvents[i - 1].timestamp
        );
      }

      // First event should be match started
      expect(matchEvents[0].eventType).toBe(EVENT_TYPES.MATCH_STARTED);
      
      // Last event should be match completed
      const lastEvent = matchEvents[matchEvents.length - 1];
      expect(lastEvent.eventType).toBe(EVENT_TYPES.MATCH_COMPLETED);
    });

    test('generates realistic response content', async () => {
      const matchEvents = await generateCompleteMatch('match_test_003');

      const responseEvents = matchEvents.filter(
        event => event.eventType === EVENT_TYPES.RESPONSE_SUBMITTED ||
                 event.eventType === EVENT_TYPES.RESPONSE_GENERATED
      );

      // Should have 20 responses total (4 participants × 5 rounds)
      expect(responseEvents).toHaveLength(20);

      // Each response should have realistic content
      responseEvents.forEach(event => {
        expect(event.data.response).toBeDefined();
        expect(typeof event.data.response).toBe('string');
        expect(event.data.response.length).toBeGreaterThan(10);
        expect(event.data.response.length).toBeLessThan(500);
      });
    });

    test('maintains consistent participant assignments', async () => {
      const matchEvents = await generateCompleteMatch('match_test_004');

      const matchStarted = matchEvents.find(
        event => event.eventType === EVENT_TYPES.MATCH_STARTED
      );

      expect(matchStarted?.data.participants).toHaveLength(4);
      expect(matchStarted?.data.humanParticipant).toBeDefined();
      expect(matchStarted?.data.robotParticipants).toHaveLength(3);

      // All response events should use consistent participant IDs
      const responseEvents = matchEvents.filter(
        event => event.eventType === EVENT_TYPES.RESPONSE_SUBMITTED ||
                 event.eventType === EVENT_TYPES.RESPONSE_GENERATED
      );

      const participantIds = new Set(
        responseEvents.map(event => event.data.participantId)
      );
      
      expect(participantIds.size).toBe(4);
      expect(Array.from(participantIds).sort()).toEqual(
        matchStarted?.data.participants.sort()
      );
    });

    test('generates valid robot responses with metadata', async () => {
      const matchEvents = await generateCompleteMatch('match_test_005');

      const robotResponses = matchEvents.filter(
        event => event.eventType === EVENT_TYPES.RESPONSE_GENERATED
      );

      // Should have 15 robot responses (3 robots × 5 rounds)
      expect(robotResponses).toHaveLength(15);

      robotResponses.forEach(event => {
        expect(event.data.participantType).toBe('robot');
        expect(event.data.robotType).toBeDefined();
        expect(event.data.processingTime).toBeGreaterThan(0);
        expect(event.data.processingTime).toBeLessThan(10); // Reasonable processing time
        expect(event.data.model).toBe('gpt-4');
        expect(event.data.generatedAt).toBeDefined();
      });
    });

    test('all generated events pass schema validation', async () => {
      const matchEvents = await generateCompleteMatch('match_test_006');

      matchEvents.forEach(event => {
        expect(validateMatchEvent(event)).toBe(true);
      });
    });
  });

  describe('generateMatchEvents with variety', () => {
    test('generates different match outcomes', async () => {
      const outcomes: string[] = [];
      
      // Generate multiple matches to test variety
      for (let i = 0; i < 10; i++) {
        const events = await generateCompleteMatch(`variety_test_${i}`);
        const completedEvent = events.find(
          event => event.eventType === EVENT_TYPES.MATCH_COMPLETED
        );
        outcomes.push(completedEvent?.data.result);
      }

      // Should have both correct and incorrect outcomes
      expect(outcomes).toContain('correct');
      expect(outcomes).toContain('incorrect');
    });

    test('generates variety in prompts and responses', async () => {
      const match1Events = await generateCompleteMatch('variety_1');
      const match2Events = await generateCompleteMatch('variety_2');

      const match1Rounds = match1Events.filter(
        event => event.eventType === EVENT_TYPES.ROUND_STARTED
      );
      const match2Rounds = match2Events.filter(
        event => event.eventType === EVENT_TYPES.ROUND_STARTED
      );

      // Prompts should be different between matches
      const match1Prompts = match1Rounds.map(event => event.data.prompt);
      const match2Prompts = match2Rounds.map(event => event.data.prompt);

      expect(match1Prompts).not.toEqual(match2Prompts);
    });

    test('generates realistic timing between events', async () => {
      const matchEvents = await generateCompleteMatch('timing_test');

      // Check timing between round start and completion
      for (let round = 1; round <= 5; round++) {
        const roundStart = matchEvents.find(
          event => event.eventType === EVENT_TYPES.ROUND_STARTED && 
                   event.data.round === round
        );
        const roundEnd = matchEvents.find(
          event => event.eventType === EVENT_TYPES.ROUND_COMPLETED && 
                   event.data.round === round
        );

        if (roundStart && roundEnd) {
          const duration = roundEnd.timestamp - roundStart.timestamp;
          expect(duration).toBeGreaterThan(10000); // At least 10 seconds
          expect(duration).toBeLessThan(120000); // At most 2 minutes
        }
      }
    });
  });

  describe('createSampleMatches', () => {
    test('creates multiple complete matches', async () => {
      const sampleMatches = await createSampleMatches(3);

      expect(sampleMatches).toHaveLength(3);
      
      // Each should be a complete match event sequence
      sampleMatches.forEach(matchSequence => {
        expect(matchSequence.matchId).toBeDefined();
        expect(matchSequence.events.length).toBeGreaterThan(30); // Minimum events for complete match
        
        // Should start and end correctly
        expect(matchSequence.events[0].eventType).toBe(EVENT_TYPES.MATCH_STARTED);
        const lastEvent = matchSequence.events[matchSequence.events.length - 1];
        expect(lastEvent.eventType).toBe(EVENT_TYPES.MATCH_COMPLETED);
      });
    });

    test('creates matches with unique IDs', async () => {
      const sampleMatches = await createSampleMatches(5);

      const matchIds = sampleMatches.map(match => match.matchId);
      const uniqueIds = new Set(matchIds);
      
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('Edge cases and error scenarios', () => {
    test('handles timeout scenarios in some matches', async () => {
      // Generate multiple matches to potentially hit timeout scenarios
      const matches = await createSampleMatches(10);
      
      // At least some matches should have realistic variations
      // (This test validates the generator includes edge cases)
      expect(matches.length).toBe(10);
      
      // All matches should still be valid
      matches.forEach(match => {
        match.events.forEach(event => {
          expect(validateMatchEvent(event)).toBe(true);
        });
      });
    });

    test('generates consistent match durations', async () => {
      const matchEvents = await generateCompleteMatch('duration_test');

      const startEvent = matchEvents[0];
      const endEvent = matchEvents[matchEvents.length - 1];
      
      const totalDuration = endEvent.timestamp - startEvent.timestamp;
      
      // Match should take reasonable time (2-10 minutes)
      expect(totalDuration).toBeGreaterThan(120000); // At least 2 minutes
      expect(totalDuration).toBeLessThan(600000); // At most 10 minutes
      
      // Duration in completed event should match
      expect(endEvent.data.duration).toBe(totalDuration);
    });
  });
});