import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'robot-orchestra-matches';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Match History received event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: '',
      };
    }

    // Get all matches from DynamoDB
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#ts = :zero',
      ProjectionExpression: 'matchId, #status, createdAt, updatedAt, currentRound, totalRounds, participants',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':zero': 0,
      },
    }));

    const matches = (result.Items || []).map(item => {
      const { timestamp, ...match } = item;
      return {
        matchId: match.matchId,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        currentRound: match.currentRound,
        totalRounds: match.totalRounds,
        humanPlayer: match.participants?.find((p: any) => !p.isAI)?.playerName || 'Unknown',
      };
    });

    // Sort by creation date (newest first)
    matches.sort((a, b) => 
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
    console.error('Error in match history:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};