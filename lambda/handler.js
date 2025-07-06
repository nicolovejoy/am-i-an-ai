"use strict";
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { AIResponseGenerator, ROBOT_PERSONALITIES } = require('./aiResponseGenerator');
const { RobotParticipantManager } = require('./robotParticipantManager');

const OpenAI = require('openai');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// Initialize AI components
let aiGenerator;
let robotManager;
let secretsClient;

// Initialize Secrets Manager client
function getSecretsClient() {
    if (!secretsClient) {
        secretsClient = new SecretsManagerClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
    }
    return secretsClient;
}

// Get OpenAI API key from Secrets Manager
async function getOpenAIApiKey() {
    if (process.env.OPENAI_API_KEY) {
        // For local testing with environment variable
        return process.env.OPENAI_API_KEY;
    }
    
    if (!process.env.OPENAI_SECRET_ARN) {
        console.log('No OPENAI_SECRET_ARN found, using mock client');
        return null;
    }
    
    try {
        const client = getSecretsClient();
        const command = new GetSecretValueCommand({
            SecretId: process.env.OPENAI_SECRET_ARN
        });
        
        const response = await client.send(command);
        return response.SecretString;
    } catch (error) {
        console.error('Failed to retrieve OpenAI API key from Secrets Manager:', error);
        return null;
    }
}

// Lazy initialization for AI components
async function initializeAI() {
    if (!aiGenerator) {
        // Get OpenAI API key from Secrets Manager
        const apiKey = await getOpenAIApiKey();
        let openAIClient;
        
        if (apiKey) {
            openAIClient = new OpenAI({
                apiKey: apiKey
            });
            console.log('Initialized with real OpenAI client from Secrets Manager');
        } else {
            // Fallback to mock for testing without API key
            openAIClient = {
                chat: {
                    completions: {
                        create: async () => ({
                            choices: [{ message: { content: "This is a fallback response - OpenAI API key not configured." } }]
                        })
                    }
                }
            };
            console.log('Using mock OpenAI client - configure OPENAI_SECRET_ARN for real AI');
        }

        aiGenerator = new AIResponseGenerator({
            openAIClient,
            provider: 'openai'
        });

        robotManager = new RobotParticipantManager({
            aiGenerator,
            broadcastFn: broadcastToMatch
        });
    }
}

// In-memory storage (same as original)
const matches = new Map();
const connectionToMatch = new Map();

const handler = async (event) => {
    try {
        console.log('WebSocket event:', JSON.stringify(event, null, 2));
        const { eventType, connectionId, routeKey } = event.requestContext;
        
        // Initialize AI on first use
        await initializeAI();
        
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
    } catch (error) {
        console.error('Handler error:', error);
        return { statusCode: 500, body: 'Internal server error' };
    }
};

async function handleConnect(connectionId, event) {
    // Find or create match (MVP: single global match)
    let match = matches.get('global') || createMatch('global');
    
    // Check if match is full
    if (Object.keys(match.participants).length >= 4) {
        return { statusCode: 403, body: 'Match full' };
    }
    
    // Assign random available identity
    const usedIdentities = Object.keys(match.participants);
    const availableIdentities = ['A', 'B', 'C', 'D'].filter(id => !usedIdentities.includes(id));
    const randomIndex = Math.floor(Math.random() * availableIdentities.length);
    const humanIdentity = availableIdentities[randomIndex];
    
    // Add human participant
    match.participants[humanIdentity] = {
        identity: humanIdentity,
        isHuman: true,
        connectionId,
        score: 0
    };
    
    connectionToMatch.set(connectionId, match.id);
    
    // MVP: When first human joins, immediately add 3 robot participants
    if (Object.keys(match.participants).length === 1) {
        const remainingIdentities = availableIdentities.filter(id => id !== humanIdentity);
        const robots = robotManager.createRobotParticipants(remainingIdentities);
        
        // Add robots to match
        robots.forEach(robot => {
            match.participants[robot.identity] = robot;
        });
        
        startMatchTimer(match);
        
        // Start first round after robots are added
        setTimeout(async () => {
            match.currentRound = 1;
            match.rounds[1] = {
                prompt: ROUND_PROMPTS[0],
                responses: {},
                votes: {},
                startTime: Date.now()
            };
            
            await broadcastToMatch(match, {
                action: 'round_start',
                round: 1,
                prompt: ROUND_PROMPTS[0]
            }, event);
        }, 2000);
    }
    
    matches.set(match.id, match);
    console.log(`Connection ${connectionId} assigned identity ${humanIdentity} in match ${match.id}`);
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            identity: humanIdentity,
            matchId: match.id
        })
    };
}

async function handleDisconnect(connectionId) {
    const matchId = connectionToMatch.get(connectionId);
    if (!matchId) return { statusCode: 200 };
    
    const match = matches.get(matchId);
    if (!match) return { statusCode: 200 };
    
    // Find and remove participant
    const participant = Object.values(match.participants).find(p => p.connectionId === connectionId);
    if (participant) {
        delete match.participants[participant.identity];
    }
    
    connectionToMatch.delete(connectionId);
    
    // Clean up empty matches
    if (Object.keys(match.participants).filter(p => match.participants[p].isHuman).length === 0) {
        if (match.timer) {
            clearTimeout(match.timer);
        }
        matches.delete(matchId);
    }
    
    return { statusCode: 200 };
}

async function handleMessage(connectionId, body, event) {
    const matchId = connectionToMatch.get(connectionId);
    if (!matchId) return { statusCode: 400, body: 'Not in match' };
    
    const match = matches.get(matchId);
    if (!match) return { statusCode: 400, body: 'Match not found' };
    
    const sender = Object.values(match.participants).find(p => p.connectionId === connectionId);
    if (!sender) return { statusCode: 400, body: 'Participant not found' };
    
    // Handle join action
    if (body.action === 'join' || body.action === 'join_match') {
        const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
        const apiClient = new ApiGatewayManagementApiClient({ endpoint });
        
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify({
                action: 'match_joined',
                identity: sender.identity,
                matchId: match.id,
                status: match.status,
                currentRound: match.currentRound,
                totalRounds: 5,
                participants: Object.values(match.participants).map(p => ({
                    identity: p.identity,
                    isHuman: p.isHuman,
                    isConnected: true,
                    score: p.score
                }))
            }))
        });
        
        try {
            await apiClient.send(command);
        } catch (error) {
            console.error('Failed to send match_joined:', error);
        }
        
        // Also send match state
        await broadcastToMatch(match, {
            action: 'match_state',
            matchId: match.id,
            status: match.status,
            currentRound: match.currentRound,
            participants: Object.values(match.participants).map(p => ({
                identity: p.identity,
                isHuman: p.isHuman,
                isConnected: true,
                score: p.score
            }))
        }, event);
        
        return { statusCode: 200 };
    }
    
    // Handle response submission
    if (body.action === 'submit_response') {
        const { roundNumber, response } = body;
        
        if (roundNumber !== match.currentRound) {
            return { statusCode: 400, body: 'Invalid round number' };
        }
        
        // Store human response
        match.rounds[roundNumber].responses[sender.identity] = response;
        
        // Broadcast that participant responded
        await broadcastToMatch(match, {
            action: 'participant_responded',
            identity: sender.identity,
            responseTime: (Date.now() - match.rounds[roundNumber].startTime) / 1000
        }, event);
        
        // Trigger AI responses
        const currentPrompt = match.rounds[roundNumber].prompt;
        const robotPromises = robotManager.scheduleRobotResponses(match, currentPrompt);
        
        // Handle robot responses as they complete
        robotPromises.forEach(promise => {
            promise.then(result => {
                // Store robot response
                match.rounds[roundNumber].responses[result.identity] = result.response;
                
                // Check if all responses collected
                if (Object.keys(match.rounds[roundNumber].responses).length === 4) {
                    // Move to voting phase
                    startVotingPhase(match, event);
                }
            }).catch(error => {
                console.error('Robot response error:', error);
            });
        });
        
        return { statusCode: 200 };
    }
    
    // Handle vote submission
    if (body.action === 'submit_vote') {
        const { roundNumber, votedIdentity } = body;
        
        if (roundNumber !== match.currentRound) {
            return { statusCode: 400, body: 'Invalid round number' };
        }
        
        // Store human vote
        match.rounds[roundNumber].votes[sender.identity] = votedIdentity;
        
        // Generate robot votes
        const robotParticipants = {};
        Object.entries(match.participants).forEach(([identity, participant]) => {
            if (!participant.isHuman) {
                robotParticipants[identity] = participant.personality;
            }
        });
        
        const humanIdentity = Object.values(match.participants).find(p => p.isHuman)?.identity;
        const robotVotes = await robotManager.generateRobotVotes(
            robotParticipants,
            match.rounds[roundNumber].responses,
            humanIdentity
        );
        
        // Store robot votes
        Object.assign(match.rounds[roundNumber].votes, robotVotes);
        
        // Calculate scores
        const scores = calculateRoundScores(match.rounds[roundNumber].votes, humanIdentity);
        Object.entries(scores).forEach(([identity, points]) => {
            match.participants[identity].score += points;
        });
        
        // Send round complete
        await broadcastToMatch(match, {
            action: 'round_complete',
            roundNumber,
            votes: match.rounds[roundNumber].votes,
            scores,
            correctAnswer: humanIdentity
        }, event);
        
        // Advance to next round or end match
        if (match.currentRound >= 5) {
            await endMatch(match, event);
        } else {
            match.currentRound++;
            match.rounds[match.currentRound] = {
                prompt: ROUND_PROMPTS[match.currentRound - 1],
                responses: {},
                votes: {},
                startTime: Date.now()
            };
            
            setTimeout(async () => {
                await broadcastToMatch(match, {
                    action: 'round_start',
                    round: match.currentRound,
                    prompt: ROUND_PROMPTS[match.currentRound - 1]
                }, event);
            }, 3000);
        }
        
        return { statusCode: 200 };
    }
    
    return { statusCode: 400, body: 'Unknown action' };
}

function createMatch(id) {
    return {
        id,
        participants: {},
        status: 'waiting',
        startTime: Date.now(),
        currentRound: 0,
        rounds: {},
        timer: null
    };
}

async function broadcastToMatch(match, data, event) {
    if (process.env.NODE_ENV === 'test') {
        console.log('Test broadcast:', data);
        return;
    }
    
    const endpoint = process.env.WEBSOCKET_ENDPOINT ||
        `https://${event?.requestContext?.domainName}/${event?.requestContext?.stage}`;
    const apiClient = new ApiGatewayManagementApiClient({ endpoint });
    
    // Only broadcast to human participants (robots don't have connections)
    const promises = [];
    Object.values(match.participants).forEach(participant => {
        if (participant.isHuman && participant.connectionId) {
            const command = new PostToConnectionCommand({
                ConnectionId: participant.connectionId,
                Data: Buffer.from(JSON.stringify(data))
            });
            promises.push(apiClient.send(command).catch(err => {
                console.error(`Failed to send to ${participant.connectionId}:`, err);
            }));
        }
    });
    
    await Promise.all(promises);
}

// Round prompts for MVP
const ROUND_PROMPTS = [
    "What's your favorite childhood memory?",
    "Describe your perfect weekend",
    "What skill would you love to master?",
    "Tell us about a time you overcame a challenge",
    "What's something that always makes you smile?"
];

async function startVotingPhase(match, event) {
    match.status = 'round_voting';
    
    await broadcastToMatch(match, {
        action: 'round_voting',
        roundNumber: match.currentRound,
        responses: match.rounds[match.currentRound].responses
    }, event);
}

function calculateRoundScores(votes, correctAnswer) {
    const scores = {};
    
    Object.entries(votes).forEach(([voter, votedFor]) => {
        scores[voter] = scores[voter] || 0;
        if (votedFor === correctAnswer) {
            scores[voter] += 10; // Points for correct guess
        }
    });
    
    return scores;
}

function startMatchTimer(match) {
    match.timer = setTimeout(async () => {
        await endMatch(match);
    }, 10 * 60 * 1000); // 10 minutes
}

async function endMatch(match, event) {
    match.status = 'completed';
    
    // Calculate final scores
    const finalScores = {};
    Object.entries(match.participants).forEach(([identity, participant]) => {
        finalScores[identity] = participant.score;
    });
    
    // Determine winner
    const winner = Object.entries(finalScores).reduce((a, b) => 
        finalScores[a[0]] > finalScores[b[0]] ? a : b
    )[0];
    
    // Send match complete
    await broadcastToMatch(match, {
        action: 'match_complete',
        finalScores,
        winner,
        participants: Object.entries(match.participants).map(([identity, p]) => ({
            identity,
            isHuman: p.isHuman,
            personality: p.personality,
            score: p.score
        }))
    }, event);
    
    // Clean up
    if (match.timer) {
        clearTimeout(match.timer);
    }
    
    Object.values(match.participants).forEach(p => {
        if (p.connectionId) {
            connectionToMatch.delete(p.connectionId);
        }
    });
    
    matches.delete(match.id);
}

module.exports = {
    handler,
    matches,
    connectionToMatch,
    // Export for testing
    initializeAI,
    robotManager
};