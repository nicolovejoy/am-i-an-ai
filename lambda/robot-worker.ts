import { SQSEvent, SQSRecord } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const lambdaClient = new LambdaClient({});
const sqsClient = new SQSClient({});

// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "robot-orchestra-matches";
const AI_SERVICE_FUNCTION_NAME =
  process.env.AI_SERVICE_FUNCTION_NAME || "robot-orchestra-ai-service";
const STATE_UPDATE_QUEUE_URL = process.env.STATE_UPDATE_QUEUE_URL || "";

// Robot personalities for response generation
const robotPersonalities = {
  B: {
    style: "poetic",
    responses: [
      "Like whispers in the twilight, it dances on the edge of perception",
      "A symphony of shadows, playing in minor keys",
      "Crystalline fragments of yesterday, scattered across tomorrow",
      "It breathes in colors that have no names",
      "Soft as moth wings against the window of time",
    ],
  },
  C: {
    style: "analytical",
    responses: [
      "Approximately 42 decibels of introspective resonance",
      "The quantifiable essence measures 3.7 on the emotional scale",
      "Statistical analysis suggests a correlation with ambient frequencies",
      "Data indicates a wavelength between visible and invisible spectrums",
      "Empirically speaking, it registers as a null hypothesis of sensation",
    ],
  },
  D: {
    style: "whimsical",
    responses: [
      "Like a disco ball made of butterflies!",
      "It's the giggles of invisible unicorns, obviously",
      "Tastes like purple mixed with the sound of Tuesday",
      "Bouncy castle vibes but for your feelings",
      "Imagine a kazoo orchestra playing underwater ballet",
    ],
  },
};

// Available AI personalities (cycles through these for >3 AI players)
// Using Rocket League bot names and personalities
const availablePersonalities = [
  "sundown", // confident and aggressive
  "bandit", // sneaky and unpredictable  
  "maverick", // bold and daring
];

// Get personality for a robot based on its identity
function getRobotPersonality(robotId: string, allRobotIds: string[]): string {
  // Find the index of this robot among all AI participants
  const robotIndex = allRobotIds.indexOf(robotId);
  if (robotIndex === -1) {
    console.warn(`Robot ${robotId} not found in robot list, using default personality`);
    return availablePersonalities[0];
  }
  
  // Cycle through available personalities
  return availablePersonalities[robotIndex % availablePersonalities.length];
}

async function generateRobotResponse(
  prompt: string,
  robotId: string,
  roundNumber?: number,
  humanResponses?: { current?: string; previous?: string[] },
  previousAIResponses?: string[],
  allRobotIds?: string[]
): Promise<string> {
  // Get personality dynamically based on robot position
  const robotIds = allRobotIds || ['B', 'C', 'D']; // Default for backward compatibility
  const personality = getRobotPersonality(robotId, robotIds);

  if (!personality) {
    console.warn(`Unknown robot ID: ${robotId}, using fallback`);
    return generateFallbackResponse(prompt, robotId);
  }

  try {
    // Invoke AI service Lambda
    const requestBody = {
      task: "robot_response",
      model: "claude-3-haiku", // Fast model for real-time responses
      inputs: {
        personality,
        prompt,
        context: {
          round: roundNumber,
          humanResponses: humanResponses,
          previousAIResponses: previousAIResponses,
        },
      },
      options: {
        temperature: 0.85,
        maxTokens: 150,
      },
    };

    // Format as API Gateway event since AI service expects that format
    const payload = {
      httpMethod: "POST",
      body: JSON.stringify(requestBody),
    };

    console.log(
      `Invoking AI service for robot ${robotId} with personality ${personality}`
    );

    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: AI_SERVICE_FUNCTION_NAME,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify(payload),
      })
    );

    if (response.StatusCode !== 200) {
      throw new Error(`AI service returned status ${response.StatusCode}`);
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload!));
    console.log(`AI service raw response:`, JSON.stringify(result));

    if (result.errorMessage) {
      throw new Error(result.errorMessage);
    }

    const parsedBody = JSON.parse(result.body);
    console.log(`AI service parsed body:`, JSON.stringify(parsedBody));

    if (!parsedBody.success || !parsedBody.result?.response) {
      console.error(
        `AI service response missing expected fields. Body:`,
        parsedBody
      );
      throw new Error("Invalid response from AI service");
    }

    return parsedBody.result.response;
  } catch (error) {
    console.error(
      `Failed to generate AI response for robot ${robotId}:`,
      error
    );
    // Fall back to hardcoded responses
    return generateFallbackResponse(prompt, robotId);
  }
}

function generateFallbackResponse(_prompt: string, robotId: string): string {
  // For backward compatibility, check if this is one of the original robots
  const personality =
    robotPersonalities[robotId as keyof typeof robotPersonalities];
  
  if (!personality) {
    // For new robots (E, F, G, H), use a generic fallback
    const genericResponses = [
      "That's an interesting perspective to consider",
      "I find myself pondering the deeper meaning here",
      "There's something uniquely captivating about this",
      "It resonates in unexpected ways",
      "The essence of it speaks volumes"
    ];
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  // Use existing hardcoded responses as fallback for B, C, D
  const responses = personality.responses;
  return responses[Math.floor(Math.random() * responses.length)];
}

// Notify match-service of robot response completion
async function notifyStateUpdate(
  matchId: string,
  roundNumber: number,
  robotId: string
): Promise<void> {
  if (!STATE_UPDATE_QUEUE_URL) {
    console.error("STATE_UPDATE_QUEUE_URL is not set!");
    return;
  }

  const message = {
    type: "ROBOT_RESPONSE_COMPLETE",
    matchId,
    roundNumber,
    robotId,
    timestamp: new Date().toISOString(),
  };

  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: STATE_UPDATE_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      })
    );

    console.log(
      `Notified match-service of ${robotId} completion for match ${matchId} round ${roundNumber}`
    );
  } catch (error) {
    console.error(`Failed to send state update notification:`, error);
    throw error;
  }
}

interface RobotMessage {
  matchId: string;
  roundNumber: number;
  prompt: string;
  robotId: string;
  timestamp: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("Robot Worker received event:", JSON.stringify(event, null, 2));

  // Process each message
  for (const record of event.Records) {
    try {
      await processRobotResponse(record);
    } catch (error) {
      console.error("Failed to process robot response:", error);
      // Throw error to let SQS retry (with DLQ configured)
      throw error;
    }
  }
};

async function processRobotResponse(record: SQSRecord): Promise<void> {
  const message: RobotMessage = JSON.parse(record.body);
  const { matchId, roundNumber, prompt, robotId } = message;

  console.log(
    `Processing robot ${robotId} response for match ${matchId}, round ${roundNumber}`
  );
  console.log("DynamoDB table:", TABLE_NAME);

  // Get current match state
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

    console.log("DynamoDB GetCommand result:", JSON.stringify(result, null, 2));

    if (!result.Item) {
      throw new Error(`Match ${matchId} not found`);
    }

    const match = result.Item;
    console.log(
      "Match found, current round:",
      match.currentRound,
      "rounds length:",
      match.rounds?.length
    );

    // Find the round
    const roundIndex = match.rounds.findIndex(
      (r: any) => r.roundNumber === roundNumber
    );
    if (roundIndex === -1) {
      throw new Error(`Round ${roundNumber} not found in match ${matchId}`);
    }

    // Add staggered delays to avoid Bedrock rate limits
    // Get all AI participants to determine delay
    const aiParticipants = match.participants.filter((p: any) => p.isAI);
    const aiIdentities = aiParticipants.map((p: any) => p.identity);
    const robotIndex = aiIdentities.indexOf(robotId);
    
    // 2 second delay between each robot (0ms for first, 2000ms for second, etc.)
    const delay = robotIndex >= 0 ? robotIndex * 2000 : 0;
    if (delay > 0) {
      console.log(
        `Waiting ${delay}ms before generating response for robot ${robotId} to avoid rate limits`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Collect human responses for style mimicry
    const humanResponses: { current?: string; previous?: string[] } = {};

    // Get current round's human response (if any)
    const currentRound = match.rounds[roundIndex];
    const humanParticipants = match.participants.filter((p: any) => !p.isAI);
    const aiParticipantsForMimic = match.participants.filter((p: any) => p.isAI);

    // Assign each AI to mimic a specific human (round-robin assignment)
    let targetHumanIndex = 0;
    if (humanParticipants.length > 1) {
      // Find this robot's index among AI participants
      const robotIndex = aiParticipantsForMimic.findIndex(
        (p: any) => p.identity === robotId
      );
      // Assign to human based on robot index
      targetHumanIndex = robotIndex % humanParticipants.length;
    }

    const targetHuman = humanParticipants[targetHumanIndex];

    if (targetHuman) {
      console.log(
        `Robot ${robotId} will mimic writing style of human ${targetHuman.identity} (${targetHuman.displayName})`
      );
    }

    if (targetHuman && currentRound.responses) {
      // Get the specific human's response that this AI should mimic
      if (currentRound.responses[targetHuman.identity]) {
        humanResponses.current = currentRound.responses[targetHuman.identity];
      }
    }

    // Get previous rounds' responses from the same human
    if (targetHuman && roundIndex > 0) {
      humanResponses.previous = [];
      for (let i = 0; i < roundIndex; i++) {
        const previousRound = match.rounds[i];
        if (
          previousRound.responses &&
          previousRound.responses[targetHuman.identity]
        ) {
          humanResponses.previous.push(
            previousRound.responses[targetHuman.identity]
          );
        }
      }
    }

    // Collect this AI's previous responses to avoid repetition
    const previousAIResponses: string[] = [];
    for (let i = 0; i < roundIndex; i++) {
      const previousRound = match.rounds[i];
      if (previousRound.responses && previousRound.responses[robotId]) {
        previousAIResponses.push(previousRound.responses[robotId]);
      }
    }

    // Generate robot response with human style context and previous responses
    const response = await generateRobotResponse(
      prompt,
      robotId,
      roundNumber,
      humanResponses,
      previousAIResponses,
      aiIdentities
    );

    // Update the match with the robot's response
    const updateExpression = `SET rounds[${roundIndex}].responses.#robotId = :response, updatedAt = :updatedAt`;

    console.log(
      `Updating robot ${robotId} response for match ${matchId}, round ${roundNumber}`
    );
    console.log(`Update expression: ${updateExpression}`);

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            matchId,
            timestamp: 0,
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: {
            "#robotId": robotId,
          },
          ExpressionAttributeValues: {
            ":response": response,
            ":updatedAt": new Date().toISOString(),
          },
        })
      );
      console.log(
        `Robot ${robotId} response successfully stored for match ${matchId}`
      );
    } catch (error) {
      console.error(`Failed to store robot ${robotId} response:`, error);
      throw error;
    }

    // Notify match-service that this robot has completed its response
    await notifyStateUpdate(matchId, roundNumber, robotId);

    console.log(
      `Robot ${robotId} response added to match ${matchId}, round ${roundNumber}`
    );
  } catch (error) {
    console.error("Error in processRobotResponse:", error);
    throw error;
  }
}
