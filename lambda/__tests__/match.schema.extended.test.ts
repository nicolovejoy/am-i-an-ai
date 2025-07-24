import { IdentitySchema, MatchSchema } from '../shared/schemas/match.schema';

describe('Extended Identity System', () => {
  describe('IdentitySchema', () => {
    it('should accept identities A through D (current)', () => {
      const currentIdentities = ['A', 'B', 'C', 'D'];
      
      currentIdentities.forEach(identity => {
        const result = IdentitySchema.safeParse(identity);
        expect(result.success).toBe(true);
        expect(result.data).toBe(identity);
      });
    });

    it('should accept identities E through H (extended)', () => {
      const extendedIdentities = ['E', 'F', 'G', 'H'];
      
      extendedIdentities.forEach(identity => {
        const result = IdentitySchema.safeParse(identity);
        // This will fail until we extend the schema
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
        templateType: 'classic_1v3',
        status: 'round_active',
        totalParticipants: 3,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Player 1', playerName: 'Player 1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Player 2', playerName: 'Player 2', isConnected: true },
          { identity: 'C', isAI: true, displayName: 'AI Player', playerName: 'AI Player', isConnected: true }
        ],
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(match3Players);
      if (!result.success) {
        console.log('Match 3 players validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should validate match with 6 participants', () => {
      const match6Players = {
        matchId: 'match-456',
        templateType: 'classic_1v3',
        status: 'round_active',
        totalParticipants: 6,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Human 1', playerName: 'Human 1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Human 2', playerName: 'Human 2', isConnected: true },
          { identity: 'C', isAI: false, displayName: 'Human 3', playerName: 'Human 3', isConnected: true },
          { identity: 'D', isAI: true, displayName: 'AI 1', playerName: 'AI 1', isConnected: true },
          { identity: 'E', isAI: true, displayName: 'AI 2', playerName: 'AI 2', isConnected: true },
          { identity: 'F', isAI: true, displayName: 'AI 3', playerName: 'AI 3', isConnected: true }
        ],
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(match6Players);
      // This will fail until we extend the schema
      expect(result.success).toBe(true);
    });

    it('should validate match with 8 participants', () => {
      const match8Players = {
        matchId: 'match-789',
        templateType: 'classic_1v3',
        status: 'round_active',
        totalParticipants: 8,
        participants: Array.from({ length: 8 }, (_, i) => ({
          identity: String.fromCharCode(65 + i) as any, // A through H
          isAI: i >= 4,
          displayName: i < 4 ? `Human ${i + 1}` : `AI ${i - 3}`,
          playerName: i < 4 ? `Human ${i + 1}` : `AI ${i - 3}`,
          isConnected: true
        })),
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(match8Players);
      // This will fail until we extend the schema
      expect(result.success).toBe(true);
    });

    it('should enforce participant count matches totalParticipants', () => {
      const mismatchedMatch = {
        matchId: 'match-bad',
        templateType: 'classic_1v3',
        status: 'round_active',
        totalParticipants: 6,
        participants: [
          { identity: 'A', isAI: false, displayName: 'Human 1', playerName: 'Human 1', isConnected: true },
          { identity: 'B', isAI: false, displayName: 'Human 2', playerName: 'Human 2', isConnected: true },
          { identity: 'C', isAI: false, displayName: 'Human 3', playerName: 'Human 3', isConnected: true }
          // Missing 3 participants!
        ],
        currentRound: 1,
        totalRounds: 5,
        rounds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = MatchSchema.safeParse(mismatchedMatch);
      // This should fail once we add validation
      expect(result.success).toBe(false);
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