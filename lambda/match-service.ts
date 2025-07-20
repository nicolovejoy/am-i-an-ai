import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  SQSEvent,
  SQSBatchResponse,
  SQSBatchItemFailure,
} from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
// Define Identity type inline to avoid import issues
type Identity = "A" | "B" | "C" | "D";

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const sqsClient = new SQSClient({});
const lambdaClient = new LambdaClient({});

// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "robot-orchestra-matches";
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || "";
const AI_SERVICE_FUNCTION_NAME =
  process.env.AI_SERVICE_FUNCTION_NAME || "robot-orchestra-ai-service";

// Sample prompts for the game
const PROMPTS = [
  "Sample Prompt One?",
  "Sample Prompt Two?",
  "Sample Prompt again...",
];

function getRandomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

// Generate AI prompt using the AI service
async function generateAIPrompt(
  round: number,
  previousPrompts: string[] = [],
  previousResponses: Record<string, string>[] = []
): Promise<string> {
  try {
    console.log("Generating AI prompt for round", round);

    const payload = {
      httpMethod: "POST",
      path: "/ai/generate",
      body: JSON.stringify({
        task: "generate_prompt",
        model: "anthropic.claude-3-haiku-20240307-v1:0",
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

    const command = new InvokeCommand({
      FunctionName: AI_SERVICE_FUNCTION_NAME,
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode === 200) {
      const body = JSON.parse(result.body);
      console.log("AI prompt generated:", body.prompt);
      return body.prompt;
    } else {
      console.error("AI service returned error:", result);
      throw new Error("AI service error");
    }
  } catch (error) {
    console.error("Error generating AI prompt:", error);
    // Fall back to random prompt
    return getRandomPrompt();
  }
}

// Seeded random number generator for consistent shuffling
function seededRandom(seed: string) {
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
function shuffleArray<T>(array: T[], seed: string): T[] {
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
async function triggerRobotResponses(
  matchId: string,
  roundNumber: number,
  prompt: string
): Promise<void> {
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
    const verifyResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
      })
    );

    if (verifyResult.Item) {
      const verifyMatch = verifyResult.Item as Match;
      const verifyRound = verifyMatch.rounds.find(
        (r) => r.roundNumber === roundNumber
      );
      const responsesInDb = Object.keys(verifyRound?.responses || {});
      console.log(
        `[VERIFY] Before triggering robots - responses in DynamoDB:`,
        responsesInDb
      );

      if (!responsesInDb.includes("A")) {
        console.error(
          "[ERROR] Human response A not found in DynamoDB! This will cause voting display issues."
        );
      }
    }
  } catch (error) {
    console.error(
      "[ERROR] Failed to verify human response in DynamoDB:",
      error
    );
  }

  const robots = ["B", "C", "D"];

  for (const robotId of robots) {
    const message = {
      matchId,
      roundNumber,
      prompt,
      robotId,
      timestamp: new Date().toISOString(),
    };

    try {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MessageBody: JSON.stringify(message),
        })
      );
      console.log(`Sent robot response request for ${robotId}`);
    } catch (error) {
      console.error(`Failed to send SQS message for robot ${robotId}:`, error);
    }
  }
}

// Robot response generation moved to robot-worker Lambda

interface Match {
  matchId: string;
  status: "waiting" | "round_active" | "round_voting" | "completed";
  currentRound: number;
  totalRounds: number;
  participants: Participant[];
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  identity: "A" | "B" | "C" | "D";
  isAI?: boolean;
  playerName?: string;
  isConnected: boolean;
}

interface Round {
  roundNumber: number;
  prompt: string;
  responses: Record<string, string>;
  votes: Record<string, string>;
  scores: Record<string, number>;
  status: "waiting" | "responding" | "voting" | "complete";
  presentationOrder?: Identity[];
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};


// Handle state update messages from robot-worker
async function handleStateUpdate(event: SQSEvent): Promise<SQSBatchResponse> {
  const results: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      console.log("Processing state update message:", message);

      if (message.type === "ROBOT_RESPONSE_COMPLETE") {
        await checkAndTransitionRound(message.matchId, message.roundNumber);
      }
    } catch (error) {
      console.error("Failed to process state update:", error);
      results.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures: results };
}

// Check if all responses are collected and transition to voting
async function checkAndTransitionRound(
  matchId: string,
  roundNumber: number
): Promise<void> {
  console.log(
    `Checking round status for match ${matchId}, round ${roundNumber}`
  );

  // Get current match state
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        matchId,
        timestamp: 0,
      },
    })
  );

  if (!result.Item) {
    console.error(`Match ${matchId} not found`);
    return;
  }

  const match = result.Item as Match;
  const round = match.rounds.find((r) => r.roundNumber === roundNumber);

  if (!round || round.status !== "responding") {
    console.log(
      `Round ${roundNumber} not in responding state or not found, current status: ${round?.status}`
    );
    return; // Already transitioned or not found
  }

  const responseCount = Object.keys(round.responses || {}).length;
  console.log(
    `Match ${matchId} round ${roundNumber}: ${responseCount}/4 responses`
  );
  console.log(`Current responses:`, Object.keys(round.responses || {}));

  if (responseCount === 4) {
    // Generate presentation order - each round gets a different order
    const identities: Identity[] = ["A", "B", "C", "D"];
    const seed = `${matchId}-round-${roundNumber}`;
    const presentationOrder = shuffleArray(identities, seed);

    console.log(
      `Round ${roundNumber} - Generated presentation order: ${presentationOrder.join(
        ", "
      )}`
    );
    console.log(`Seed used: "${seed}" (should be different for each round)`);

    // Update status to voting
    const roundIndex = match.rounds.findIndex(
      (r) => r.roundNumber === roundNumber
    );
    await docClient.send(
      new UpdateCommand({
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
      })
    );

    console.log(
      `Successfully transitioned match ${matchId} round ${roundNumber} to voting`
    );
  }
}

export const handler = async (
  event: APIGatewayProxyEvent | SQSEvent
): Promise<APIGatewayProxyResult | SQSBatchResponse> => {
  console.log("Match Service received event:", JSON.stringify(event, null, 2));

  // Check if this is an SQS event
  if ("Records" in event && event.Records[0]?.eventSource === "aws:sqs") {
    return handleStateUpdate(event as SQSEvent);
  }

  // Otherwise handle as API Gateway event
  const apiEvent = event as APIGatewayProxyEvent;

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
    if (
      method === "GET" &&
      (pathWithoutStage === "/health" || path === "/health")
    ) {
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

    if (
      method === "POST" &&
      (pathWithoutStage === "/matches" || path === "/matches")
    ) {
      return await createMatch(apiEvent);
    } else if (
      method === "GET" &&
      (pathWithoutStage === "/matches/history" || path === "/matches/history")
    ) {
      return await getMatchHistory(apiEvent);
    } else if (
      method === "GET" &&
      pathWithoutStage.match(/^\/matches\/[^\/]+$/)
    ) {
      return await getMatch(apiEvent);
    } else if (
      method === "POST" &&
      pathWithoutStage.match(/^\/matches\/[^\/]+\/responses$/)
    ) {
      return await submitResponse(apiEvent);
    } else if (
      method === "POST" &&
      pathWithoutStage.match(/^\/matches\/[^\/]+\/votes$/)
    ) {
      return await submitVote(apiEvent);
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Error in match service:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

async function createMatch(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");

  if (!body.playerName) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "playerName is required" }),
    };
  }

  const matchId = `match-${uuidv4()}`;
  const now = new Date().toISOString();

  // Generate AI prompt for first round
  const firstPrompt = await generateAIPrompt(1);

  const match: Match = {
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
        playerName: "Doc (Robot B)",
        isConnected: true,
      },
      {
        identity: "C",
        isAI: true,
        playerName: "Happy (Robot C)",
        isConnected: true,
      },
      {
        identity: "D",
        isAI: true,
        playerName: "Dopey (Robot D)",
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
  };

  // Store match in DynamoDB
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...match,
          timestamp: 0, // Use 0 for main match record
        },
      })
    );

    console.log("Match created in DynamoDB:", matchId, "Status:", match.status);

    // Trigger robot responses asynchronously
    await triggerRobotResponses(matchId, 1, match.rounds[0].prompt);
  } catch (error) {
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

async function getMatch(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0, // Main match record has timestamp 0
        },
      })
    );

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
  } catch (error) {
    console.error("Failed to get match from DynamoDB:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to retrieve match" }),
    };
  }
}

async function getMatchHistory(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Get all matches from DynamoDB
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#ts = :zero",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
          ":zero": 0,
        },
      })
    );

    // Return full match data, just remove the timestamp field
    const matches = (result.Items || []).map((item) => {
      const { timestamp, ...match } = item;
      return match;
    });

    // Sort by creation date (newest first)
    matches.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        matches,
        count: matches.length,
      }),
    };
  } catch (error) {
    console.error("Error fetching match history:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to retrieve match history" }),
    };
  }
}

async function submitResponse(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Extract matchId from path
  const pathMatch = event.path.match(/\/matches\/([^\/]+)\/responses$/);
  const matchId = pathMatch ? pathMatch[1] : event.pathParameters?.matchId;
  const body = JSON.parse(event.body || "{}");

  if (
    !matchId ||
    !body.identity ||
    !body.response ||
    body.round === undefined
  ) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "matchId, identity, response, and round are required",
      }),
    };
  }

  // Get match from DynamoDB
  let match: Match;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Match not found" }),
      };
    }

    const { timestamp, ...matchData } = result.Item;
    match = matchData as Match;
  } catch (error) {
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

  // Check if all 4 responses are now collected (this is just for human submission)
  const responseCount = Object.keys(round.responses).length;
  console.log(
    `Response count after update: ${responseCount}, round status: ${round.status}`
  );
  console.log(`Current responses:`, Object.keys(round.responses));

  // For human submissions, we won't transition to voting yet since robot responses aren't in
  // Robot-worker will handle the transition when it adds the 4th response

  // CRITICAL: Save the human response to DynamoDB BEFORE triggering robot responses
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
        UpdateExpression:
          "SET rounds = :rounds, updatedAt = :updatedAt, #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":rounds": match.rounds,
          ":updatedAt": match.updatedAt,
          ":status": match.status,
        },
      })
    );

    console.log(
      "Response saved to DynamoDB:",
      matchId,
      "Round:",
      body.round,
      "Identity:",
      body.identity
    );
  } catch (error) {
    console.error("Failed to update match in DynamoDB:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to save response" }),
    };
  }

  // NOW trigger robot responses after human response is safely stored
  if (body.identity === "A") {
    console.log("Human response saved, now triggering robot responses...");
    await triggerRobotResponses(matchId, body.round, round.prompt);

    // Note: Robot responses will be added asynchronously by robot-worker
    // The robot-worker will check for all 4 responses and transition to voting
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

async function submitVote(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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
  let match: Match;
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Match not found" }),
      };
    }

    const { timestamp, ...matchData } = result.Item;
    match = matchData as Match;
  } catch (error) {
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

  // Store the vote
  round.votes[body.voter] = body.votedFor;
  match.updatedAt = new Date().toISOString();

  // Generate robot votes if this is from the human
  if (body.voter === "A") {
    // Simple robot voting for MVP - robots vote randomly but not for themselves
    const participants = ["A", "B", "C", "D"];

    // Robot B votes
    const bChoices = participants.filter((p) => p !== "B");
    round.votes["B"] = bChoices[Math.floor(Math.random() * bChoices.length)];

    // Robot C votes
    const cChoices = participants.filter((p) => p !== "C");
    round.votes["C"] = cChoices[Math.floor(Math.random() * cChoices.length)];

    // Robot D votes
    const dChoices = participants.filter((p) => p !== "D");
    round.votes["D"] = dChoices[Math.floor(Math.random() * dChoices.length)];
  }

  // Check if all votes are in
  const voteCount = Object.keys(round.votes).length;
  if (voteCount === 4 && round.status === "voting") {
    round.status = "complete";
    console.log(`All votes collected for match ${matchId} round ${body.round}`);

    // Move to next round or complete match
    if (match.currentRound < match.totalRounds) {
      match.currentRound++;
      match.status = "round_active";

      // Generate AI prompt based on previous rounds
      const previousPrompts = match.rounds.map((r) => r.prompt);
      const previousResponses = match.rounds.map((r) => r.responses);
      const nextPrompt = await generateAIPrompt(
        match.currentRound,
        previousPrompts,
        previousResponses
      );

      match.rounds.push({
        roundNumber: match.currentRound,
        prompt: nextPrompt,
        responses: {},
        votes: {},
        scores: {},
        status: "responding",
      });
      console.log(`Moving to round ${match.currentRound} for match ${matchId}`);
    } else {
      match.status = "completed";
      console.log(
        `Match ${matchId} completed after round ${match.currentRound}`
      );
    }
  }

  // Update match in DynamoDB
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
        UpdateExpression:
          "SET rounds = :rounds, updatedAt = :updatedAt, #status = :status, currentRound = :currentRound",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":rounds": match.rounds,
          ":updatedAt": match.updatedAt,
          ":status": match.status,
          ":currentRound": match.currentRound,
        },
      })
    );

    console.log(
      "Vote submitted:",
      matchId,
      "Voter:",
      body.voter,
      "Voted for:",
      body.votedFor
    );

    // If we just started a new round, trigger robot responses
    if (
      body.voter === "A" &&
      match.status === "round_active" &&
      match.currentRound > 1
    ) {
      const newRound = match.rounds[match.rounds.length - 1];
      await triggerRobotResponses(
        matchId,
        newRound.roundNumber,
        newRound.prompt
      );
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        match: match,
      }),
    };
  } catch (error) {
    console.error("Failed to update match in DynamoDB:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to update match" }),
    };
  }
}

// Cleanup on Lambda shutdown
export const cleanup = async () => {
  console.log("Lambda cleanup completed");
};
