"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const handler_1 = require("./handler");
// Test helpers
let broadcasts = [];
// Mock AWS SDK
globals_1.jest.mock('aws-sdk', () => ({
    ApiGatewayManagementApi: globals_1.jest.fn(() => ({
        postToConnection: globals_1.jest.fn((params) => {
            broadcasts.push(JSON.parse(params.Data));
            return { promise: () => Promise.resolve() };
        })
    }))
}));
(0, globals_1.beforeEach)(() => {
    handler_1.sessions.clear();
    handler_1.connectionToSession.clear();
    broadcasts = [];
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
// async function startSession() {
//   // Trigger session start logic
//   return { success: true };
// }
function getSessionParticipants() {
    // Return current session participants from the global session
    const session = handler_1.sessions.get('global');
    if (!session)
        return [];
    return Array.from(session.connections.values()).map(conn => ({
        identity: conn.identity,
        isAI: conn.isAI,
        personality: conn.personality
    }));
}
async function advanceTime(ms) {
    globals_1.jest.advanceTimersByTime(ms);
}
async function createFullSession() {
    // Connect 2 humans, which automatically adds 2 AIs
    await connect('human-1');
    await connect('human-2');
    // AIs are added automatically, so session is now full
}
(0, globals_1.describe)('WebSocket Lambda Handler', () => {
    (0, globals_1.describe)('Connection Management', () => {
        (0, globals_1.it)('should handle $connect and assign A/B/C/D identity', async () => {
            // When connection is processed
            const result = await connect('test-connection-1');
            // Then should assign identity and store connection
            (0, globals_1.expect)(result).toMatchObject({
                identity: globals_1.expect.stringMatching(/^[A-D]$/),
                sessionId: globals_1.expect.any(String)
            });
        });
        (0, globals_1.it)('should limit sessions to exactly 4 participants', async () => {
            // Given 4 connections already exist
            for (let i = 1; i <= 4; i++) {
                await connect(`connection-${i}`);
            }
            // When 5th connection attempts to join
            const result = await connect('connection-5');
            // Then should reject with session full
            (0, globals_1.expect)(result.statusCode).toBe(403);
            (0, globals_1.expect)(result.body).toContain('Session full');
        });
        (0, globals_1.it)('should assign unique A/B/C/D identities', async () => {
            // When 2 humans connect (which triggers AI addition)
            await connect('human-1');
            await connect('human-2');
            // Get all participants (including AIs)
            const participants = getSessionParticipants();
            const identities = new Set(participants.map(p => p.identity));
            // Then each has unique identity
            (0, globals_1.expect)(identities.size).toBe(4);
            (0, globals_1.expect)([...identities].sort()).toEqual(['A', 'B', 'C', 'D']);
            // And we should have 2 humans and 2 AIs
            (0, globals_1.expect)(participants.filter(p => !p.isAI)).toHaveLength(2);
            (0, globals_1.expect)(participants.filter(p => p.isAI)).toHaveLength(2);
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
    (0, globals_1.describe)('AI Participant Integration', () => {
        (0, globals_1.it)('should inject 2 AI participants when only 2 humans join', async () => {
            // Given 2 human connections
            await connect('human-1');
            await connect('human-2');
            // When session starts (automatic after 2 humans)
            // Then 2 AI participants should be added
            const participants = getSessionParticipants();
            (0, globals_1.expect)(participants).toHaveLength(4);
            (0, globals_1.expect)(participants.filter(p => p.isAI)).toHaveLength(2);
        });
        (0, globals_1.it)('should assign different personalities to AI participants', async () => {
            // Given a session with 2 humans (triggers AI addition)
            await connect('human-1');
            await connect('human-2');
            // Then AI personalities should differ
            const participants = getSessionParticipants();
            const ais = participants.filter(p => p.isAI);
            (0, globals_1.expect)(ais[0].personality).not.toBe(ais[1].personality);
        });
    });
    (0, globals_1.describe)('Session Management', () => {
        (0, globals_1.it)('should enforce 10-minute session timer', async () => {
            globals_1.jest.useFakeTimers();
            // Given an active session
            await createFullSession();
            // When 10 minutes pass
            await advanceTime(10 * 60 * 1000);
            // Then session should end and reveal identities
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
