"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const MatchManager_1 = require("./MatchManager");
(0, globals_1.describe)('MatchManager', () => {
    let matchManager;
    const testMatchId = 'test-match-1';
    (0, globals_1.beforeEach)(() => {
        matchManager = new MatchManager_1.MatchManager();
    });
    (0, globals_1.describe)('Match Creation', () => {
        (0, globals_1.it)('should create a new match with waiting status', () => {
            const match = matchManager.createMatch(testMatchId);
            (0, globals_1.expect)(match).toMatchObject({
                matchId: testMatchId,
                status: 'waiting',
                currentRound: 0,
                participants: [],
                rounds: [],
                createdAt: globals_1.expect.any(Number)
            });
        });
        (0, globals_1.it)('should store and retrieve matches', () => {
            matchManager.createMatch(testMatchId);
            const retrieved = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(retrieved?.matchId).toBe(testMatchId);
        });
    });
    (0, globals_1.describe)('Participant Management', () => {
        (0, globals_1.beforeEach)(() => {
            matchManager.createMatch(testMatchId);
        });
        (0, globals_1.it)('should add human participant with random identity', () => {
            const { participant, identity } = matchManager.addHumanParticipant(testMatchId, 'conn-1');
            (0, globals_1.expect)(participant).toMatchObject({
                connectionId: 'conn-1',
                identity: globals_1.expect.stringMatching(/^[A-D]$/),
                type: 'human'
            });
            (0, globals_1.expect)(['A', 'B', 'C', 'D']).toContain(identity);
        });
        (0, globals_1.it)('should assign unique identities to multiple participants', () => {
            const { identity: identity1 } = matchManager.addHumanParticipant(testMatchId, 'conn-1');
            const { identity: identity2 } = matchManager.addHumanParticipant(testMatchId, 'conn-2');
            (0, globals_1.expect)(identity1).not.toBe(identity2);
            const match = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(match?.participants).toHaveLength(4); // 2 humans + 2 AIs added automatically
        });
        (0, globals_1.it)('should automatically add 2 AI participants when 2 humans join', () => {
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            const match = matchManager.getMatch(testMatchId);
            const participants = match?.participants || [];
            (0, globals_1.expect)(participants).toHaveLength(4);
            (0, globals_1.expect)(participants.filter(p => p.type === 'human')).toHaveLength(2);
            (0, globals_1.expect)(participants.filter(p => p.type === 'ai')).toHaveLength(2);
        });
        (0, globals_1.it)('should reject more than 4 participants', () => {
            // Add 4 participants (2 humans trigger 2 AIs)
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            // Try to add 3rd human (5th participant total)
            (0, globals_1.expect)(() => {
                matchManager.addHumanParticipant(testMatchId, 'conn-3');
            }).toThrow('Match is full');
        });
        (0, globals_1.it)('should assign different personalities to AI participants', () => {
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            const match = matchManager.getMatch(testMatchId);
            const ais = match?.participants.filter(p => p.type === 'ai') || [];
            (0, globals_1.expect)(ais).toHaveLength(2);
            (0, globals_1.expect)(ais[0].personality).toBeDefined();
            (0, globals_1.expect)(ais[1].personality).toBeDefined();
            (0, globals_1.expect)(ais[0].personality).not.toBe(ais[1].personality);
        });
    });
    (0, globals_1.describe)('Match Start and Round Management', () => {
        (0, globals_1.beforeEach)(() => {
            matchManager.createMatch(testMatchId);
            // Add 4 participants
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
        });
        (0, globals_1.it)('should start match with first round', () => {
            const round = matchManager.startMatch(testMatchId);
            (0, globals_1.expect)(round).toMatchObject({
                roundNumber: 1,
                prompt: globals_1.expect.any(String),
                responses: {},
                votes: {},
                scores: {},
                startTime: globals_1.expect.any(Number)
            });
            const match = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(match?.status).toBe('round_active');
            (0, globals_1.expect)(match?.currentRound).toBe(1);
        });
        (0, globals_1.it)('should not start match without 4 participants', () => {
            const incompleteMatchManager = new MatchManager_1.MatchManager();
            incompleteMatchManager.createMatch('incomplete-match');
            incompleteMatchManager.addHumanParticipant('incomplete-match', 'conn-1');
            (0, globals_1.expect)(() => {
                incompleteMatchManager.startMatch('incomplete-match');
            }).toThrow('Match needs exactly 4 participants to start');
        });
        (0, globals_1.it)('should use different prompts for different rounds', () => {
            matchManager.startMatch(testMatchId);
            const match = matchManager.getMatch(testMatchId);
            const firstPrompt = match?.rounds[0]?.prompt;
            // Force to round 2 by completing round 1
            const identities = ['A', 'B', 'C', 'D'];
            // Submit all responses
            identities.forEach(identity => {
                matchManager.submitResponse(testMatchId, identity, `Response from ${identity}`);
            });
            // Submit all votes
            identities.forEach(identity => {
                matchManager.submitVote(testMatchId, identity, 'A'); // Everyone votes A as human
            });
            const secondPrompt = match?.rounds[1]?.prompt;
            (0, globals_1.expect)(firstPrompt).not.toBe(secondPrompt);
        });
    });
    (0, globals_1.describe)('Response Submission', () => {
        (0, globals_1.beforeEach)(() => {
            matchManager.createMatch(testMatchId);
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            matchManager.startMatch(testMatchId);
        });
        (0, globals_1.it)('should accept responses during round_active status', () => {
            const result = matchManager.submitResponse(testMatchId, 'A', 'My response');
            (0, globals_1.expect)(result).toBe(false); // Not all responses collected yet
            const match = matchManager.getMatch(testMatchId);
            const currentRound = matchManager.getCurrentRound(match);
            (0, globals_1.expect)(currentRound?.responses['A']).toBe('My response');
        });
        (0, globals_1.it)('should transition to voting when all responses collected', () => {
            const identities = ['A', 'B', 'C', 'D'];
            // Submit 3 responses
            identities.slice(0, 3).forEach(identity => {
                const result = matchManager.submitResponse(testMatchId, identity, `Response from ${identity}`);
                (0, globals_1.expect)(result).toBe(false);
            });
            // Submit 4th response
            const finalResult = matchManager.submitResponse(testMatchId, 'D', 'Final response');
            (0, globals_1.expect)(finalResult).toBe(true);
            const match = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(match?.status).toBe('round_voting');
        });
        (0, globals_1.it)('should reject responses outside of round_active status', () => {
            const match = matchManager.getMatch(testMatchId);
            if (match) {
                match.status = 'waiting';
            }
            (0, globals_1.expect)(() => {
                matchManager.submitResponse(testMatchId, 'A', 'Invalid response');
            }).toThrow('Not in active round');
        });
    });
    (0, globals_1.describe)('Voting System', () => {
        (0, globals_1.beforeEach)(() => {
            matchManager.createMatch(testMatchId);
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            matchManager.startMatch(testMatchId);
            // Complete response phase
            const identities = ['A', 'B', 'C', 'D'];
            identities.forEach(identity => {
                matchManager.submitResponse(testMatchId, identity, `Response from ${identity}`);
            });
        });
        (0, globals_1.it)('should accept votes during round_voting status', () => {
            const result = matchManager.submitVote(testMatchId, 'A', 'B');
            (0, globals_1.expect)(result).toBe(false); // Not all votes collected yet
            const match = matchManager.getMatch(testMatchId);
            const currentRound = matchManager.getCurrentRound(match);
            (0, globals_1.expect)(currentRound?.votes['A']).toBe('B');
        });
        (0, globals_1.it)('should complete round when all votes collected', () => {
            const identities = ['A', 'B', 'C', 'D'];
            // Submit 3 votes
            identities.slice(0, 3).forEach(identity => {
                const result = matchManager.submitVote(testMatchId, identity, 'A');
                (0, globals_1.expect)(result).toBe(false);
            });
            // Submit 4th vote - should complete round
            const finalResult = matchManager.submitVote(testMatchId, 'D', 'A');
            (0, globals_1.expect)(finalResult).toBe(true);
            const match = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(match?.currentRound).toBe(2); // Should advance to round 2
        });
        (0, globals_1.it)('should calculate scores correctly', () => {
            const identities = ['A', 'B', 'C', 'D'];
            // Submit all votes (everyone votes A as human)
            identities.forEach(identity => {
                matchManager.submitVote(testMatchId, identity, 'A');
            });
            const match = matchManager.getMatch(testMatchId);
            const completedRound = match?.rounds[0];
            // Check that scores were calculated
            (0, globals_1.expect)(completedRound?.scores).toBeDefined();
            (0, globals_1.expect)(Object.keys(completedRound?.scores || {})).toHaveLength(4);
        });
    });
    (0, globals_1.describe)('Match Completion', () => {
        (0, globals_1.beforeEach)(() => {
            matchManager.createMatch(testMatchId);
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            matchManager.startMatch(testMatchId);
        });
        (0, globals_1.it)('should complete match after 5 rounds', () => {
            const identities = ['A', 'B', 'C', 'D'];
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
            (0, globals_1.expect)(match?.status).toBe('completed');
            (0, globals_1.expect)(match?.rounds).toHaveLength(5);
            (0, globals_1.expect)(match?.finalScores).toBeDefined();
            (0, globals_1.expect)(match?.completedAt).toBeDefined();
        });
        (0, globals_1.it)('should calculate final scores as sum of round scores', () => {
            const identities = ['A', 'B', 'C', 'D'];
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
            (0, globals_1.expect)(finalScores).toBeDefined();
            (0, globals_1.expect)(Object.keys(finalScores || {})).toHaveLength(4);
            // Each score should be between 0 and 5 (max 1 point per round)
            Object.values(finalScores || {}).forEach(score => {
                (0, globals_1.expect)(score).toBeGreaterThanOrEqual(0);
                (0, globals_1.expect)(score).toBeLessThanOrEqual(5);
            });
        });
    });
    (0, globals_1.describe)('Connection Management', () => {
        (0, globals_1.beforeEach)(() => {
            matchManager.createMatch(testMatchId);
        });
        (0, globals_1.it)('should find match by connection ID', () => {
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            const foundMatch = matchManager.getMatchByConnection('conn-1');
            (0, globals_1.expect)(foundMatch?.matchId).toBe(testMatchId);
        });
        (0, globals_1.it)('should remove participant and clean up', () => {
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.addHumanParticipant(testMatchId, 'conn-2');
            const matchBefore = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(matchBefore?.participants).toHaveLength(4); // 2 humans + 2 AIs
            matchManager.removeParticipant('conn-1');
            const matchAfter = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(matchAfter?.participants.filter(p => p.connectionId === 'conn-1')).toHaveLength(0);
        });
        (0, globals_1.it)('should delete empty matches', () => {
            matchManager.addHumanParticipant(testMatchId, 'conn-1');
            matchManager.removeParticipant('conn-1');
            const match = matchManager.getMatch(testMatchId);
            (0, globals_1.expect)(match).toBeUndefined();
        });
    });
});
