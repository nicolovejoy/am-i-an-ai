"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.handler = void 0;
const uuid_1 = require("uuid");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_lambda_1 = require("@aws-sdk/client-lambda");
// Initialize AWS clients
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});
const sqsClient = new client_sqs_1.SQSClient({});
const lambdaClient = new client_lambda_1.LambdaClient({});
// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "robot-orchestra-matches";
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || "";
const AI_SERVICE_FUNCTION_NAME = process.env.AI_SERVICE_FUNCTION_NAME || "robot-orchestra-ai-service";
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME || "robot-orchestra-users";
// Sample prompts for the game
const PROMPTS = [
    "Sample Prompt One?",
    "Sample Prompt Two?",
    "Sample Prompt again...",
];
function getRandomPrompt() {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}
// Generate AI prompt using the AI service
async function generateAIPrompt(round, previousPrompts = [], previousResponses = []) {
    try {
        console.log("Generating AI prompt for round", round);
        const payload = {
            httpMethod: "POST",
            path: "/ai/generate",
            body: JSON.stringify({
                task: "generate_prompt",
                model: "claude-3-haiku",
                inputs: {
                    round,
                    previousPrompts,
                    responses: previousResponses,
                },
                options: {
                    temperature: 0.9,
                    maxTokens: 100,
                },
            }),
        };
        const command = new client_lambda_1.InvokeCommand({
            FunctionName: AI_SERVICE_FUNCTION_NAME,
            Payload: JSON.stringify(payload),
        });
        const response = await lambdaClient.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.Payload));
        if (result.statusCode === 200) {
            const body = JSON.parse(result.body);
            console.log("AI prompt generated:", body.result?.prompt || body.prompt);
            return body.result?.prompt || body.prompt;
        }
        else {
            console.error("AI service returned error:", result);
            throw new Error("AI service error");
        }
    }
    catch (error) {
        console.error("Error generating AI prompt:", error);
        // Fall back to random prompt
        return getRandomPrompt();
    }
}
// Seeded random number generator for consistent shuffling
function seededRandom(seed) {
    // Use a better hash function to ensure different seeds produce different sequences
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Add extra mixing to ensure round numbers produce different results
    hash = hash ^ (hash >>> 16);
    hash = (hash * 0x85ebca6b) >>> 0;
    hash = hash ^ (hash >>> 13);
    hash = (hash * 0xc2b2ae35) >>> 0;
    hash = hash ^ (hash >>> 16);
    return function () {
        hash = (hash * 1664525 + 1013904223) >>> 0; // Better LCG parameters
        return hash / 4294967296; // Use full 32-bit range
    };
}
// Shuffle array using a seed for consistency
function shuffleArray(array, seed) {
    const random = seededRandom(seed);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
// Robot response generation moved to robot-worker Lambda
// This function now sends a message to SQS for async processing
async function triggerRobotResponses(matchId, roundNumber, prompt) {
    console.log("triggerRobotResponses called with:", {
        matchId,
        roundNumber,
        prompt,
    });
    console.log("SQS_QUEUE_URL:", SQS_QUEUE_URL);
    if (!SQS_QUEUE_URL) {
        console.error("SQS_QUEUE_URL is not set!");
        return;
    }
    // Verify human response is in DynamoDB before triggering robots
    try {
        const verifyResult = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0,
            },
        }));
        if (verifyResult.Item) {
            const verifyMatch = verifyResult.Item;
            const verifyRound = verifyMatch.rounds.find((r) => r.roundNumber === roundNumber);
            const responsesInDb = Object.keys(verifyRound?.responses || {});
            console.log(`[VERIFY] Before triggering robots - responses in DynamoDB:`, responsesInDb);
            // Check if any human responses are in the database
            const humanIdentities = verifyMatch.participants
                .filter(p => !p.isAI)
                .map(p => p.identity);
            const humanResponsesInDb = responsesInDb.filter(id => humanIdentities.includes(id));
            if (humanResponsesInDb.length === 0) {
                console.error("[ERROR] No human responses found in DynamoDB! This will cause voting display issues.");
            }
            else {
                console.log(`[VERIFY] Human responses in DB: ${humanResponsesInDb.join(", ")}`);
            }
        }
    }
    catch (error) {
        console.error("[ERROR] Failed to verify human response in DynamoDB:", error);
    }
    // Fetch match to determine AI participants dynamically
    let aiIdentities = ["B", "C", "D"]; // Default for backward compatibility
    try {
        const matchResult = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: { matchId, timestamp: 0 },
        }));
        if (matchResult.Item) {
            const matchData = matchResult.Item;
            // Get identities of AI participants only
            aiIdentities = matchData.participants
                .filter(p => p.isAI !== false) // Note: isAI might be undefined for older matches
                .map(p => p.identity);
            console.log(`Found AI participants: ${aiIdentities.join(", ")}`);
        }
    }
    catch (error) {
        console.error("Failed to fetch AI participants, using defaults:", error);
    }
    for (const robotId of aiIdentities) {
        const message = {
            matchId,
            roundNumber,
            prompt,
            robotId,
            timestamp: new Date().toISOString(),
        };
        try {
            await sqsClient.send(new client_sqs_1.SendMessageCommand({
                QueueUrl: SQS_QUEUE_URL,
                MessageBody: JSON.stringify(message),
            }));
            console.log(`Sent robot response request for ${robotId}`);
        }
        catch (error) {
            console.error(`Failed to send SQS message for robot ${robotId}:`, error);
        }
    }
}
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
// Scoring constants
const POINTS_CORRECT_VOTE = 100;
const POINTS_INCORRECT_VOTE = 0;
// Calculate scores for a round
function calculateRoundScores(round, participants) {
    const scores = {};
    // Find who the human participant is
    const humanParticipant = participants.find(p => !p.isAI);
    if (!humanParticipant) {
        console.error("No human participant found");
        return scores;
    }
    const correctAnswer = humanParticipant.identity;
    // Calculate score for each vote
    for (const [voter, votedFor] of Object.entries(round.votes)) {
        if (votedFor === correctAnswer) {
            scores[voter] = POINTS_CORRECT_VOTE;
        }
        else {
            scores[voter] = POINTS_INCORRECT_VOTE;
        }
    }
    return scores;
}
// Handle state update messages from robot-worker
async function handleStateUpdate(event) {
    const results = [];
    for (const record of event.Records) {
        try {
            const message = JSON.parse(record.body);
            console.log("Processing state update message:", message);
            if (message.type === "ROBOT_RESPONSE_COMPLETE") {
                await checkAndTransitionRound(message.matchId, message.roundNumber);
            }
        }
        catch (error) {
            console.error("Failed to process state update:", error);
            results.push({ itemIdentifier: record.messageId });
        }
    }
    return { batchItemFailures: results };
}
// Check if all responses are collected and transition to voting
async function checkAndTransitionRound(matchId, roundNumber) {
    console.log(`Checking round status for match ${matchId}, round ${roundNumber}`);
    // Get current match state
    const result = await docClient.send(new lib_dynamodb_1.GetCommand({
        TableName: TABLE_NAME,
        Key: {
            matchId,
            timestamp: 0,
        },
    }));
    if (!result.Item) {
        console.error(`Match ${matchId} not found`);
        return;
    }
    const match = result.Item;
    const round = match.rounds.find((r) => r.roundNumber === roundNumber);
    if (!round || round.status !== "responding") {
        console.log(`Round ${roundNumber} not in responding state or not found, current status: ${round?.status}`);
        return; // Already transitioned or not found
    }
    const responseCount = Object.keys(round.responses || {}).length;
    const totalParticipants = match.totalParticipants || match.participants.length || 4;
    console.log(`Match ${matchId} round ${roundNumber}: ${responseCount}/${totalParticipants} responses`);
    console.log(`Current responses:`, Object.keys(round.responses || {}));
    if (responseCount === totalParticipants) {
        // Generate presentation order - each round gets a different order
        const identities = match.participants.map((p) => p.identity);
        const seed = `${matchId}-round-${roundNumber}`;
        const presentationOrder = shuffleArray(identities, seed);
        console.log(`Round ${roundNumber} - Generated presentation order: ${presentationOrder.join(", ")}`);
        console.log(`Seed used: "${seed}" (should be different for each round)`);
        // Update status to voting
        const roundIndex = match.rounds.findIndex((r) => r.roundNumber === roundNumber);
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0,
            },
            UpdateExpression: `SET rounds[${roundIndex}].#status = :votingStatus, rounds[${roundIndex}].presentationOrder = :presentationOrder, updatedAt = :updatedAt`,
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":votingStatus": "voting",
                ":presentationOrder": presentationOrder,
                ":updatedAt": new Date().toISOString(),
            },
        }));
        console.log(`Successfully transitioned match ${matchId} round ${roundNumber} to voting`);
    }
}
const handler = async (event) => {
    console.log("Match Service received event:", JSON.stringify(event, null, 2));
    // Check if this is an SQS event
    if ("Records" in event && event.Records[0]?.eventSource === "aws:sqs") {
        return handleStateUpdate(event);
    }
    // Otherwise handle as API Gateway event
    const apiEvent = event;
    try {
        const path = apiEvent.path;
        const method = apiEvent.httpMethod;
        // Handle CORS preflight
        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: "",
            };
        }
        // Route requests - handle both with and without stage prefix
        const pathWithoutStage = path.replace(/^\/prod/, "");
        // Health check endpoint
        if (method === "GET" &&
            (pathWithoutStage === "/health" || path === "/health")) {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    status: "healthy",
                    service: "match-service",
                    timestamp: new Date().toISOString(),
                }),
            };
        }
        if (method === "POST" &&
            (pathWithoutStage === "/matches" || path === "/matches")) {
            return await createMatch(apiEvent);
        }
        else if (method === "POST" &&
            (pathWithoutStage === "/matches/create-with-template" || path === "/matches/create-with-template")) {
            return await createMatchWithTemplateHandler(apiEvent);
        }
        else if (method === "POST" &&
            pathWithoutStage.match(/^\/matches\/join\/[^\/]+$/)) {
            return await joinMatchHandler(apiEvent);
        }
        else if (method === "GET" &&
            (pathWithoutStage === "/matches/history" || path === "/matches/history")) {
            return await getMatchHistory(apiEvent);
        }
        else if (method === "GET" &&
            pathWithoutStage.match(/^\/matches\/[^\/]+$/)) {
            return await getMatch(apiEvent);
        }
        else if (method === "POST" &&
            pathWithoutStage.match(/^\/matches\/[^\/]+\/responses$/)) {
            return await submitResponse(apiEvent);
        }
        else if (method === "POST" &&
            pathWithoutStage.match(/^\/matches\/[^\/]+\/votes$/)) {
            return await submitVote(apiEvent);
        }
        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Not found" }),
        };
    }
    catch (error) {
        console.error("Error in match service:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};
exports.handler = handler;
async function createMatch(event) {
    const body = JSON.parse(event.body || "{}");
    if (!body.playerName) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "playerName is required" }),
        };
    }
    const matchId = `match-${(0, uuid_1.v4)()}`;
    const now = new Date().toISOString();
    // Generate AI prompt for first round
    const firstPrompt = await generateAIPrompt(1);
    const match = {
        matchId,
        status: "round_active", // Start as active since we have all participants
        currentRound: 1, // Start at round 1
        totalRounds: 5,
        participants: [
            {
                identity: "A",
                isAI: false,
                playerName: body.playerName,
                isConnected: true,
            },
            {
                identity: "B",
                isAI: true,
                playerName: "Sundown",
                isConnected: true,
            },
            {
                identity: "C",
                isAI: true,
                playerName: "Bandit",
                isConnected: true,
            },
            {
                identity: "D",
                isAI: true,
                playerName: "Maverick",
                isConnected: true,
            },
        ],
        rounds: [
            {
                roundNumber: 1,
                prompt: firstPrompt,
                responses: {},
                votes: {},
                scores: {},
                status: "responding",
            },
        ],
        createdAt: now,
        updatedAt: now,
        responseTimeLimit: 45, // Default 45 seconds
    };
    // Store match in DynamoDB
    try {
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                ...match,
                timestamp: 0, // Use 0 for main match record
            },
        }));
        console.log("Match created in DynamoDB:", matchId, "Status:", match.status);
        // Trigger robot responses asynchronously
        await triggerRobotResponses(matchId, 1, match.rounds[0].prompt);
    }
    catch (error) {
        console.error("Failed to create match in DynamoDB:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to create match" }),
        };
    }
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
            body: JSON.stringify({ error: "matchId is required" }),
        };
    }
    // Get match from DynamoDB - we'll use a query since we have timestamp as sort key
    try {
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0, // Main match record has timestamp 0
            },
        }));
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: "Match not found" }),
            };
        }
        const { timestamp, ...match } = result.Item;
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(match),
        };
    }
    catch (error) {
        console.error("Failed to get match from DynamoDB:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to retrieve match" }),
        };
    }
}
async function getMatchHistory(_event) {
    try {
        // Get all matches from DynamoDB
        const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "#ts = :zero",
            ExpressionAttributeNames: {
                "#ts": "timestamp",
            },
            ExpressionAttributeValues: {
                ":zero": 0,
            },
        }));
        // Return full match data, just remove the timestamp field
        const matches = (result.Items || []).map((item) => {
            const { timestamp, ...match } = item;
            return match;
        });
        // Sort by creation date (newest first)
        matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                matches,
                count: matches.length,
            }),
        };
    }
    catch (error) {
        console.error("Error fetching match history:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to retrieve match history" }),
        };
    }
}
async function submitResponse(event) {
    // Extract matchId from path
    const pathMatch = event.path.match(/\/matches\/([^\/]+)\/responses$/);
    const matchId = pathMatch ? pathMatch[1] : event.pathParameters?.matchId;
    const body = JSON.parse(event.body || "{}");
    if (!matchId ||
        !body.identity ||
        !body.response ||
        body.round === undefined) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: "matchId, identity, response, and round are required",
            }),
        };
    }
    // Get match from DynamoDB
    let match;
    try {
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0,
            },
        }));
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: "Match not found" }),
            };
        }
        const { timestamp, ...matchData } = result.Item;
        match = matchData;
    }
    catch (error) {
        console.error("Failed to get match from DynamoDB:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to retrieve match" }),
        };
    }
    // Find the round
    const round = match.rounds.find((r) => r.roundNumber === body.round);
    if (!round) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Invalid round number" }),
        };
    }
    // Store the response
    round.responses[body.identity] = body.response;
    match.updatedAt = new Date().toISOString();
    // Check if all participants' responses are now collected (this is just for human and ai submissions)
    const responseCount = Object.keys(round.responses).length;
    console.log(`Response count after update: ${responseCount}, round status: ${round.status}`);
    console.log(`Current responses:`, Object.keys(round.responses));
    // For human submissions, we won't transition to voting yet since robot responses aren't in
    // Robot-worker will handle the transition when it adds the 4th response
    // CRITICAL: Save the human response to DynamoDB BEFORE triggering robot responses
    try {
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0,
            },
            UpdateExpression: "SET rounds = :rounds, updatedAt = :updatedAt, #status = :status",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":rounds": match.rounds,
                ":updatedAt": match.updatedAt,
                ":status": match.status,
            },
        }));
        console.log("Response saved to DynamoDB:", matchId, "Round:", body.round, "Identity:", body.identity);
    }
    catch (error) {
        console.error("Failed to update match in DynamoDB:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to save response" }),
        };
    }
    // NOW trigger robot responses after human response is safely stored
    // Check if the submitter is human and if all humans have responded
    const submittingParticipant = match.participants.find(p => p.identity === body.identity);
    if (submittingParticipant && !submittingParticipant.isAI) {
        // Count human participants and human responses
        const humanParticipants = match.participants.filter(p => !p.isAI);
        const humanResponses = humanParticipants.filter(p => round.responses[p.identity]);
        console.log(`Human response saved. ${humanResponses.length}/${humanParticipants.length} humans have responded`);
        // Only trigger AI responses when ALL humans have responded
        if (humanResponses.length === humanParticipants.length) {
            console.log("All humans have responded, now triggering AI responses...");
            await triggerRobotResponses(matchId, body.round, round.prompt);
            // Note: Robot responses will be added asynchronously by robot-worker
            // The robot-worker will check for all responses being received and transition to voting
        }
    }
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
    const body = JSON.parse(event.body || "{}");
    if (!matchId || !body.voter || !body.votedFor || body.round === undefined) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: "matchId, voter, votedFor, and round are required",
            }),
        };
    }
    // Get match from DynamoDB
    let match;
    try {
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0,
            },
        }));
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: "Match not found" }),
            };
        }
        const { timestamp, ...matchData } = result.Item;
        match = matchData;
    }
    catch (error) {
        console.error("Failed to get match from DynamoDB:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to retrieve match" }),
        };
    }
    // Find the round
    const round = match.rounds.find((r) => r.roundNumber === body.round);
    if (!round) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Invalid round number" }),
        };
    }
    // Check if the voter submitted a response in this round
    if (!round.responses[body.voter] || round.responses[body.voter] === '(No response)') {
        return {
            statusCode: 403,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: "You cannot vote in this round because you did not submit a response"
            }),
        };
    }
    // Store the vote
    round.votes[body.voter] = body.votedFor;
    match.updatedAt = new Date().toISOString();
    // Generate robot votes if this is from a human
    const votingParticipant = match.participants.find(p => p.identity === body.voter);
    if (votingParticipant && !votingParticipant.isAI) {
        // Check if all humans have voted
        const humanParticipants = match.participants.filter(p => !p.isAI);
        const humanVotes = humanParticipants.filter(p => round.votes[p.identity]);
        console.log(`Human vote saved. ${humanVotes.length}/${humanParticipants.length} humans have voted`);
        // Only generate AI votes when ALL humans have voted
        if (humanVotes.length === humanParticipants.length) {
            console.log("All humans have voted, generating AI votes...");
            // Get all participant identities
            const allIdentities = match.participants.map(p => p.identity);
            // Generate votes for each AI participant
            const aiParticipants = match.participants.filter(p => p.isAI);
            for (const ai of aiParticipants) {
                // AI votes randomly but not for themselves
                const choices = allIdentities.filter(id => id !== ai.identity);
                round.votes[ai.identity] = choices[Math.floor(Math.random() * choices.length)];
                console.log(`AI ${ai.identity} voted for ${round.votes[ai.identity]}`);
            }
        }
    }
    // Check if all votes are in
    const voteCount = Object.keys(round.votes).length;
    const totalParticipants = match.participants.length;
    if (voteCount === totalParticipants && round.status === "voting") {
        round.status = "complete";
        console.log(`All votes collected for match ${matchId} round ${body.round}`);
        // Calculate scores for this round
        round.scores = calculateRoundScores(round, match.participants);
        console.log(`Round ${body.round} scores:`, round.scores);
        // Move to next round or complete match
        if (match.currentRound < match.totalRounds) {
            match.currentRound++;
            match.status = "round_active";
            // Generate AI prompt based on previous rounds
            const previousPrompts = match.rounds.map((r) => r.prompt);
            const previousResponses = match.rounds.map((r) => r.responses);
            const nextPrompt = await generateAIPrompt(match.currentRound, previousPrompts, previousResponses);
            match.rounds.push({
                roundNumber: match.currentRound,
                prompt: nextPrompt,
                responses: {},
                votes: {},
                scores: {},
                status: "responding",
            });
            console.log(`Moving to round ${match.currentRound} for match ${matchId}`);
        }
        else {
            match.status = "completed";
            console.log(`Match ${matchId} completed after round ${match.currentRound}`);
        }
    }
    // Update match in DynamoDB
    try {
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                matchId,
                timestamp: 0,
            },
            UpdateExpression: "SET rounds = :rounds, updatedAt = :updatedAt, #status = :status, currentRound = :currentRound",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":rounds": match.rounds,
                ":updatedAt": match.updatedAt,
                ":status": match.status,
                ":currentRound": match.currentRound,
            },
        }));
        console.log("Vote submitted:", matchId, "Voter:", body.voter, "Voted for:", body.votedFor);
        // If we just started a new round and this is the first human to enter it, prepare for AI responses
        if (votingParticipant && !votingParticipant.isAI &&
            match.status === "round_active" &&
            match.currentRound > 1) {
            const newRound = match.rounds[match.rounds.length - 1];
            // Check if this is the first human entering this round
            const humanResponsesInNewRound = match.participants
                .filter(p => !p.isAI)
                .filter(p => newRound.responses && newRound.responses[p.identity])
                .length;
            if (humanResponsesInNewRound === 0) {
                console.log("First human entering new round, AI responses will be triggered after all humans respond");
            }
        }
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                match: match,
            }),
        };
    }
    catch (error) {
        console.error("Failed to update match in DynamoDB:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to update match" }),
        };
    }
}
// Handler for creating match with template
async function createMatchWithTemplateHandler(event) {
    try {
        const body = JSON.parse(event.body || "{}");
        if (!body.templateType || !body.creatorUserId || !body.creatorName) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: "templateType, creatorUserId, and creatorName are required"
                }),
            };
        }
        // Set environment variable for the service
        process.env.USERS_TABLE_NAME = USERS_TABLE_NAME;
        process.env.MATCHES_TABLE_NAME = TABLE_NAME;
        // Import and use the multi-human match service
        const { createMatchWithTemplate } = await Promise.resolve().then(() => __importStar(require('./src/services/multi-human-match-service')));
        const match = await createMatchWithTemplate(body);
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ match }),
        };
    }
    catch (error) {
        console.error("Error creating match with template:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to create match" }),
        };
    }
}
// Handler for joining match
async function joinMatchHandler(event) {
    try {
        // Extract invite code from path
        const pathMatch = event.path.match(/\/join\/([^\/]+)$/);
        const inviteCode = pathMatch ? pathMatch[1] : null;
        const body = JSON.parse(event.body || "{}");
        if (!inviteCode || !body.userId || !body.displayName) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: "inviteCode, userId, and displayName are required"
                }),
            };
        }
        // Set environment variable for the service
        process.env.USERS_TABLE_NAME = USERS_TABLE_NAME;
        process.env.MATCHES_TABLE_NAME = TABLE_NAME;
        // Import and use the multi-human match service
        const { joinMatch } = await Promise.resolve().then(() => __importStar(require('./src/services/multi-human-match-service')));
        const result = await joinMatch({
            inviteCode,
            userId: body.userId,
            displayName: body.displayName,
        });
        if (!result.success) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: result.error }),
            };
        }
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ match: result.match }),
        };
    }
    catch (error) {
        console.error("Error joining match:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Failed to join match" }),
        };
    }
}
// Cleanup on Lambda shutdown
const cleanup = async () => {
    console.log("Lambda cleanup completed");
};
exports.cleanup = cleanup;
