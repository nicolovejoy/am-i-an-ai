import { MatchManager } from '../MatchManager';

describe('Robot Auto-Responses - TDD Simple', () => {
  let matchManager: MatchManager;

  beforeEach(() => {
    matchManager = new MatchManager();
  });

  describe('Core Robot Response Features', () => {
    it('should have generateRobotResponse method', () => {
      // FAILING TEST - method should exist
      expect(typeof matchManager.generateRobotResponse).toBe('function');
    });

    it('should auto-generate robot responses when human submits', () => {
      // FAILING TEST - robots should respond automatically
      
      const matchId = 'test-match-1';
      matchManager.createMatch(matchId);
      const { participant } = matchManager.addHumanParticipant(matchId, 'human-conn-1');
      
      // For testing mode, manually add AI participants to reach 4 total
      matchManager.addAIParticipants(matchId);
      
      matchManager.startMatch(matchId);
      
      // Submit human response
      matchManager.submitResponse(
        matchId,
        participant.identity,
        'I love sunny days at the beach!'
      );
      
      // Check that robots have auto-responded
      const match = matchManager.getMatch(matchId);
      const currentRound = match?.rounds.find(r => r.roundNumber === 1);
      
      // Should have 4 responses total (1 human + 3 robots)
      expect(Object.keys(currentRound?.responses || {})).toHaveLength(4);
      
      // Each robot should have a non-empty response
      const robotIdentities = match?.participants
        .filter(p => p.type === 'ai')
        .map(p => p.identity) || [];
      
      robotIdentities.forEach(identity => {
        const response = currentRound?.responses?.[identity];
        expect(response).toBeTruthy();
        expect(response!.length).toBeGreaterThan(5);
      });
    });

    it('should generate different responses for different robots', () => {
      // FAILING TEST - each robot should have unique responses
      
      const response1 = matchManager.generateRobotResponse('A', 'What makes you happy?', 'curious_student');
      const response2 = matchManager.generateRobotResponse('B', 'What makes you happy?', 'witty_professional'); 
      const response3 = matchManager.generateRobotResponse('C', 'What makes you happy?', 'friendly_skeptic');
      
      // All responses should be different
      expect(response1).not.toBe(response2);
      expect(response2).not.toBe(response3);
      expect(response1).not.toBe(response3);
      
      // All should be reasonable length
      [response1, response2, response3].forEach(response => {
        expect(response.length).toBeGreaterThan(10);
        expect(response.length).toBeLessThan(280);
      });
    });

    it('should advance round to voting when all responses collected', () => {
      // FAILING TEST - round status should change
      
      const matchId = 'test-match-2';
      matchManager.createMatch(matchId);
      const { participant } = matchManager.addHumanParticipant(matchId, 'human-conn-1');
      
      // Add AI participants to reach 4 total
      matchManager.addAIParticipants(matchId);
      
      matchManager.startMatch(matchId);
      
      // Before submission - should be in response phase
      const beforeMatch = matchManager.getMatch(matchId);
      expect(beforeMatch?.status).toBe('round_active');
      
      // Submit human response (should trigger auto robot responses)
      matchManager.submitResponse(matchId, participant.identity, 'Test response');
      
      // After all responses - should advance to voting
      const afterMatch = matchManager.getMatch(matchId);
      expect(afterMatch?.status).toBe('round_voting');
    });
  });
});