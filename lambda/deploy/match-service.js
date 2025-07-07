"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.handler = void 0;
const uuid_1 = require("uuid");
// In-memory store for MVP (will be replaced with DynamoDB later)
const matchStore = new Map();
// Sample prompts for the game
const PROMPTS = [
    'What sound does loneliness make?',
    'Describe the taste of nostalgia',
    'What color is hope?',
    'How does time smell?',
    'What texture is a memory?',
    'Describe the weight of silence',
    'What shape is love?',
    'How does change feel on your skin?',
    'What temperature is fear?',
    'Describe the rhythm of joy',
];
function getRandomPrompt() {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}
// Simple robot response generator for MVP
function generateRobotResponse(_prompt, robotId) {
    const robotPersonalities = {
        'B': {
            style: 'poetic',
            responses: [
                'Like whispers in the twilight, it dances on the edge of perception',
                'A symphony of shadows, playing in minor keys',
                'Crystalline fragments of yesterday, scattered across tomorrow',
                'It breathes in colors that have no names',
                'Soft as moth wings against the window of time',
            ],
        },
        'C': {
            style: 'analytical',
            responses: [
                'Approximately 42 decibels of introspective resonance',
                'The quantifiable essence measures 3.7 on the emotional scale',
                'Statistical analysis suggests a correlation with ambient frequencies',
                'Data indicates a wavelength between visible and invisible spectrums',
                'Empirically speaking, it registers as a null hypothesis of sensation',
            ],
        },
        'D': {
            style: 'whimsical',
            responses: [
                'Like a disco ball made of butterflies!',
                'It\'s the giggles of invisible unicorns, obviously',
                'Tastes like purple mixed with the sound of Tuesday',
                'Bouncy castle vibes but for your feelings',
                'Imagine a kazoo orchestra playing underwater ballet',
            ],
        },
    };
    const personality = robotPersonalities[robotId];
    if (!personality) {
        return 'A mysterious essence beyond description';
    }
    // For MVP, just return a random response from the robot's style
    const responses = personality.responses;
    return responses[Math.floor(Math.random() * responses.length)];
}
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
        status: 'active', // Start as active since we have all participants
        currentRound: 1, // Start at round 1
        totalRounds: 5,
        participants: [
            {
                identity: 'A',
                isHuman: true,
                playerName: body.playerName,
                isConnected: true,
            },
            {
                identity: 'B',
                isHuman: false,
                playerName: 'Robot B',
                isConnected: true,
            },
            {
                identity: 'C',
                isHuman: false,
                playerName: 'Robot C',
                isConnected: true,
            },
            {
                identity: 'D',
                isHuman: false,
                playerName: 'Robot D',
                isConnected: true,
            },
        ],
        rounds: [
            {
                roundNumber: 1,
                prompt: getRandomPrompt(),
                responses: {},
                votes: {},
                status: 'active',
            },
        ],
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
    // Extract matchId from path
    const pathMatch = event.path.match(/\/matches\/([^\/]+)$/);
    const matchId = pathMatch ? pathMatch[1] : event.pathParameters?.matchId;
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
    // Extract matchId from path
    const pathMatch = event.path.match(/\/matches\/([^\/]+)\/responses$/);
    const matchId = pathMatch ? pathMatch[1] : event.pathParameters?.matchId;
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
    // Find the round
    const round = match.rounds.find(r => r.roundNumber === body.round);
    if (!round) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Invalid round number' }),
        };
    }
    // Store the response
    round.responses[body.identity] = body.response;
    match.updatedAt = new Date().toISOString();
    // Generate robot responses if this is from the human
    if (body.identity === 'A') {
        // Simple robot responses for MVP
        round.responses['B'] = generateRobotResponse(round.prompt, 'B');
        round.responses['C'] = generateRobotResponse(round.prompt, 'C');
        round.responses['D'] = generateRobotResponse(round.prompt, 'D');
        // If all responses are in, move to voting phase
        if (Object.keys(round.responses).length === 4) {
            round.status = 'voting';
        }
    }
    // TODO: Add Kafka event publishing later
    console.log('Response submitted:', matchId, 'Round:', body.round, 'Identity:', body.identity);
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: true,
            match: match,
        }),
    };
}
async function submitVote(event) {
    // Extract matchId from path
    const pathMatch = event.path.match(/\/matches\/([^\/]+)\/votes$/);
    const matchId = pathMatch ? pathMatch[1] : event.pathParameters?.matchId;
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
    // Find the round
    const round = match.rounds.find(r => r.roundNumber === body.round);
    if (!round) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Invalid round number' }),
        };
    }
    // Store the vote
    round.votes[body.voter] = body.votedFor;
    match.updatedAt = new Date().toISOString();
    // Generate robot votes if this is from the human
    if (body.voter === 'A') {
        // Simple robot voting for MVP - robots vote randomly but not for themselves
        const participants = ['A', 'B', 'C', 'D'];
        // Robot B votes
        const bChoices = participants.filter(p => p !== 'B');
        round.votes['B'] = bChoices[Math.floor(Math.random() * bChoices.length)];
        // Robot C votes
        const cChoices = participants.filter(p => p !== 'C');
        round.votes['C'] = cChoices[Math.floor(Math.random() * cChoices.length)];
        // Robot D votes
        const dChoices = participants.filter(p => p !== 'D');
        round.votes['D'] = dChoices[Math.floor(Math.random() * dChoices.length)];
        // If all votes are in, complete the round
        if (Object.keys(round.votes).length === 4) {
            round.status = 'completed';
            // Move to next round or complete match
            if (match.currentRound < match.totalRounds) {
                match.currentRound++;
                match.rounds.push({
                    roundNumber: match.currentRound,
                    prompt: getRandomPrompt(),
                    responses: {},
                    votes: {},
                    status: 'active',
                });
            }
            else {
                match.status = 'completed';
            }
        }
    }
    // TODO: Add Kafka event publishing later
    console.log('Vote submitted:', matchId, 'Voter:', body.voter, 'Voted for:', body.votedFor);
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: true,
            match: match,
        }),
    };
}
// Cleanup on Lambda shutdown - simplified without Kafka
const cleanup = async () => {
    console.log('Lambda cleanup completed');
};
exports.cleanup = cleanup;
