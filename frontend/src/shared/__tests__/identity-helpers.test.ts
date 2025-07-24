import {
  generateIdentities,
  getParticipantCount,
  hasAllResponses,
  getAIIdentities,
  isValidParticipantCount
} from '../identity-helpers';
import { Identity } from '../../schemas/match.schema';

describe('Identity Helpers', () => {
  describe('generateIdentities', () => {
    it('should generate correct identities for valid counts', () => {
      expect(generateIdentities(3)).toEqual(['A', 'B', 'C']);
      expect(generateIdentities(4)).toEqual(['A', 'B', 'C', 'D']);
      expect(generateIdentities(6)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
      expect(generateIdentities(8)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    });

    it('should throw error for invalid counts', () => {
      expect(() => generateIdentities(2)).toThrow('Invalid participant count: 2');
      expect(() => generateIdentities(9)).toThrow('Invalid participant count: 9');
      expect(() => generateIdentities(0)).toThrow('Invalid participant count: 0');
    });
  });

  describe('getParticipantCount', () => {
    it('should prefer totalParticipants when available', () => {
      const match = {
        totalParticipants: 6,
        participants: ['A', 'B', 'C', 'D'] // Different length
      };
      expect(getParticipantCount(match)).toBe(6);
    });

    it('should use participants array length when totalParticipants is undefined', () => {
      const match = {
        participants: ['A', 'B', 'C', 'D', 'E']
      };
      expect(getParticipantCount(match)).toBe(5);
    });

    it('should default to 4 when both are missing', () => {
      expect(getParticipantCount({})).toBe(4);
    });
  });

  describe('hasAllResponses', () => {
    it('should return true when all participants have responded', () => {
      const responses = { A: 'response1', B: 'response2', C: 'response3' };
      expect(hasAllResponses(responses, 3)).toBe(true);
    });

    it('should return false when not all participants have responded', () => {
      const responses = { A: 'response1', B: 'response2' };
      expect(hasAllResponses(responses, 3)).toBe(false);
    });

    it('should return false when there are extra responses', () => {
      const responses = { A: 'response1', B: 'response2', C: 'response3', D: 'response4' };
      expect(hasAllResponses(responses, 3)).toBe(false);
    });
  });

  describe('getAIIdentities', () => {
    it('should return correct AI identities', () => {
      const humanIdentities: Identity[] = ['A', 'C'];
      const aiIdentities = getAIIdentities(humanIdentities, 4);
      expect(aiIdentities).toEqual(['B', 'D']);
    });

    it('should work with larger participant counts', () => {
      const humanIdentities: Identity[] = ['A', 'B', 'C'];
      const aiIdentities = getAIIdentities(humanIdentities, 6);
      expect(aiIdentities).toEqual(['D', 'E', 'F']);
    });

    it('should return empty array when all are humans', () => {
      const humanIdentities: Identity[] = ['A', 'B', 'C'];
      const aiIdentities = getAIIdentities(humanIdentities, 3);
      expect(aiIdentities).toEqual([]);
    });
  });

  describe('isValidParticipantCount', () => {
    it('should return true for valid counts', () => {
      expect(isValidParticipantCount(3)).toBe(true);
      expect(isValidParticipantCount(4)).toBe(true);
      expect(isValidParticipantCount(6)).toBe(true);
      expect(isValidParticipantCount(8)).toBe(true);
    });

    it('should return false for invalid counts', () => {
      expect(isValidParticipantCount(2)).toBe(false);
      expect(isValidParticipantCount(9)).toBe(false);
      expect(isValidParticipantCount(0)).toBe(false);
      expect(isValidParticipantCount(-1)).toBe(false);
    });
  });
});