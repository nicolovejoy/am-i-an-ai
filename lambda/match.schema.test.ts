import { describe, it, expect } from '@jest/globals';
import { MatchSchema, Match, Participant, Round } from '../shared/schemas/match.schema';

describe('Match Schema Validation', () => {
  // Helper to create a valid participant
  const createParticipant = (overrides?: Partial<Participant>): Participant => ({
    identity: 'A',
    isAI: false,
    playerName: 'Test Player',
    isConnected: true,
    ...overrides
  });

  // Helper to create a valid round
  const createRound = (overrides?: Partial<Round>): Round => ({
    roundNumber: 1,
    prompt: 'Test prompt',
    responses: {},
    votes: {},
    scores: {},
    status: 'responding',
    ...overrides
  });

  // Helper to create base match data
  const createBaseMatch = (overrides?: Partial<Match>): any => ({
    matchId: 'test-123',
    status: 'waiting',
    currentRound: 1,
    totalRounds: 5,
    participants: [],
    rounds: [createRound()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  describe('Template-based participant validation', () => {
    it('should allow variable participants based on template during waiting_for_players', () => {
      // Classic 1v3 - waiting with just 1 human
      const waitingClassic = createBaseMatch({
        status: 'waiting_for_players',
        templateType: 'classic_1v3',
        totalParticipants: 4,
        participants: [createParticipant({ displayName: 'Alice' })],
        waitingFor: { humans: 0, ai: 3 }
      });
      
      expect(() => MatchSchema.parse(waitingClassic)).not.toThrow();
      
      // Duo 2v2 - waiting with 1 human (need 1 more)
      const waitingDuo = createBaseMatch({
        status: 'waiting_for_players',
        templateType: 'duo_2v2',
        totalParticipants: 4,
        participants: [createParticipant({ displayName: 'Alice' })],
        waitingFor: { humans: 1, ai: 2 }
      });
      
      expect(() => MatchSchema.parse(waitingDuo)).not.toThrow();
    });

    it('should allow exact participant count when match is active', () => {
      // Active match with exactly 4 participants
      const activeMatch = createBaseMatch({
        status: 'round_active',
        templateType: 'duo_2v2',
        totalParticipants: 4,
        participants: [
          createParticipant({ identity: 'A', displayName: 'Alice' }),
          createParticipant({ identity: 'B', displayName: 'Bob' }),
          createParticipant({ identity: 'C', isAI: true, playerName: 'AI-1' }),
          createParticipant({ identity: 'D', isAI: true, playerName: 'AI-2' })
        ]
      });
      
      expect(() => MatchSchema.parse(activeMatch)).not.toThrow();
    });

    it('should reject too many participants during waiting', () => {
      // Waiting match with too many participants
      const tooManyWaiting = createBaseMatch({
        status: 'waiting_for_players',
        templateType: 'duo_2v2',
        totalParticipants: 4,
        participants: [
          createParticipant({ identity: 'A' }),
          createParticipant({ identity: 'B' }),
          createParticipant({ identity: 'C' }),
          createParticipant({ identity: 'D' }),
          createParticipant({ identity: 'E' }) // Too many!
        ]
      });
      
      expect(() => MatchSchema.parse(tooManyWaiting)).toThrow();
    });

    it('should reject wrong participant count for active matches', () => {
      // Active match with wrong count (3 instead of 4)
      const wrongCountActive = createBaseMatch({
        status: 'round_active',
        templateType: 'duo_2v2',
        totalParticipants: 4,
        participants: [
          createParticipant({ identity: 'A' }),
          createParticipant({ identity: 'B' }),
          createParticipant({ identity: 'C' })
        ]
      });
      
      expect(() => MatchSchema.parse(wrongCountActive)).toThrow();
    });

    it('should handle admin_custom template', () => {
      // Admin custom template with 3 participants waiting
      const customWaiting = createBaseMatch({
        status: 'waiting_for_players',
        templateType: 'admin_custom',
        totalParticipants: 4,
        participants: [
          createParticipant({ displayName: 'Admin' }),
          createParticipant({ displayName: 'Player1' }),
          createParticipant({ displayName: 'Player2' })
        ],
        waitingFor: { humans: 0, ai: 1 }
      });
      
      expect(() => MatchSchema.parse(customWaiting)).not.toThrow();
      
      // Same template when active with all 4 participants
      const customActive = createBaseMatch({
        status: 'round_active',
        templateType: 'admin_custom',
        totalParticipants: 4,
        participants: [
          createParticipant({ identity: 'A', displayName: 'Admin' }),
          createParticipant({ identity: 'B', displayName: 'Player1' }),
          createParticipant({ identity: 'C', displayName: 'Player2' }),
          createParticipant({ identity: 'D', isAI: true, playerName: 'AI-Bot' })
        ]
      });
      
      expect(() => MatchSchema.parse(customActive)).not.toThrow();
    });

    it('should default to 4 participants when totalParticipants not specified', () => {
      // Legacy match without totalParticipants field
      const legacyMatch = createBaseMatch({
        status: 'round_active',
        participants: [
          createParticipant({ identity: 'A' }),
          createParticipant({ identity: 'B' }),
          createParticipant({ identity: 'C' }),
          createParticipant({ identity: 'D' })
        ]
      });
      delete legacyMatch.totalParticipants;
      
      expect(() => MatchSchema.parse(legacyMatch)).not.toThrow();
    });
  });

  describe('Existing validations still work', () => {
    it('should validate all required fields', () => {
      const validMatch = createBaseMatch({
        participants: [
          createParticipant({ identity: 'A' }),
          createParticipant({ identity: 'B' }),
          createParticipant({ identity: 'C' }),
          createParticipant({ identity: 'D' })
        ]
      });
      
      const parsed = MatchSchema.parse(validMatch);
      expect(parsed.matchId).toBe('test-123');
      expect(parsed.status).toBe('waiting');
      expect(parsed.participants).toHaveLength(4);
    });

    it('should reject invalid status values', () => {
      const invalidStatus = createBaseMatch({
        status: 'invalid_status' as any,
        participants: Array(4).fill(null).map((_, i) => 
          createParticipant({ identity: String.fromCharCode(65 + i) as any })
        )
      });
      
      expect(() => MatchSchema.parse(invalidStatus)).toThrow();
    });
  });
});