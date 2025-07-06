"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MatchManager_1 = require("../MatchManager");
// Mock event broadcasting - we'll test the logic without actual API calls
const mockBroadcastToMatch = jest.fn();
describe('Robot Auto-Responses - TDD', () => {
    let matchManager;
    let mockEvent;
    beforeEach(() => {
        matchManager = new MatchManager_1.MatchManager();
        mockEvent = { requestContext: { domainName: 'test', stage: 'test' } };
        jest.clearAllMocks();
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    describe('Robot Response Generation', () => {
        it('should auto-generate robot responses after human submits', async () => {
            // FAILING TEST - robots should respond automatically
            // Arrange: Create match with 1 human + 3 robots
            const matchId = 'test-match-1';
            const match = matchManager.createMatch(matchId);
            const { participant } = matchManager.addHumanParticipant(matchId, 'human-conn-1');
            // Start the match (this should add 3 robots)
            const round = matchManager.startMatch(matchId);
            const updatedMatch = matchManager.getMatch(matchId);
            expect(updatedMatch?.participants).toHaveLength(4);
            expect(updatedMatch?.participants.filter(p => p.type === 'ai')).toHaveLength(3);
            // Act: Human submits response
            const allResponsesCollected = matchManager.submitResponse(matchId, participant.identity, 'I love sunny days at the beach!');
            // Fast-forward 5 seconds for robot responses
            jest.advanceTimersByTime(5000);
            // Assert: All 3 robots should have auto-generated responses
            const finalMatch = matchManager.getMatch(matchId);
            const currentRound = finalMatch?.rounds.find(r => r.roundNumber === 1);
            expect(currentRound?.responses).toHaveProperty(participant.identity);
            expect(Object.keys(currentRound?.responses || {})).toHaveLength(4); // Human + 3 robots
            // Each robot response should be different and non-empty
            const robotIdentities = finalMatch?.participants
                .filter(p => p.type === 'ai')
                .map(p => p.identity) || [];
            robotIdentities.forEach(identity => {
                expect(currentRound?.responses?.[identity]).toBeTruthy();
                expect((currentRound?.responses?.[identity] || '').length).toBeGreaterThan(10);
            });
            // All robot responses should be unique
            const robotResponses = robotIdentities.map(id => currentRound?.responses?.[id]);
            const uniqueResponses = new Set(robotResponses);
            expect(uniqueResponses.size).toBe(robotIdentities.length);
        });
        it('should generate personality-based robot responses', () => {
            // FAILING TEST - each robot should have distinct personality
            const matchId = 'test-match-2';
            matchManager.createMatch(matchId);
            matchManager.addHumanParticipant(matchId, 'human-conn-1');
            matchManager.startMatch(matchId);
            const match = matchManager.getMatch(matchId);
            const robots = match?.participants.filter(p => p.type === 'ai') || [];
            expect(robots).toHaveLength(3);
            // Each robot should have a different personality
            const personalities = robots.map(r => r.personality);
            const uniquePersonalities = new Set(personalities);
            expect(uniquePersonalities.size).toBe(3);
            // Test response generation for each personality
            robots.forEach(robot => {
                const response = matchManager.generateRobotResponse(robot.identity, 'What makes you happy?', robot.personality || 'curious_student');
                expect(response).toBeTruthy();
                expect(response.length).toBeGreaterThan(15);
                expect(response.length).toBeLessThan(280);
            });
        });
        it('should advance round to voting when all responses collected', async () => {
            // FAILING TEST - round should auto-advance after all 4 responses
            const matchId = matchManager.createMatch();
            matchManager.addHumanParticipant(matchId, 'human-conn-1');
            matchManager.startMatch(matchId);
            // Submit human response
            await handleSubmitResponse('human-conn-1', {
                action: 'submit_response',
                roundNumber: 1,
                response: 'My favorite memory is from last summer.'
            }, mockEvent);
            // Fast-forward past robot response time
            jest.advanceTimersByTime(6000);
            // Round should now be in voting phase
            const match = matchManager.getMatch(matchId);
            const currentRound = match?.rounds.find(r => r.roundNumber === 1);
            expect(currentRound?.phase).toBe('voting');
            expect(Object.keys(currentRound?.responses || {})).toHaveLength(4);
            // Should trigger voting start event
            expect(mockBroadcastToMatch).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                action: 'voting_start',
                roundNumber: 1,
                responses: expect.any(Object)
            }), mockEvent);
        });
    });
    describe('Robot Response Quality', () => {
        it('should generate human-like responses that reference the prompt', () => {
            // FAILING TEST - responses should feel authentic
            const prompts = [
                "What's one thing that recently surprised you in a good way?",
                "If you could teleport anywhere right now, where would you go?",
                "What's a small thing that often makes your day better?"
            ];
            prompts.forEach(prompt => {
                const response = matchManager.generateRobotResponse('A', prompt, 'witty_professional');
                // Should be conversational length
                expect(response.length).toBeGreaterThan(20);
                expect(response.length).toBeLessThan(200);
                // Should not be too generic
                expect(response).not.toMatch(/^(Yes|No|I think|Maybe|I don't know)/);
                // Should include some personal touch or specificity
                expect(response).toMatch(/\b(I|my|me|recently|actually|really|just|yesterday|today)\b/i);
            });
        });
        it('should vary response timing like humans', async () => {
            // FAILING TEST - robots should respond at different times, not simultaneously
            const startTime = Date.now();
            const matchId = matchManager.createMatch();
            matchManager.addHumanParticipant(matchId, 'human-conn-1');
            matchManager.startMatch(matchId);
            // Submit human response
            await handleSubmitResponse('human-conn-1', {
                action: 'submit_response',
                roundNumber: 1,
                response: 'Test message'
            }, mockEvent);
            // Track when each robot responds
            const responseTimes = [];
            const originalBroadcast = mockBroadcastToMatch;
            mockBroadcastToMatch.mockImplementation((match, message) => {
                if (message.action === 'robot_response') {
                    responseTimes.push(Date.now() - startTime);
                }
                return originalBroadcast(match, message);
            });
            // Fast-forward and check response timing
            for (let i = 0; i < 10; i++) {
                jest.advanceTimersByTime(500);
            }
            // Should have 3 robot responses at different times
            expect(responseTimes).toHaveLength(3);
            // Response times should be spread out (not all at once)
            const minGap = Math.min(...responseTimes.slice(1).map((time, i) => time - responseTimes[i]));
            expect(minGap).toBeGreaterThan(500); // At least 500ms between responses
        });
    });
});
