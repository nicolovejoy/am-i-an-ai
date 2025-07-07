"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.handler = void 0;
const uuid_1 = require("uuid");
// In-memory store for MVP (will be replaced with DynamoDB later)
const matchStore = new Map();
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};
// Kafka removed for now - focusing on core match functionality
const handler = async (event) => {
    console.log('Match Service received event:', JSON.stringify(event, null, 2));
    try {
        const path = event.path;
        const method = event.httpMethod;
        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: '',
            };
        }
        // Route requests - handle both with and without stage prefix
        const pathWithoutStage = path.replace(/^\/prod/, '');
        if (method === 'POST' && (pathWithoutStage === '/matches' || path === '/matches')) {
            return await createMatch(event);
        }
        else if (method === 'GET' && pathWithoutStage.match(/^\/matches\/[^\/]+$/)) {
            return await getMatch(event);
        }
        else if (method === 'POST' && pathWithoutStage.match(/^\/matches\/[^\/]+\/responses$/)) {
            return await submitResponse(event);
        }
        else if (method === 'POST' && pathWithoutStage.match(/^\/matches\/[^\/]+\/votes$/)) {
            return await submitVote(event);
        }
        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Not found' }),
        };
    }
    catch (error) {
        console.error('Error in match service:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
exports.handler = handler;
async function createMatch(event) {
    const body = JSON.parse(event.body || '{}');
    if (!body.playerName) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'playerName is required' }),
        };
    }
    const matchId = `match-${(0, uuid_1.v4)()}`;
    const now = new Date().toISOString();
    const match = {
        matchId,
        status: 'waiting',
        currentRound: 0,
        totalRounds: 5,
        participants: [
            {
                identity: 'A',
                isHuman: true,
                playerName: body.playerName,
                isConnected: true,
            },
        ],
        rounds: [],
        createdAt: now,
        updatedAt: now,
    };
    // Store match
    matchStore.set(matchId, match);
    // TODO: Add Kafka event publishing later
    console.log('Match created:', matchId, 'Status:', match.status);
    return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify(match),
    };
}
async function getMatch(event) {
    const matchId = event.pathParameters?.matchId;
    if (!matchId) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'matchId is required' }),
        };
    }
    const match = matchStore.get(matchId);
    if (!match) {
        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Match not found' }),
        };
    }
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(match),
    };
}
async function submitResponse(event) {
    const matchId = event.pathParameters?.matchId;
    const body = JSON.parse(event.body || '{}');
    if (!matchId || !body.identity || !body.response || body.round === undefined) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'matchId, identity, response, and round are required' }),
        };
    }
    const match = matchStore.get(matchId);
    if (!match) {
        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Match not found' }),
        };
    }
    // TODO: Add Kafka event publishing later
    console.log('Response submitted:', matchId, 'Round:', body.round, 'Identity:', body.identity);
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true }),
    };
}
async function submitVote(event) {
    const matchId = event.pathParameters?.matchId;
    const body = JSON.parse(event.body || '{}');
    if (!matchId || !body.voter || !body.votedFor || body.round === undefined) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'matchId, voter, votedFor, and round are required' }),
        };
    }
    const match = matchStore.get(matchId);
    if (!match) {
        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Match not found' }),
        };
    }
    // TODO: Add Kafka event publishing later
    console.log('Vote submitted:', matchId, 'Voter:', body.voter, 'Voted for:', body.votedFor);
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true }),
    };
}
// Cleanup on Lambda shutdown - simplified without Kafka
const cleanup = async () => {
    console.log('Lambda cleanup completed');
};
exports.cleanup = cleanup;
