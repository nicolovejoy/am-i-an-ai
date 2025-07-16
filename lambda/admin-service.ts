import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Admin Service received event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    // Check for admin authorization (in production, verify against Cognito admin group)
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const path = event.path;
    const method = event.httpMethod;

    // DELETE /admin/matches - Delete all matches
    if (path === '/admin/matches' && method === 'DELETE') {
      // Scan for all matches
      const scanResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: 'matchId, #ts',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
      }));

      const items = scanResult.Items || [];
      console.log(`Found ${items.length} matches to delete`);

      if (items.length === 0) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            message: 'No matches to delete',
            deletedCount: 0,
          }),
        };
      }

      // Delete in batches of 25 (DynamoDB limit)
      const batches = [];
      for (let i = 0; i < items.length; i += 25) {
        batches.push(items.slice(i, i + 25));
      }

      let deletedCount = 0;
      for (const batch of batches) {
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              matchId: item.matchId,
              timestamp: item.timestamp,
            },
          },
        }));

        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: deleteRequests,
          },
        }));

        deletedCount += batch.length;
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          message: 'All matches deleted successfully',
          deletedCount,
        }),
      };
    }

    // GET /admin/stats - Get match statistics
    if (path === '/admin/stats' && method === 'GET') {
      const scanResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: '#status, createdAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
      }));

      const matches = scanResult.Items || [];
      const stats = {
        totalMatches: matches.length,
        activeMatches: matches.filter(m => m.status === 'round_active').length,
        completedMatches: matches.filter(m => m.status === 'completed').length,
        abandonedMatches: matches.filter(m => m.status === 'abandoned').length,
      };

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(stats),
      };
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error in admin service:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};