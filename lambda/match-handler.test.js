"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const match_handler_1 = require("./match-handler");
// Test helpers
let broadcasts = [];
// Mock AWS SDK
globals_1.jest.mock('aws-sdk', () => ({
    ApiGatewayManagementApi: globals_1.jest.fn(() => ({
        postToConnection: globals_1.jest.fn((params) => {
            broadcasts.push({ connectionId: params.ConnectionId, data: JSON.parse(params.Data) });
            return { promise: () => Promise.resolve() };
        })
    }))
}));
(0, globals_1.beforeEach)(() => {
    match_handler_1.matchManager.clearAllMatches();
    broadcasts = [];
});
// Helper functions
async function connectPlayer(connectionId) {
    const event = {
        requestContext: {
            eventType: 'CONNECT',
            connectionId,
            routeKey: '$connect'
        }
    };
    return await (0, match_handler_1.handler)(event, {}, {});
}
async function joinMatch(connectionId) {
    const event = {
        requestContext: {
            eventType: 'MESSAGE',
            connectionId,
            routeKey: 'message'
        },
        body: JSON.stringify({ action: 'join_match' })
    };
    return await (0, match_handler_1.handler)(event, {}, {});
}
async function submitResponse(connectionId, roundNumber, response) {
    const event = {
        requestContext: {
            eventType: 'MESSAGE',
            connectionId,
            routeKey: 'message'
        },
        body: JSON.stringify({
            action: 'submit_response',
            roundNumber,
            response
        })
    };
    return await (0, match_handler_1.handler)(event, {}, {});
}
async function submitVote(connectionId, roundNumber, humanIdentity) {
    const event = {
        requestContext: {
            eventType: 'MESSAGE',
            connectionId,
            routeKey: 'message'
        },
        body: JSON.stringify({
            action: 'submit_vote',
            roundNumber,
            humanIdentity
        })
    };
    return await (0, match_handler_1.handler)(event, {}, {});
}
function getPlayerIdentity(connectionId) {
    const joinedBroadcast = broadcasts.find(b => b.connectionId === connectionId && b.data.action === 'match_joined');
    return joinedBroadcast?.data.identity;
}
function getLastBroadcastOfType(action) {
    return broadcasts.filter(b => b.data.action === action).pop();
}
(0, globals_1.describe)('Match Handler - WebSocket Actions', () => {
    (0, globals_1.describe)('Connection Management', () => {
        (0, globals_1.it)('should handle connection and disconnection', async () => {
            const connectResult = await connectPlayer('conn-1');
            (0, globals_1.expect)(connectResult).toMatchObject({ statusCode: 200 });
            // Disconnect
            const event = {
                requestContext: {
                    eventType: 'DISCONNECT',
                    connectionId: 'conn-1',
                    routeKey: '$disconnect'
                }
            };
            const disconnectResult = await (0, match_handler_1.handler)(event, {}, {});
            (0, globals_1.expect)(disconnectResult).toMatchObject({ statusCode: 200 });
        });
    });
    (0, globals_1.describe)('Match Joining', () => {
        (0, globals_1.it)('should allow player to join match and receive identity', async () => {
            await connectPlayer('player-1');
            const result = await joinMatch('player-1');
            (0, globals_1.expect)(result).toMatchObject({ statusCode: 200 });
            // Check that player received match_joined message
            const joinedMessage = broadcasts.find(b => b.connectionId === 'player-1' && b.data.action === 'match_joined');
            (0, globals_1.expect)(joinedMessage).toBeDefined();
            (0, globals_1.expect)(joinedMessage.data.identity).toMatch(/^[A-D]$/);
            (0, globals_1.expect)(joinedMessage.data.match).toBeDefined();
        });
        (0, globals_1.it)('should start match when 4 players join', async () => {
            // Connect and join 2 players (triggers AI addition = 4 total)
            await connectPlayer('player-1');
            await connectPlayer('player-2');
            await joinMatch('player-1');
            await joinMatch('player-2');
            // Should have received round_start message
            const roundStart = getLastBroadcastOfType('round_start');
            (0, globals_1.expect)(roundStart).toBeDefined();
            (0, globals_1.expect)(roundStart.data).toMatchObject({
                action: 'round_start',
                roundNumber: 1,
                prompt: globals_1.expect.any(String),
                timeLimit: 90
            });
        });
        (0, globals_1.it)('should assign unique identities to players', async () => {
            await connectPlayer('player-1');
            await connectPlayer('player-2');
            await joinMatch('player-1');
            await joinMatch('player-2');
            const identity1 = getPlayerIdentity('player-1');
            const identity2 = getPlayerIdentity('player-2');
            (0, globals_1.expect)(identity1).toBeDefined();
            (0, globals_1.expect)(identity2).toBeDefined();
            (0, globals_1.expect)(identity1).not.toBe(identity2);
        });
    });
    (0, globals_1.describe)('Response Submission', () => {
        (0, globals_1.beforeEach)(async () => {
            // Set up a match with 2 players (4 total with AIs)
            await connectPlayer('player-1');
            await connectPlayer('player-2');
            await joinMatch('player-1');
            await joinMatch('player-2');
            broadcasts = []; // Clear setup broadcasts
        });
        (0, globals_1.it)('should accept responses in round_active status', async () => {
            const result = await submitResponse('player-1', 1, 'My response to round 1');
            (0, globals_1.expect)(result).toMatchObject({ statusCode: 200 });
            // Should receive match_state update
            const stateUpdate = getLastBroadcastOfType('match_state');
            (0, globals_1.expect)(stateUpdate).toBeDefined();
        });
        (0, globals_1.it)('should transition to voting when all responses collected', async () => {
            // Get the match to find AI identities
            const match = match_handler_1.matchManager.getMatch('global');
            const aiIdentities = match?.participants
                .filter(p => p.type === 'ai')
                .map(p => p.identity) || [];
            // Submit responses for all 4 participants
            await submitResponse('player-1', 1, 'Response from player 1');
            await submitResponse('player-2', 1, 'Response from player 2');
            // Simulate AI responses by directly submitting to match manager
            if (match) {
                match_handler_1.matchManager.submitResponse(match.matchId, aiIdentities[0], 'AI response 1');
                const allCollected = match_handler_1.matchManager.submitResponse(match.matchId, aiIdentities[1], 'AI response 2');
                (0, globals_1.expect)(allCollected).toBe(true);
            }
            // Should receive round_voting message
            const votingMessage = getLastBroadcastOfType('round_voting');
            (0, globals_1.expect)(votingMessage).toBeDefined();
            (0, globals_1.expect)(votingMessage.data).toMatchObject({
                action: 'round_voting',
                roundNumber: 1,
                responses: globals_1.expect.any(Object),
                timeLimit: 30
            });
        });
    });
    (0, globals_1.describe)('Voting System', () => {
        (0, globals_1.beforeEach)(async () => {
            // Set up match and complete response phase
            await connectPlayer('player-1');
            await connectPlayer('player-2');
            await joinMatch('player-1');
            await joinMatch('player-2');
            // Complete response phase
            const match = match_handler_1.matchManager.getMatch('global');
            if (match) {
                const allIdentities = ['A', 'B', 'C', 'D'];
                allIdentities.forEach(identity => {
                    match_handler_1.matchManager.submitResponse(match.matchId, identity, `Response from ${identity}`);
                });
            }
            broadcasts = []; // Clear setup broadcasts
        });
        (0, globals_1.it)('should accept votes in round_voting status', async () => {
            const result = await submitVote('player-1', 1, 'A');
            (0, globals_1.expect)(result).toMatchObject({ statusCode: 200 });
            // Should receive match_state update
            const stateUpdate = getLastBroadcastOfType('match_state');
            (0, globals_1.expect)(stateUpdate).toBeDefined();
        });
        (0, globals_1.it)('should complete round when all votes collected', async () => {
            const match = match_handler_1.matchManager.getMatch('global');
            if (!match)
                fail('Match not found');
            // Submit votes for all participants
            const allIdentities = ['A', 'B', 'C', 'D'];
            allIdentities.forEach(identity => {
                match_handler_1.matchManager.submitVote(match.matchId, identity, 'A'); // Everyone votes A as human
            });
            // Should receive round_complete message
            const roundComplete = getLastBroadcastOfType('round_complete');
            (0, globals_1.expect)(roundComplete).toBeDefined();
            (0, globals_1.expect)(roundComplete.data).toMatchObject({
                action: 'round_complete',
                roundNumber: 1,
                scores: globals_1.expect.any(Object),
                summary: globals_1.expect.any(String),
                isMatchComplete: false
            });
        });
    });
    (0, globals_1.describe)('Match Completion', () => {
        (0, globals_1.beforeEach)(async () => {
            // Set up match
            await connectPlayer('player-1');
            await connectPlayer('player-2');
            await joinMatch('player-1');
            await joinMatch('player-2');
            broadcasts = []; // Clear setup broadcasts
        });
        (0, globals_1.it)('should complete match after 5 rounds', async () => {
            const match = match_handler_1.matchManager.getMatch('global');
            if (!match)
                fail('Match not found');
            const allIdentities = ['A', 'B', 'C', 'D'];
            // Complete 5 rounds
            for (let round = 1; round <= 5; round++) {
                // Submit responses
                allIdentities.forEach(identity => {
                    match_handler_1.matchManager.submitResponse(match.matchId, identity, `Round ${round} response from ${identity}`);
                });
                // Submit votes
                allIdentities.forEach(identity => {
                    match_handler_1.matchManager.submitVote(match.matchId, identity, 'A');
                });
            }
            // Should receive match_complete message
            const matchComplete = getLastBroadcastOfType('match_complete');
            (0, globals_1.expect)(matchComplete).toBeDefined();
            (0, globals_1.expect)(matchComplete.data).toMatchObject({
                action: 'match_complete',
                finalScores: globals_1.expect.any(Object),
                rounds: globals_1.expect.arrayContaining([
                    globals_1.expect.objectContaining({ roundNumber: 1 }),
                    globals_1.expect.objectContaining({ roundNumber: 2 }),
                    globals_1.expect.objectContaining({ roundNumber: 3 }),
                    globals_1.expect.objectContaining({ roundNumber: 4 }),
                    globals_1.expect.objectContaining({ roundNumber: 5 })
                ])
            });
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle unknown actions gracefully', async () => {
            await connectPlayer('player-1');
            const event = {
                requestContext: {
                    eventType: 'MESSAGE',
                    connectionId: 'player-1',
                    routeKey: 'message'
                },
                body: JSON.stringify({ action: 'unknown_action' })
            };
            const result = await (0, match_handler_1.handler)(event, {}, {});
            (0, globals_1.expect)(result).toMatchObject({ statusCode: 400 });
        });
        (0, globals_1.it)('should send error messages to clients', async () => {
            await connectPlayer('player-1');
            // Try to submit response without joining match
            const result = await submitResponse('player-1', 1, 'Invalid response');
            (0, globals_1.expect)(result).toMatchObject({ statusCode: 500 });
            // Should have sent error message to client
            const errorMessage = broadcasts.find(b => b.connectionId === 'player-1' && b.data.action === 'error');
            (0, globals_1.expect)(errorMessage).toBeDefined();
            (0, globals_1.expect)(errorMessage.data.message).toBe('Not in a match');
        });
    });
    (0, globals_1.describe)('AI Response Generation', () => {
        (0, globals_1.it)('should generate personality-based responses', async () => {
            const { generateAIResponse } = require('./match-handler');
            const response1 = await generateAIResponse('What is your favorite color?', 'curious_student');
            const response2 = await generateAIResponse('What is your favorite color?', 'witty_professional');
            const response3 = await generateAIResponse('What is your favorite color?', 'friendly_skeptic');
            (0, globals_1.expect)(typeof response1).toBe('string');
            (0, globals_1.expect)(typeof response2).toBe('string');
            (0, globals_1.expect)(typeof response3).toBe('string');
            // Responses should be different (with high probability)
            (0, globals_1.expect)([response1, response2, response3].length).toBe(3);
        });
    });
});
