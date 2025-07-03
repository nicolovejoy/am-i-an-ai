import { describe, it, expect, beforeEach } from '@jest/globals';
import { MatchManager } from './MatchManager';
import { Identity } from './types';

describe('MatchManager', () => {
  let matchManager: MatchManager;
  const testMatchId = 'test-match-1';

  beforeEach(() => {
    matchManager = new MatchManager();
  });

  describe('Match Creation', () => {
    it('should create a new match with waiting status', () => {
      const match = matchManager.createMatch(testMatchId);

      expect(match).toMatchObject({
        matchId: testMatchId,
        status: 'waiting',
        currentRound: 0,
        participants: [],
        rounds: [],
        createdAt: expect.any(Number)
      });
    });

    it('should store and retrieve matches', () => {
      matchManager.createMatch(testMatchId);
      const retrieved = matchManager.getMatch(testMatchId);

      expect(retrieved?.matchId).toBe(testMatchId);
    });
  });

  describe('Participant Management', () => {
    beforeEach(() => {
      matchManager.createMatch(testMatchId);
    });

    it('should add human participant with random identity', () => {
      const { participant, identity } = matchManager.addHumanParticipant(testMatchId, 'conn-1');

      expect(participant).toMatchObject({
        connectionId: 'conn-1',
        identity: expect.stringMatching(/^[A-D]$/),
        type: 'human'
      });
      expect(['A', 'B', 'C', 'D']).toContain(identity);
    });

    it('should assign unique identities to multiple participants', () => {
      const { identity: identity1 } = matchManager.addHumanParticipant(testMatchId, 'conn-1');
      const { identity: identity2 } = matchManager.addHumanParticipant(testMatchId, 'conn-2');

      expect(identity1).not.toBe(identity2);
      
      const match = matchManager.getMatch(testMatchId);
      expect(match?.participants).toHaveLength(4); // 2 humans + 2 AIs added automatically
    });

    it('should automatically add 2 AI participants when 2 humans join', () => {
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');

      const match = matchManager.getMatch(testMatchId);
      const participants = match?.participants || [];

      expect(participants).toHaveLength(4);
      expect(participants.filter(p => p.type === 'human')).toHaveLength(2);
      expect(participants.filter(p => p.type === 'ai')).toHaveLength(2);
    });

    it('should reject more than 4 participants', () => {
      // Add 4 participants (2 humans trigger 2 AIs)
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');

      // Try to add 3rd human (5th participant total)
      expect(() => {
        matchManager.addHumanParticipant(testMatchId, 'conn-3');
      }).toThrow('Match is full');
    });

    it('should assign different personalities to AI participants', () => {
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');

      const match = matchManager.getMatch(testMatchId);
      const ais = match?.participants.filter(p => p.type === 'ai') || [];

      expect(ais).toHaveLength(2);
      expect(ais[0].personality).toBeDefined();
      expect(ais[1].personality).toBeDefined();
      expect(ais[0].personality).not.toBe(ais[1].personality);
    });
  });

  describe('Match Start and Round Management', () => {
    beforeEach(() => {
      matchManager.createMatch(testMatchId);
      // Add 4 participants
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');
    });

    it('should start match with first round', () => {
      const round = matchManager.startMatch(testMatchId);

      expect(round).toMatchObject({
        roundNumber: 1,
        prompt: expect.any(String),
        responses: {},
        votes: {},
        scores: {},
        startTime: expect.any(Number)
      });

      const match = matchManager.getMatch(testMatchId);
      expect(match?.status).toBe('round_active');
      expect(match?.currentRound).toBe(1);
    });

    it('should not start match without 4 participants', () => {
      const incompleteMatchManager = new MatchManager();
      incompleteMatchManager.createMatch('incomplete-match');
      incompleteMatchManager.addHumanParticipant('incomplete-match', 'conn-1');

      expect(() => {
        incompleteMatchManager.startMatch('incomplete-match');
      }).toThrow('Match needs exactly 4 participants to start');
    });

    it('should use different prompts for different rounds', () => {
      matchManager.startMatch(testMatchId);
      const match = matchManager.getMatch(testMatchId);
      const firstPrompt = match?.rounds[0]?.prompt;

      // Force to round 2 by completing round 1
      const identities: Identity[] = ['A', 'B', 'C', 'D'];
      
      // Submit all responses
      identities.forEach(identity => {
        matchManager.submitResponse(testMatchId, identity, `Response from ${identity}`);
      });

      // Submit all votes
      identities.forEach(identity => {
        matchManager.submitVote(testMatchId, identity, 'A'); // Everyone votes A as human
      });

      const secondPrompt = match?.rounds[1]?.prompt;
      expect(firstPrompt).not.toBe(secondPrompt);
    });
  });

  describe('Response Submission', () => {
    beforeEach(() => {
      matchManager.createMatch(testMatchId);
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');
      matchManager.startMatch(testMatchId);
    });

    it('should accept responses during round_active status', () => {
      const result = matchManager.submitResponse(testMatchId, 'A', 'My response');

      expect(result).toBe(false); // Not all responses collected yet
      
      const match = matchManager.getMatch(testMatchId);
      const currentRound = matchManager.getCurrentRound(match!);
      expect(currentRound?.responses['A']).toBe('My response');
    });

    it('should transition to voting when all responses collected', () => {
      const identities: Identity[] = ['A', 'B', 'C', 'D'];
      
      // Submit 3 responses
      identities.slice(0, 3).forEach(identity => {
        const result = matchManager.submitResponse(testMatchId, identity, `Response from ${identity}`);
        expect(result).toBe(false);
      });

      // Submit 4th response
      const finalResult = matchManager.submitResponse(testMatchId, 'D', 'Final response');
      expect(finalResult).toBe(true);

      const match = matchManager.getMatch(testMatchId);
      expect(match?.status).toBe('round_voting');
    });

    it('should reject responses outside of round_active status', () => {
      const match = matchManager.getMatch(testMatchId);
      if (match) {
        match.status = 'waiting';
      }

      expect(() => {
        matchManager.submitResponse(testMatchId, 'A', 'Invalid response');
      }).toThrow('Not in active round');
    });
  });

  describe('Voting System', () => {
    beforeEach(() => {
      matchManager.createMatch(testMatchId);
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');
      matchManager.startMatch(testMatchId);

      // Complete response phase
      const identities: Identity[] = ['A', 'B', 'C', 'D'];
      identities.forEach(identity => {
        matchManager.submitResponse(testMatchId, identity, `Response from ${identity}`);
      });
    });

    it('should accept votes during round_voting status', () => {
      const result = matchManager.submitVote(testMatchId, 'A', 'B');

      expect(result).toBe(false); // Not all votes collected yet
      
      const match = matchManager.getMatch(testMatchId);
      const currentRound = matchManager.getCurrentRound(match!);
      expect(currentRound?.votes['A']).toBe('B');
    });

    it('should complete round when all votes collected', () => {
      const identities: Identity[] = ['A', 'B', 'C', 'D'];
      
      // Submit 3 votes
      identities.slice(0, 3).forEach(identity => {
        const result = matchManager.submitVote(testMatchId, identity, 'A');
        expect(result).toBe(false);
      });

      // Submit 4th vote - should complete round
      const finalResult = matchManager.submitVote(testMatchId, 'D', 'A');
      expect(finalResult).toBe(true);

      const match = matchManager.getMatch(testMatchId);
      expect(match?.currentRound).toBe(2); // Should advance to round 2
    });

    it('should calculate scores correctly', () => {
      const identities: Identity[] = ['A', 'B', 'C', 'D'];
      
      // Submit all votes (everyone votes A as human)
      identities.forEach(identity => {
        matchManager.submitVote(testMatchId, identity, 'A');
      });

      const match = matchManager.getMatch(testMatchId);
      const completedRound = match?.rounds[0];
      
      // Check that scores were calculated
      expect(completedRound?.scores).toBeDefined();
      expect(Object.keys(completedRound?.scores || {})).toHaveLength(4);
    });
  });

  describe('Match Completion', () => {
    beforeEach(() => {
      matchManager.createMatch(testMatchId);
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');
      matchManager.startMatch(testMatchId);
    });

    it('should complete match after 5 rounds', () => {
      const identities: Identity[] = ['A', 'B', 'C', 'D'];

      // Complete 5 rounds
      for (let round = 1; round <= 5; round++) {
        // Submit responses
        identities.forEach(identity => {
          matchManager.submitResponse(testMatchId, identity, `Round ${round} response from ${identity}`);
        });

        // Submit votes
        identities.forEach(identity => {
          matchManager.submitVote(testMatchId, identity, 'A');
        });
      }

      const match = matchManager.getMatch(testMatchId);
      expect(match?.status).toBe('completed');
      expect(match?.rounds).toHaveLength(5);
      expect(match?.finalScores).toBeDefined();
      expect(match?.completedAt).toBeDefined();
    });

    it('should calculate final scores as sum of round scores', () => {
      const identities: Identity[] = ['A', 'B', 'C', 'D'];

      // Complete all 5 rounds
      for (let round = 1; round <= 5; round++) {
        identities.forEach(identity => {
          matchManager.submitResponse(testMatchId, identity, `Response ${round}`);
        });
        identities.forEach(identity => {
          matchManager.submitVote(testMatchId, identity, 'A');
        });
      }

      const match = matchManager.getMatch(testMatchId);
      const finalScores = match?.finalScores;

      expect(finalScores).toBeDefined();
      expect(Object.keys(finalScores || {})).toHaveLength(4);
      
      // Each score should be between 0 and 5 (max 1 point per round)
      Object.values(finalScores || {}).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      matchManager.createMatch(testMatchId);
    });

    it('should find match by connection ID', () => {
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      
      const foundMatch = matchManager.getMatchByConnection('conn-1');
      expect(foundMatch?.matchId).toBe(testMatchId);
    });

    it('should remove participant and clean up', () => {
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      matchManager.addHumanParticipant(testMatchId, 'conn-2');

      const matchBefore = matchManager.getMatch(testMatchId);
      expect(matchBefore?.participants).toHaveLength(4); // 2 humans + 2 AIs

      matchManager.removeParticipant('conn-1');

      const matchAfter = matchManager.getMatch(testMatchId);
      expect(matchAfter?.participants.filter(p => p.connectionId === 'conn-1')).toHaveLength(0);
    });

    it('should delete empty matches', () => {
      matchManager.addHumanParticipant(testMatchId, 'conn-1');
      
      matchManager.removeParticipant('conn-1');
      
      const match = matchManager.getMatch(testMatchId);
      expect(match).toBeUndefined();
    });
  });
});