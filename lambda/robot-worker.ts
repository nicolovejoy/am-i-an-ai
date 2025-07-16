import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Identity } from './types';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const lambdaClient = new LambdaClient({});

// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'robot-orchestra-matches';
const AI_SERVICE_FUNCTION_NAME = process.env.AI_SERVICE_FUNCTION_NAME || 'robot-orchestra-ai-service';

// Seeded random number generator for consistent shuffling
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
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

// Robot personalities for response generation
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

// Map robot IDs to AI personalities
const robotToPersonality: Record<string, string> = {
  'B': 'philosopher',  // poetic → philosopher
  'C': 'scientist',    // analytical → scientist
  'D': 'comedian'      // whimsical → comedian
};

async function generateRobotResponse(prompt: string, robotId: string, roundNumber?: number): Promise<string> {
  const personality = robotToPersonality[robotId];
  
  if (!personality) {
    console.warn(`Unknown robot ID: ${robotId}, using fallback`);
    return generateFallbackResponse(prompt, robotId);
  }

  try {
    // Invoke AI service Lambda
    const requestBody = {
      task: 'robot_response',
      model: 'claude-3-haiku', // Fast model for real-time responses
      inputs: {
        personality,
        prompt,
        context: roundNumber ? { round: roundNumber } : undefined
      },
      options: {
        temperature: 0.85,
        maxTokens: 150
      }
    };

    // Format as API Gateway event since AI service expects that format
    const payload = {
      httpMethod: 'POST',
      body: JSON.stringify(requestBody)
    };

    console.log(`Invoking AI service for robot ${robotId} with personality ${personality}`);
    
    const response = await lambdaClient.send(new InvokeCommand({
      FunctionName: AI_SERVICE_FUNCTION_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    }));

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
      console.error(`AI service response missing expected fields. Body:`, parsedBody);
      throw new Error('Invalid response from AI service');
    }

    return parsedBody.result.response + ' [AI]';
  } catch (error) {
    console.error(`Failed to generate AI response for robot ${robotId}:`, error);
    // Fall back to hardcoded responses
    return generateFallbackResponse(prompt, robotId);
  }
}

function generateFallbackResponse(_prompt: string, robotId: string): string {
  const personality = robotPersonalities[robotId as keyof typeof robotPersonalities];
  if (!personality) {
    return 'A mysterious essence beyond description';
  }

  // Use existing hardcoded responses as fallback
  const responses = personality.responses;
  return responses[Math.floor(Math.random() * responses.length)] + ' [Fallback]';
}

interface RobotMessage {
  matchId: string;
  roundNumber: number;
  prompt: string;
  robotId: string;
  timestamp: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Robot Worker received event:', JSON.stringify(event, null, 2));

  // Process each message
  for (const record of event.Records) {
    try {
      await processRobotResponse(record);
    } catch (error) {
      console.error('Failed to process robot response:', error);
      // Throw error to let SQS retry (with DLQ configured)
      throw error;
    }
  }
};

async function processRobotResponse(record: SQSRecord): Promise<void> {
  const message: RobotMessage = JSON.parse(record.body);
  const { matchId, roundNumber, prompt, robotId } = message;

  console.log(`Processing robot ${robotId} response for match ${matchId}, round ${roundNumber}`);
  console.log('DynamoDB table:', TABLE_NAME);

  // Get current match state
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        matchId,
        timestamp: 0,
      },
    }));

    console.log('DynamoDB GetCommand result:', JSON.stringify(result, null, 2));

    if (!result.Item) {
      throw new Error(`Match ${matchId} not found`);
    }

    const match = result.Item;
    console.log('Match found, current round:', match.currentRound, 'rounds length:', match.rounds?.length);
  
  // Find the round
  const roundIndex = match.rounds.findIndex((r: any) => r.roundNumber === roundNumber);
  if (roundIndex === -1) {
    throw new Error(`Round ${roundNumber} not found in match ${matchId}`);
  }

  // Generate robot response with simulated delay
  const response = await generateRobotResponse(prompt, robotId, roundNumber);
  
  // Remove artificial delay in production
  // await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Update the match with the robot's response
  const updateExpression = `SET rounds[${roundIndex}].responses.#robotId = :response, updatedAt = :updatedAt`;
  
  console.log(`Updating robot ${robotId} response for match ${matchId}, round ${roundNumber}`);
  console.log(`Update expression: ${updateExpression}`);
  
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        matchId,
        timestamp: 0,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#robotId': robotId,
      },
      ExpressionAttributeValues: {
        ':response': response,
        ':updatedAt': new Date().toISOString(),
      },
    }));
    console.log(`Robot ${robotId} response successfully stored for match ${matchId}`);
  } catch (error) {
    console.error(`Failed to store robot ${robotId} response:`, error);
    throw error;
  }

  // Check if we need to update status after storing the response
  // Get the updated match to check all responses
  const updatedResult = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      matchId,
      timestamp: 0,
    },
  }));

  if (updatedResult.Item) {
    const updatedMatch = updatedResult.Item;
    const round = updatedMatch.rounds[roundIndex];
    const responseCount = Object.keys(round.responses || {}).length;
    
    console.log(`Response count for match ${matchId} round ${roundNumber}: ${responseCount}/4`);
    console.log(`Current responses:`, Object.keys(round.responses || {}));
    
    // If all 4 responses are in and status is still 'responding', update to 'voting'
    if (responseCount === 4 && round.status === 'responding') {
      console.log(`All responses collected for match ${matchId} round ${roundNumber}, updating status to voting`);
      
      // Generate randomized presentation order for voting phase
      const identities: Identity[] = ['A', 'B', 'C', 'D'];
      const seed = `${matchId}-round-${roundNumber}`;
      const presentationOrder = shuffleArray(identities, seed);
      
      console.log(`Presentation order for voting: ${presentationOrder.join(', ')}`);
      
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
        UpdateExpression: `SET rounds[${roundIndex}].#status = :votingStatus, rounds[${roundIndex}].presentationOrder = :presentationOrder, updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':votingStatus': 'voting',
          ':presentationOrder': presentationOrder,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    }
  }

  console.log(`Robot ${robotId} response added to match ${matchId}, round ${roundNumber}`);
  } catch (error) {
    console.error('Error in processRobotResponse:', error);
    throw error;
  }
}