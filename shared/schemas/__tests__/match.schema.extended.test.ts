import { z } from 'zod';
import { IdentitySchema, MatchSchema } from '../match.schema';

describe('Extended Identity System', () => {
  describe('IdentitySchema', () => {
    it('should accept identities A through H', () => {
      const validIdentities = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      
      validIdentities.forEach(identity => {
        const result = IdentitySchema.safeParse(identity);
        expect(result.success).toBe(true);
        expect(result.data).toBe(identity);
      });
    });

    it('should reject invalid identities', () => {
      const invalidIdentities = ['I', 'J', 'Z', '1', 'a', ''];
      
      invalidIdentities.forEach(identity => {
        const result = IdentitySchema.safeParse(identity);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Match with variable participants', () => {
    it('should validate match with 3 participants', () => {
      const match3Players = {
        matchId: 'match-123',
        templateType: 'duel_2v1',
        status: 'active',
        totalParticipants: 3,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Player 1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Player 2', isConnected: true },
          { identity: 'C', isAI: true, displayName: 'AI Player', isConnected: true }
        ],
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(match3Players);
      expect(result.success).toBe(true);
    });

    it('should validate match with 6 participants', () => {
      const match6Players = {
        matchId: 'match-456',
        templateType: 'trio_3v3',
        status: 'active',
        totalParticipants: 6,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Human 1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Human 2', isConnected: true },
          { identity: 'C', isAI: false, displayName: 'Human 3', isConnected: true },
          { identity: 'D', isAI: true, displayName: 'AI 1', isConnected: true },
          { identity: 'E', isAI: true, displayName: 'AI 2', isConnected: true },
          { identity: 'F', isAI: true, displayName: 'AI 3', isConnected: true }
        ],
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(match6Players);
      expect(result.success).toBe(true);
    });

    it('should validate match with 8 participants', () => {
      const match8Players = {
        matchId: 'match-789',
        templateType: 'mega_4v4',
        status: 'active',
        totalParticipants: 8,
        participants: Array.from({ length: 8 }, (_, i) => ({
          identity: String.fromCharCode(65 + i) as any, // A through H
          isAI: i >= 4,
          displayName: i < 4 ? `Human ${i + 1}` : `AI ${i - 3}`,
          isConnected: true
        })),
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(match8Players);
      expect(result.success).toBe(true);
    });

    it('should enforce participant count matches totalParticipants', () => {
      const mismatchedMatch = {
        matchId: 'match-bad',
        templateType: 'trio_3v3',
        status: 'active',
        totalParticipants: 6,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Human 1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Human 2', isConnected: true },
          { identity: 'C', isAI: false, displayName: 'Human 3', isConnected: true }
          // Missing 3 participants!
        ],
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(mismatchedMatch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Participant count must match totalParticipants');
      }
    });
  });

  describe('Round responses with extended identities', () => {
    it('should accept responses from identities E-H', () => {
      const roundWith6Players = {
        roundNumber: 1,
        prompt: 'Test prompt',
        responses: {
          A: 'Response from A',
          B: 'Response from B', 
          C: 'Response from C',
          D: 'Response from D',
          E: 'Response from E',
          F: 'Response from F'
        },
        votes: {},
        scores: {},
        presentationOrder: ['C', 'A', 'F', 'B', 'E', 'D'] as any[]
      };

      // This test will fail until we extend the schema
      const RoundSchema = z.object({
        roundNumber: z.number(),
        prompt: z.string(),
        responses: z.record(IdentitySchema, z.string()),
        votes: z.record(IdentitySchema, IdentitySchema),
        scores: z.record(IdentitySchema, z.number()),
        presentationOrder: z.array(IdentitySchema).optional()
      });

      const result = RoundSchema.safeParse(roundWith6Players);
      expect(result.success).toBe(true);
    });
  });
});

// Helper function tests
describe('Identity generation helpers', () => {
  it('should generate correct identities for different participant counts', () => {
    const getIdentities = (count: number): string[] => {
      return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
    };

    expect(getIdentities(3)).toEqual(['A', 'B', 'C']);
    expect(getIdentities(4)).toEqual(['A', 'B', 'C', 'D']);
    expect(getIdentities(6)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(getIdentities(8)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  it('should validate participant counts', () => {
    const isValidParticipantCount = (count: number): boolean => {
      return count >= 3 && count <= 8;
    };

    expect(isValidParticipantCount(2)).toBe(false);
    expect(isValidParticipantCount(3)).toBe(true);
    expect(isValidParticipantCount(4)).toBe(true);
    expect(isValidParticipantCount(8)).toBe(true);
    expect(isValidParticipantCount(9)).toBe(false);
  });
});