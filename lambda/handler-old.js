"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.connectionToMatch = exports.matches = void 0;
// DynamoDB storage for production
// import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
// const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
// const tableName = process.env.DYNAMODB_TABLE || 'amianai-v2-matches';
// In-memory cache for tests (export for testing)
exports.matches = new Map();
exports.connectionToMatch = new Map();
const handler = async (event) => {
    try {
        console.log('WebSocket event:', JSON.stringify(event, null, 2));
        const { eventType, connectionId, routeKey } = event.requestContext;
        switch (routeKey || eventType) {
            case '$connect':
            case 'CONNECT':
                return handleConnect(connectionId, event);
            case '$disconnect':
            case 'DISCONNECT':
                return handleDisconnect(connectionId);
            case 'message':
            case 'MESSAGE':
            case '$default':
                return handleMessage(connectionId, JSON.parse(event.body || '{}'), event);
            default:
                console.log('Unknown route/event:', routeKey, eventType);
                return { statusCode: 400, body: 'Unknown route' };
        }
    }
    catch (error) {
        console.error('Handler error:', error);
        return { statusCode: 500, body: 'Internal server error' };
    }
};
exports.handler = handler;
async function handleConnect(connectionId, _event) {
    // Find or create match (MVP: single global match)
    let match = exports.matches.get('global') || createMatch('global');
    // Check if match is full
    if (match.connections.size >= 4) {
        return { statusCode: 403, body: 'Match full' };
    }
    // Assign random available identity
    const usedIdentities = new Set([...match.connections.values()].map(c => c.identity));
    const availableIdentities = ['A', 'B', 'C', 'D'].filter(id => !usedIdentities.has(id));
    const randomIndex = Math.floor(Math.random() * availableIdentities.length);
    const identity = availableIdentities[randomIndex];
    // Store connection
    const connection = {
        connectionId,
        identity,
        matchId: match.id
    };
    match.connections.set(connectionId, connection);
    exports.connectionToMatch.set(connectionId, match.id);
    exports.matches.set(match.id, match);
    // MVP: When first human joins, immediately add 3 robot participants
    if (match.connections.size === 1) {
        await addRobotParticipants(match, _event);
        startMatchTimer(match);
        // Start first round after robots are added
        setTimeout(async () => {
            await broadcastToMatch(match, {
                action: 'round_start',
                round: 1,
                prompt: ROUND_PROMPTS[0]
            }, _event);
        }, 2000); // 2 second delay to let everything settle
    }
    console.log(`Connection ${connectionId} assigned identity ${identity} in match ${match.id}`);
    
    // Return connection details for tests
    return {
        statusCode: 200,
        body: JSON.stringify({
            identity,
            matchId: match.id
        })
    };
}
async function handleDisconnect(connectionId) {
    const matchId = exports.connectionToMatch.get(connectionId);
    if (!matchId)
        return { statusCode: 200 };
    const match = exports.matches.get(matchId);
    if (!match)
        return { statusCode: 200 };
    match.connections.delete(connectionId);
    exports.connectionToMatch.delete(connectionId);
    // Clean up empty matches
    if (match.connections.size === 0) {
        if (match.timer) {
            clearTimeout(match.timer);
        }
        exports.matches.delete(matchId);
    }
    return { statusCode: 200 };
}
async function handleMessage(connectionId, body, event) {
    const matchId = exports.connectionToMatch.get(connectionId);
    if (!matchId)
        return { statusCode: 400, body: 'Not in match' };
    const match = exports.matches.get(matchId);
    if (!match)
        return { statusCode: 400, body: 'Match not found' };
    const sender = match.connections.get(connectionId);
    if (!sender)
        return { statusCode: 400, body: 'Connection not found' };
    // Handle join action (both legacy 'join' and new 'join_match')
    if (body.action === 'join' || body.action === 'join_match') {
        const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
        const apiClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({ endpoint });
        const command = new client_apigatewaymanagementapi_1.PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify({
                action: 'match_joined',
                identity: sender.identity,
                matchId: match.id,
                status: 'waiting',
                currentRound: match.currentRound || 1,
                totalRounds: 5,
                participants: Array.from(match.connections.values()).map(conn => ({
                    identity: conn.identity,
                    isAI: conn.isAI || false
                }))
            }))
        });
        try {
            await apiClient.send(command);
        }
        catch (error) {
            console.error('Failed to send identity:', error);
        }
        // Broadcast updated participant list to all participants
        const participants = Array.from(match.connections.values()).map(conn => ({
            identity: conn.identity,
            isAI: conn.isAI || false,
            connectionId: conn.connectionId
        }));
        await broadcastToMatch(match, {
            action: 'participants',
            participants
        }, event);
        return { statusCode: 200 };
    }
    // Handle regular messages (support both legacy content format and new submit_response format)
    let content;
    if (body.action === 'submit_response') {
        content = body.response;
    }
    else {
        content = body.content;
    }
    const message = {
        sender: sender.identity,
        content: content,
        timestamp: Date.now()
    };
    match.messages.push(message);
    // Broadcast to all participants
    await broadcastToMatch(match, {
        action: 'message',
        ...message
    }, event);
    // Trigger robot responses if needed
    if (!sender.isAI) {
        await triggerRobotResponses(match, message, event);
    }
    return { statusCode: 200 };
}
function createMatch(id) {
    return {
        id,
        connections: new Map(),
        startTime: Date.now(),
        messages: [],
        currentRound: 1,
        roundContributions: new Map()
    };
}
async function addRobotParticipants(match, event) {
    // MVP: Add 3 robots (no personalities yet)
    const availableIdentities = ['A', 'B', 'C', 'D']
        .filter(id => ![...match.connections.values()].some(c => c.identity === id));
    for (let i = 0; i < 3; i++) {
        const robotConnection = {
            connectionId: `robot-${i}-${Date.now()}`,
            identity: availableIdentities[i],
            matchId: match.id,
            isAI: true
            // personality will be added in future iteration
        };
        match.connections.set(robotConnection.connectionId, robotConnection);
    }
    // Note: Participant list will be sent when client sends join_match message
}
async function broadcastToMatch(match, data, event) {
    // In test environment, don't actually broadcast via AWS SDK - tests will capture messages directly
    if (process.env.NODE_ENV === 'test') {
        // For tests, just log the broadcast - the test framework captures messages via mocks
        console.log('Test broadcast:', data);
        return;
    }
    else {
        // In production, use the API Gateway Management API
        const endpoint = process.env.WEBSOCKET_ENDPOINT ||
            `https://${event?.requestContext?.domainName}/${event?.requestContext?.stage}`;
        const apiClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({
            endpoint
        });
        // Broadcast to all real connections (skip AI connections as they don't have real WebSocket connections)
        const promises = [];
        for (const [connectionId, connection] of match.connections) {
            if (!connection.isAI) {
                const command = new client_apigatewaymanagementapi_1.PostToConnectionCommand({
                    ConnectionId: connectionId,
                    Data: Buffer.from(JSON.stringify(data))
                });
                promises.push(apiClient.send(command).catch(err => {
                    console.error(`Failed to send to ${connectionId}:`, err);
                }));
            }
        }
        await Promise.all(promises);
    }
}
// Round prompts for MVP
const ROUND_PROMPTS = [
    "What's your favorite hobby?",
    "Describe your perfect day",
    "What technology excites you?",
    "Share a memorable experience",
    "What makes you laugh?"
];
// Mock robot responses for each round
const ROBOT_RESPONSES = {
    1: [
        "I really enjoy reading science fiction novels in my spare time.",
        "Photography has become my passion lately - capturing everyday moments.",
        "I've been learning to cook different cuisines from around the world."
    ],
    2: [
        "A perfect day would start with coffee and a good book by the window.",
        "I'd love to spend it exploring a new city with no set plans.",
        "Just hanging out with friends and family, maybe a barbecue outside."
    ],
    3: [
        "AI and machine learning developments are fascinating to watch unfold.",
        "I'm really excited about renewable energy innovations.",
        "Virtual reality has so much potential for education and creativity."
    ],
    4: [
        "I remember the first time I saw the ocean - it was breathtaking.",
        "Moving to a new city was scary but ended up being amazing.",
        "Learning to ride a bike as a kid - felt like I could do anything."
    ],
    5: [
        "Silly animal videos always crack me up, especially cats being dramatic.",
        "My friends' terrible dad jokes somehow always get me.",
        "Comedy shows where everything goes wrong but somehow works out."
    ]
};
async function triggerRobotResponses(match, humanMessage, event) {
    const senderIdentity = humanMessage.sender;
    if (!senderIdentity)
        return;
    // Track that this participant contributed to current round
    if (!match.roundContributions.has(match.currentRound)) {
        match.roundContributions.set(match.currentRound, new Set());
    }
    match.roundContributions.get(match.currentRound).add(senderIdentity);
    // Get robots who haven't responded in this round yet
    const allContributors = match.roundContributions.get(match.currentRound);
    const robotConnections = [...match.connections.values()].filter(c => c.isAI && !allContributors.has(c.identity));
    // Each robot responds once per round
    for (let i = 0; i < robotConnections.length; i++) {
        const robot = robotConnections[i];
        const responses = ROBOT_RESPONSES[match.currentRound];
        const response = responses[i % responses.length];
        setTimeout(async () => {
            await handleMessage(robot.connectionId, {
                content: response
            }, event);
            // Check if round is complete (all 4 participants contributed)
            const updatedContributors = match.roundContributions.get(match.currentRound);
            updatedContributors.add(robot.identity);
            if (updatedContributors.size === 4) {
                await advanceToNextRound(match, event);
            }
        }, 2000 + i * 1000); // Stagger responses 2s, 3s, 4s
    }
}
async function advanceToNextRound(match, event) {
    if (match.currentRound >= 5) {
        // Start voting phase
        await startVotingPhase(match, event);
        return;
    }
    match.currentRound++;
    const nextPrompt = ROUND_PROMPTS[match.currentRound - 1];
    // Broadcast new round prompt to all participants
    setTimeout(async () => {
        await broadcastToMatch(match, {
            action: 'round_start',
            round: match.currentRound,
            prompt: nextPrompt
        }, event);
    }, 3000); // 3 second pause between rounds
}
async function startVotingPhase(match, event) {
    await broadcastToMatch(match, {
        action: 'voting_start',
        message: 'Time to vote! Who do you think is human vs robot?'
    }, event);
}
function startMatchTimer(match) {
    // 10-minute match timer
    match.timer = setTimeout(async () => {
        await endMatchAndReveal(match);
    }, 10 * 60 * 1000); // 10 minutes
}
async function endMatchAndReveal(match) {
    // Create identity reveal data
    const identities = {};
    for (const [, connection] of match.connections) {
        identities[connection.identity] = {
            type: connection.isAI ? 'ai' : 'human',
            name: connection.isAI ? `AI Assistant` : `Human User`,
            personality: connection.personality || undefined
        };
    }
    // Broadcast reveal to all participants
    await broadcastToMatch(match, {
        action: 'reveal',
        identities
    });
    // Clean up match
    if (match.timer) {
        clearTimeout(match.timer);
    }
    for (const connectionId of match.connections.keys()) {
        exports.connectionToMatch.delete(connectionId);
    }
    exports.matches.delete(match.id);
}
