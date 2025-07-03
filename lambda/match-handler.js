"use strict";
/**
 * New WebSocket handler for 5-Round Match System
 * Clean Match/Round architecture with proper action handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.matchManager = void 0;
exports.generateAIResponse = generateAIResponse;
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
const MatchManager_1 = require("./MatchManager");
// Global match manager instance (in production, this would use DynamoDB)
exports.matchManager = new MatchManager_1.MatchManager();
const handler = async (event) => {
    try {
        console.log('WebSocket event:', JSON.stringify(event, null, 2));
        const { eventType, connectionId, routeKey } = event.requestContext;
        switch (routeKey || eventType) {
            case '$connect':
            case 'CONNECT':
                return handleConnect(connectionId);
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
async function handleConnect(connectionId) {
    console.log(`Connection established: ${connectionId}`);
    return { statusCode: 200 };
}
async function handleDisconnect(connectionId) {
    console.log(`Connection disconnected: ${connectionId}`);
    // Remove participant from any active match
    exports.matchManager.removeParticipant(connectionId);
    return { statusCode: 200 };
}
async function handleMessage(connectionId, message, event) {
    console.log(`Handling message from ${connectionId}:`, message);
    try {
        switch (message.action) {
            case 'join_match':
                return await handleJoinMatch(connectionId, message, event);
            case 'submit_response':
                return await handleSubmitResponse(connectionId, message, event);
            case 'submit_vote':
                return await handleSubmitVote(connectionId, message, event);
            default:
                console.log('Unknown action:', message.action);
                return { statusCode: 400, body: 'Unknown action' };
        }
    }
    catch (error) {
        console.error(`Error handling ${message.action}:`, error);
        // Send error to client
        await sendToConnection(connectionId, {
            action: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, event);
        return { statusCode: 500, body: 'Message handling error' };
    }
}
async function handleJoinMatch(connectionId, _message, event) {
    // For MVP, use a single global match
    const matchId = 'global';
    // Get or create match
    let match = exports.matchManager.getMatch(matchId);
    if (!match) {
        match = exports.matchManager.createMatch(matchId);
    }
    // Add human participant
    const { identity } = exports.matchManager.addHumanParticipant(matchId, connectionId);
    console.log(`Player ${connectionId} joined as ${identity}`);
    // Send match state to the new participant
    await sendToConnection(connectionId, {
        action: 'match_joined',
        identity,
        match
    }, event);
    // Broadcast updated match state to all participants
    await broadcastToMatch(match, {
        action: 'match_state',
        match
    }, event);
    // For MVP testing: Auto-fill with AI participants and start match immediately
    if (match.participants.filter(p => p.type === 'human').length === 1 && match.status === 'waiting') {
        // Fill remaining slots with AI participants
        exports.matchManager.addAIParticipants(matchId);
        // Start the match
        const firstRound = exports.matchManager.startMatch(matchId);
        await broadcastToMatch(match, {
            action: 'round_start',
            roundNumber: firstRound.roundNumber,
            prompt: firstRound.prompt,
            timeLimit: match.settings.responseTimeLimit
        }, event);
    }
    return { statusCode: 200 };
}
async function handleSubmitResponse(connectionId, message, event) {
    const match = exports.matchManager.getMatchByConnection(connectionId);
    if (!match) {
        throw new Error('Not in a match');
    }
    const participant = match.participants.find(p => p.connectionId === connectionId);
    if (!participant) {
        throw new Error('Participant not found');
    }
    console.log(`${participant.identity} submitted response for round ${message.roundNumber}`);
    // Submit response and check if round is ready for voting
    const allResponsesCollected = exports.matchManager.submitResponse(match.matchId, participant.identity, message.response);
    // Broadcast updated match state
    await broadcastToMatch(match, {
        action: 'match_state',
        match
    }, event);
    // If all responses collected, start voting phase
    if (allResponsesCollected) {
        const currentRound = exports.matchManager.getCurrentRound(match);
        if (currentRound) {
            await broadcastToMatch(match, {
                action: 'round_voting',
                roundNumber: currentRound.roundNumber,
                responses: currentRound.responses,
                timeLimit: match.settings.votingTimeLimit
            }, event);
        }
    }
    return { statusCode: 200 };
}
async function handleSubmitVote(connectionId, message, event) {
    const match = exports.matchManager.getMatchByConnection(connectionId);
    if (!match) {
        throw new Error('Not in a match');
    }
    const participant = match.participants.find(p => p.connectionId === connectionId);
    if (!participant) {
        throw new Error('Participant not found');
    }
    console.log(`${participant.identity} voted ${message.humanIdentity} as human for round ${message.roundNumber}`);
    // Submit vote and check if round is complete
    const allVotesCollected = exports.matchManager.submitVote(match.matchId, participant.identity, message.humanIdentity);
    // Broadcast updated match state
    await broadcastToMatch(match, {
        action: 'match_state',
        match
    }, event);
    if (allVotesCollected) {
        const currentRound = exports.matchManager.getCurrentRound(match);
        if (match.status === 'completed') {
            // Match is finished
            await broadcastToMatch(match, {
                action: 'match_complete',
                finalScores: match.finalScores,
                rounds: match.rounds
            }, event);
        }
        else if (currentRound) {
            // Round completed, show results and start next round
            await broadcastToMatch(match, {
                action: 'round_complete',
                roundNumber: currentRound.roundNumber,
                scores: currentRound.scores,
                summary: currentRound.summary || '',
                isMatchComplete: false
            }, event);
            // Start next round
            const nextRound = exports.matchManager.getCurrentRound(match);
            if (nextRound) {
                // Small delay for dramatic effect
                setTimeout(async () => {
                    await broadcastToMatch(match, {
                        action: 'round_start',
                        roundNumber: nextRound.roundNumber,
                        prompt: nextRound.prompt,
                        timeLimit: match.settings.responseTimeLimit
                    }, event);
                }, 2000);
            }
        }
    }
    return { statusCode: 200 };
}
/**
 * Send a message to a specific connection
 */
async function sendToConnection(connectionId, data, event) {
    // In test environment, use mocked AWS SDK
    if (process.env.NODE_ENV === 'test') {
        try {
            const AWS = require('aws-sdk');
            const api = new AWS.ApiGatewayManagementApi();
            await api.postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify(data)
            }).promise();
        }
        catch (error) {
            console.error('Test broadcast error:', error);
        }
        return;
    }
    // In production, use the API Gateway Management API
    const endpoint = process.env.WEBSOCKET_ENDPOINT ||
        `https://${event?.requestContext?.domainName}/${event?.requestContext?.stage}`;
    const apiClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({ endpoint });
    try {
        const command = new client_apigatewaymanagementapi_1.PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(data))
        });
        await apiClient.send(command);
    }
    catch (error) {
        console.error(`Failed to send to ${connectionId}:`, error);
    }
}
/**
 * Broadcast a message to all human participants in a match
 */
async function broadcastToMatch(match, data, event) {
    const humanParticipants = match.participants.filter(p => p.type === 'human');
    const promises = humanParticipants.map(participant => {
        if (participant.connectionId) {
            return sendToConnection(participant.connectionId, data, event);
        }
        return Promise.resolve();
    });
    await Promise.all(promises);
}
/**
 * Generate AI response for testing (mock implementation)
 */
async function generateAIResponse(_prompt, personality) {
    // Mock AI responses based on personality
    const responses = {
        curious_student: [
            "That's interesting! I wonder if there's more to explore here?",
            "Hmm, what do you think about the implications of that?",
            "Could you tell me more about your perspective on this?"
        ],
        witty_professional: [
            "Well, that's one way to look at it.",
            "Efficient solution. I appreciate the practicality.",
            "Interesting approach. Very methodical."
        ],
        friendly_skeptic: [
            "I'm not entirely convinced, but I see your point.",
            "That raises some questions for me, actually.",
            "Sounds reasonable, though I'd want to verify that first."
        ]
    };
    const personalityResponses = responses[personality] || responses.curious_student;
    const randomIndex = Math.floor(Math.random() * personalityResponses.length);
    return personalityResponses[randomIndex];
}
