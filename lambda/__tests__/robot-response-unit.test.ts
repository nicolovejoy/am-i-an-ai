import { MatchManager } from '../MatchManager';

describe('Robot Response Unit Tests', () => {
  let matchManager: MatchManager;

  beforeEach(() => {
    matchManager = new MatchManager();
  });

  it('should generate robot responses automatically when human submits', () => {
    // Create match with 1 human + 3 robots
    const matchId = 'test-match';
    matchManager.createMatch(matchId);
    matchManager.addHumanParticipant(matchId, 'human-1');
    matchManager.addAIParticipants(matchId);
    matchManager.startMatch(matchId);

    // Get the match and verify setup
    const match = matchManager.getMatch(matchId);
    expect(match?.participants).toHaveLength(4);
    expect(match?.participants.filter(p => p.type === 'human')).toHaveLength(1);
    expect(match?.participants.filter(p => p.type === 'ai')).toHaveLength(3);

    // Get human identity
    const humanParticipant = match?.participants.find(p => p.type === 'human');
    const humanIdentity = humanParticipant?.identity;

    // Submit human response
    matchManager.submitResponse(matchId, humanIdentity!, 'Human response here');

    // Check that all 4 responses are now present
    const currentRound = matchManager.getCurrentRound(match!);
    expect(Object.keys(currentRound?.responses || {})).toHaveLength(4);

    // Verify robot responses exist and are unique
    const robotResponses = match?.participants
      .filter(p => p.type === 'ai')
      .map(p => currentRound?.responses[p.identity])
      .filter(Boolean);

    expect(robotResponses).toHaveLength(3);
    
    // Each response should be non-empty
    robotResponses?.forEach(response => {
      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(10);
    });

    // Responses should be unique
    const uniqueResponses = new Set(robotResponses);
    expect(uniqueResponses.size).toBe(3);
  });

  it('should generate personality-based responses', () => {
    const personalities = ['curious_student', 'witty_professional', 'friendly_skeptic'] as const;
    const prompt = 'What makes you happy?';

    personalities.forEach(personality => {
      const response = matchManager.generateRobotResponse('A', prompt, personality);
      
      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(10);
      expect(response.length).toBeLessThan(280);
      
      // Should not be identical for different personalities
      const otherPersonality = personalities.find(p => p !== personality)!;
      const otherResponse = matchManager.generateRobotResponse('B', prompt, otherPersonality);
      expect(response).not.toBe(otherResponse);
    });
  });

  it('should transition to voting after all responses collected', () => {
    const matchId = 'test-match-2';
    matchManager.createMatch(matchId);
    matchManager.addHumanParticipant(matchId, 'human-1');
    matchManager.addAIParticipants(matchId);
    matchManager.startMatch(matchId);

    const match = matchManager.getMatch(matchId);
    const humanParticipant = match?.participants.find(p => p.type === 'human');

    // Before response - should be in round_active
    expect(match?.status).toBe('round_active');

    // Submit human response (triggers robot responses)
    const allCollected = matchManager.submitResponse(
      matchId, 
      humanParticipant!.identity, 
      'Test response'
    );

    // Should return true (all responses collected)
    expect(allCollected).toBe(true);

    // Match should now be in voting phase
    expect(match?.status).toBe('round_voting');
  });
});