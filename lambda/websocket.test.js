"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const handler_1 = require("./handler");
// Test helpers
let broadcasts = [];
// Mock AWS SDK v2
globals_1.jest.mock('aws-sdk', () => ({
    ApiGatewayManagementApi: globals_1.jest.fn(() => ({
        postToConnection: globals_1.jest.fn((params) => {
            broadcasts.push(JSON.parse(params.Data));
            return { promise: () => Promise.resolve() };
        })
    }))
}));
// Mock AWS SDK v3
globals_1.jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => ({
    ApiGatewayManagementApiClient: globals_1.jest.fn(() => ({
        send: globals_1.jest.fn((command) => {
            const data = command.Data ? command.Data.toString() : command.input.Data.toString();
            broadcasts.push(JSON.parse(data));
            return Promise.resolve();
        })
    })),
    PostToConnectionCommand: globals_1.jest.fn((params) => ({
        input: params,
        Data: params.Data
    }))
}));
(0, globals_1.beforeEach)(() => {
    handler_1.matches.clear();
    handler_1.connectionToMatch.clear();
    broadcasts = [];
    process.env.NODE_ENV = 'test';
});
// Helper functions
async function connect(connectionId) {
    const event = {
        requestContext: {
            eventType: 'CONNECT',
            connectionId,
            routeKey: '$connect'
        }
    };
    const result = await (0, handler_1.handler)(event, {}, {});
    if (result && typeof result === 'object' && 'statusCode' in result && result.statusCode === 200) {
        const body = JSON.parse(result.body || '{}');
        return body;
    }
    return result;
}
async function sendMessage(connectionId, content) {
    const event = {
        requestContext: {
            eventType: 'MESSAGE',
            connectionId,
            routeKey: 'message'
        },
        body: JSON.stringify({ action: 'message', content })
    };
    return (0, handler_1.handler)(event, {}, {});
}
// async function startMatch() {
//   // Trigger session start logic
//   return { success: true };
// }
function getMatchParticipants() {
    // Return current match participants from the global match
    const match = handler_1.matches.get('global');
    if (!match)
        return [];
    return Array.from(match.connections.values()).map(conn => ({
        identity: conn.identity,
        isAI: conn.isAI,
        personality: conn.personality
    }));
}
async function advanceTime(ms) {
    globals_1.jest.advanceTimersByTime(ms);
}
async function createFullMatch() {
    // Connect 1 human, which automatically adds 3 robots
    await connect('human-1');
    // Robots are added automatically, so match is now full
}
(0, globals_1.describe)('WebSocket Lambda Handler', () => {
    (0, globals_1.describe)('Response Submission Protocol', () => {
        (0, globals_1.it)('should handle submit_response action from frontend', async () => {
            // Given a connected user in an active match
            await connect('test-connection');
            // When frontend sends submit_response action
            const event = {
                requestContext: {
                    eventType: 'MESSAGE',
                    connectionId: 'test-connection',
                    routeKey: 'message',
                    domainName: 'test.execute-api.us-east-1.amazonaws.com',
                    stage: 'test'
                },
                body: JSON.stringify({
                    action: 'submit_response',
                    roundNumber: 1,
                    response: 'My favorite hobby is reading sci-fi novels.'
                })
            };
            const result = await (0, handler_1.handler)(event, {}, {});
            // Then should respond with success
            (0, globals_1.expect)(result).toEqual({ statusCode: 200 });
            // And should broadcast the response as a message
            (0, globals_1.expect)(broadcasts).toContainEqual(globals_1.expect.objectContaining({
                action: 'message',
                sender: globals_1.expect.stringMatching(/^[A-D]$/),
                content: 'My favorite hobby is reading sci-fi novels.',
                timestamp: globals_1.expect.any(Number)
            }));
        });
        (0, globals_1.it)('should handle legacy content-only messages for backward compatibility', async () => {
            // Given a connected user
            await connect('test-connection-legacy');
            // When backend receives legacy content message
            const event = {
                requestContext: {
                    eventType: 'MESSAGE',
                    connectionId: 'test-connection-legacy',
                    routeKey: 'message',
                    domainName: 'test.execute-api.us-east-1.amazonaws.com',
                    stage: 'test'
                },
                body: JSON.stringify({ content: 'Legacy message format' })
            };
            const result = await (0, handler_1.handler)(event, {}, {});
            // Then should respond with success
            (0, globals_1.expect)(result).toEqual({ statusCode: 200 });
            // And should broadcast the message
            (0, globals_1.expect)(broadcasts).toContainEqual(globals_1.expect.objectContaining({
                action: 'message',
                sender: globals_1.expect.stringMatching(/^[A-D]$/),
                content: 'Legacy message format',
                timestamp: globals_1.expect.any(Number)
            }));
        });
    });
    (0, globals_1.describe)('Join Protocol Compatibility', () => {
        (0, globals_1.it)('should handle join_match action from frontend', async () => {
            // Given a connected user
            await connect('test-connection');
            // When frontend sends join_match action
            const event = {
                requestContext: {
                    eventType: 'MESSAGE',
                    connectionId: 'test-connection',
                    routeKey: 'message',
                    domainName: 'test.execute-api.us-east-1.amazonaws.com',
                    stage: 'test'
                },
                body: JSON.stringify({ action: 'join_match' })
            };
            const result = await (0, handler_1.handler)(event, {}, {});
            // Then should respond with success (proving the action was recognized)
            (0, globals_1.expect)(result).toEqual({ statusCode: 200 });
            // And should send participants update (from broadcastToMatch call)
            (0, globals_1.expect)(broadcasts).toContainEqual(globals_1.expect.objectContaining({
                action: 'participants',
                participants: globals_1.expect.arrayContaining([
                    globals_1.expect.objectContaining({
                        identity: globals_1.expect.stringMatching(/^[A-D]$/),
                        isAI: false,
                        connectionId: 'test-connection'
                    })
                ])
            }));
        });
        (0, globals_1.it)('should handle legacy join action for backward compatibility', async () => {
            // Given a connected user
            await connect('test-connection-2');
            // When backend receives legacy join action
            const event = {
                requestContext: {
                    eventType: 'MESSAGE',
                    connectionId: 'test-connection-2',
                    routeKey: 'message',
                    domainName: 'test.execute-api.us-east-1.amazonaws.com',
                    stage: 'test'
                },
                body: JSON.stringify({ action: 'join' })
            };
            const result = await (0, handler_1.handler)(event, {}, {});
            // Then should respond with success
            (0, globals_1.expect)(result).toEqual({ statusCode: 200 });
            (0, globals_1.expect)(broadcasts).toContainEqual(globals_1.expect.objectContaining({
                action: 'connected',
                identity: globals_1.expect.stringMatching(/^[A-D]$/),
                matchId: 'global'
            }));
        });
    });
    (0, globals_1.describe)('Connection Management', () => {
        (0, globals_1.it)('should handle $connect and assign A/B/C/D identity', async () => {
            // When connection is processed
            const result = await connect('test-connection-1');
            // Then should assign identity and store connection
            (0, globals_1.expect)(result).toMatchObject({
                identity: globals_1.expect.stringMatching(/^[A-D]$/),
                matchId: globals_1.expect.any(String)
            });
        });
        (0, globals_1.it)('should limit matches to exactly 4 participants', async () => {
            // Given 4 connections already exist
            for (let i = 1; i <= 4; i++) {
                await connect(`connection-${i}`);
            }
            // When 5th connection attempts to join
            const result = await connect('connection-5');
            // Then should reject with match full
            (0, globals_1.expect)(result.statusCode).toBe(403);
            (0, globals_1.expect)(result.body).toContain('Match full');
        });
        (0, globals_1.it)('should assign unique A/B/C/D identities', async () => {
            // When 1 human connects (which triggers 3 robot additions)
            await connect('human-1');
            // Get all participants (including robots)
            const participants = getMatchParticipants();
            const identities = new Set(participants.map(p => p.identity));
            // Then each has unique identity
            (0, globals_1.expect)(identities.size).toBe(4);
            (0, globals_1.expect)([...identities].sort()).toEqual(['A', 'B', 'C', 'D']);
            // And we should have 1 human and 3 robots
            (0, globals_1.expect)(participants.filter(p => !p.isAI)).toHaveLength(1);
            (0, globals_1.expect)(participants.filter(p => p.isAI)).toHaveLength(3);
        });
    });
    (0, globals_1.describe)('Message Broadcasting', () => {
        (0, globals_1.it)('should broadcast messages to all participants', async () => {
            // Given 4 connected participants
            const connectionIds = ['conn-1', 'conn-2', 'conn-3', 'conn-4'];
            await Promise.all(connectionIds.map(connect));
            // When participant A sends a message
            await sendMessage('conn-1', 'Hello everyone!');
            // Then all participants receive it
            (0, globals_1.expect)(broadcasts).toHaveLength(4);
            (0, globals_1.expect)(broadcasts[0]).toMatchObject({
                action: 'message',
                sender: 'A',
                content: 'Hello everyone!',
                timestamp: globals_1.expect.any(Number)
            });
        });
        (0, globals_1.it)('should maintain sender anonymity as A/B/C/D', async () => {
            // Given connected participants
            const senderData = await connect('sender-connection');
            // When sending a message
            await sendMessage('sender-connection', 'Test message');
            // Then message shows identity not connectionId
            (0, globals_1.expect)(broadcasts[0].sender).toBe(senderData.identity);
            (0, globals_1.expect)(broadcasts[0].sender).not.toBe('sender-connection');
        });
    });
    (0, globals_1.describe)('Robot Participant Integration', () => {
        (0, globals_1.it)('should inject 3 robots when 1 human joins', async () => {
            // Given 1 human connection
            await connect('human-1');
            // Then 3 robot participants should be added automatically
            const participants = getMatchParticipants();
            (0, globals_1.expect)(participants).toHaveLength(4);
            (0, globals_1.expect)(participants.filter(p => p.isAI)).toHaveLength(3);
            (0, globals_1.expect)(participants.filter(p => !p.isAI)).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('Match Management', () => {
        (0, globals_1.it)('should enforce 10-minute match timer', async () => {
            globals_1.jest.useFakeTimers();
            // Given an active match
            await createFullMatch();
            // When 10 minutes pass
            await advanceTime(10 * 60 * 1000);
            // Then match should end and reveal identities
            const reveals = broadcasts.filter(b => b.action === 'reveal');
            (0, globals_1.expect)(reveals).toHaveLength(2); // One reveal per real WebSocket connection (2 humans)
            (0, globals_1.expect)(reveals[0]).toMatchObject({
                action: 'reveal',
                identities: {
                    A: { type: 'human', name: 'Human User' },
                    B: { type: 'human', name: 'Human User' },
                    C: { type: 'ai', name: 'AI Assistant', personality: 'analytical' },
                    D: { type: 'ai', name: 'AI Assistant', personality: 'creative' }
                }
            });
            globals_1.jest.useRealTimers();
        });
    });
});
