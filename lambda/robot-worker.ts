import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'robot-orchestra-matches';

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

function generateRobotResponse(_prompt: string, robotId: string): string {
  const personality = robotPersonalities[robotId as keyof typeof robotPersonalities];
  if (!personality) {
    return 'A mysterious essence beyond description';
  }

  // For MVP, just return a random response from the robot's style
  const responses = personality.responses;
  return responses[Math.floor(Math.random() * responses.length)];
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
  const response = generateRobotResponse(prompt, robotId);
  
  // Add artificial delay to make async behavior visible (remove in production)
  console.log(`Simulating ${robotId} thinking for 2-5 seconds...`);
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Update the match with the robot's response
  const updateExpression = `SET rounds[${roundIndex}].responses.#robotId = :response, updatedAt = :updatedAt`;
  
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

  console.log(`Robot ${robotId} response stored for match ${matchId}`);

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
    
    // If all 4 responses are in and status is still 'responding', update to 'voting'
    if (responseCount === 4 && round.status === 'responding') {
      console.log(`All responses collected for match ${matchId} round ${roundNumber}, updating status to voting`);
      
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          matchId,
          timestamp: 0,
        },
        UpdateExpression: `SET rounds[${roundIndex}].#status = :votingStatus, updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':votingStatus': 'voting',
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