// Mock clients must be defined before importing handler
const mockDocClient = {
  send: jest.fn(),
};

const mockSQSClient = {
  send: jest.fn(),
};

// Mock AWS SDK v3 clients
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => mockDocClient),
  },
  GetCommand: jest.fn((params) => ({ input: params })),
  UpdateCommand: jest.fn((params) => ({ input: params })),
  PutCommand: jest.fn((params) => ({ input: params })),
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn(() => mockSQSClient),
  SendMessageCommand: jest.fn((params) => ({ input: params })),
}));

// Set environment variables
process.env.DYNAMODB_TABLE_NAME = 'test-matches-table';
process.env.SQS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

// Now import handler after mocks are set up
import { handler } from './match-service';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

describe('Match Service Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocClient.send.mockReset();
    mockSQSClient.send.mockReset();
  });

  describe('POST /matches - Create Match', () => {
    it('should create a new match and trigger robot participant generation', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/matches',
        body: JSON.stringify({
          playerName: 'TestPlayer',
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      // Mock DynamoDB put operation
      mockDocClient.send.mockResolvedValueOnce({});

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      
      // Verify match structure
      expect(body).toMatchObject({
        matchId: expect.stringMatching(/^match-/),
        status: 'round_active',
        currentRound: 1,
        totalRounds: 5,
        participants: expect.arrayContaining([
          {
            identity: 'A',
            isAI: false,
            playerName: 'TestPlayer',
            isConnected: true,
          },
          {
            identity: 'B',
            isAI: true,
            playerName: 'Robot B',
            isConnected: true,
          },
          {
            identity: 'C',
            isAI: true,
            playerName: 'Robot C',
            isConnected: true,
          },
          {
            identity: 'D',
            isAI: true,
            playerName: 'Robot D',
            isConnected: true,
          },
        ]),
        rounds: [
          {
            roundNumber: 1,
            prompt: expect.any(String),
            responses: {},
            votes: {},
            scores: {},
            status: 'responding',
          },
        ],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify DynamoDB was called
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-matches-table',
            Item: expect.objectContaining({
              matchId: expect.stringMatching(/^match-/),
              status: 'round_active',
              participants: expect.any(Array),
            }),
          }),
        })
      );
    });

    it('should return 400 if playerName is missing', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/matches',
        body: JSON.stringify({}),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('playerName is required');
    });
  });

  describe('GET /matches/{matchId} - Get Match', () => {
    it('should return match details from DynamoDB', async () => {
      const matchId = 'match-123';
      const mockMatch = {
        matchId,
        status: 'round_active',
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A', playerName: 'TestPlayer', isConnected: true },
          { identity: 'B', isAI: true, isConnected: true },
          { identity: 'C', isAI: true, isConnected: true },
          { identity: 'D', isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: { A: 'Silence' },
          votes: {},
          scores: {},
          status: 'responding',
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock DynamoDB get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockMatch,
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: `/matches/${matchId}`,
        pathParameters: { matchId },
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual(mockMatch);

      // Verify DynamoDB was called correctly
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-matches-table',
            Key: { matchId },
          }),
        })
      );
    });

    it('should return 404 if match not found', async () => {
      // Mock DynamoDB get operation returning no item
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/matches/nonexistent',
        pathParameters: { matchId: 'nonexistent' },
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Match not found');
    });
  });

  describe('POST /matches/{matchId}/responses - Submit Response', () => {
    it('should submit response and trigger robot responses via SQS', async () => {
      const matchId = 'match-123';
      const mockMatch = {
        matchId,
        status: 'round_active',
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A', playerName: 'TestPlayer', isConnected: true },
          { identity: 'B', isAI: true, isConnected: true },
          { identity: 'C', isAI: true, isConnected: true },
          { identity: 'D', isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {},
          votes: {},
          scores: {},
          status: 'responding',
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock DynamoDB get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockMatch,
      });

      // Mock DynamoDB update operation
      mockDocClient.send.mockResolvedValueOnce({});

      // Mock SQS send operations
      mockSQSClient.send.mockResolvedValue({});

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: `/matches/${matchId}/responses`,
        pathParameters: { matchId },
        body: JSON.stringify({
          identity: 'A',
          response: 'The echo of empty rooms',
          round: 1,
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify DynamoDB update was called
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-matches-table',
            Key: { matchId },
            UpdateExpression: expect.stringContaining('rounds = :rounds'),
          }),
        })
      );

      // Verify SQS messages were sent for robots B, C, D
      expect(mockSQSClient.send).toHaveBeenCalledTimes(3);
      const sqsCalls = mockSQSClient.send.mock.calls;
      const sentRobots = sqsCalls.map(call => {
        const body = JSON.parse(call[0].input.MessageBody);
        return body.robotId;
      });
      expect(sentRobots).toEqual(['B', 'C', 'D']);
    });

    it('should return 400 when required fields are missing', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/matches/test/responses',
        pathParameters: { matchId: 'test' },
        body: JSON.stringify({
          identity: 'A',
          // missing response and round
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('matchId, identity, response, and round are required');
    });
  });

  describe('Status Transitions', () => {
    it('should automatically transition from responding to voting when all responses are submitted', async () => {
      const matchId = 'match-123';
      const mockMatch = {
        matchId,
        status: 'round_active',
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A', playerName: 'TestPlayer', isConnected: true },
          { identity: 'B', isAI: true, isConnected: true },
          { identity: 'C', isAI: true, isConnected: true },
          { identity: 'D', isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {
            A: 'Silence',
            B: 'A distant echo',
            C: 'The ticking of a clock',
            // D will be added by this request
          },
          votes: {},
          scores: {},
          status: 'responding',
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock DynamoDB get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockMatch,
      });

      // Mock DynamoDB update operation
      mockDocClient.send.mockResolvedValueOnce({});

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: `/matches/${matchId}/responses`,
        pathParameters: { matchId },
        body: JSON.stringify({
          identity: 'D',
          response: 'The hum of an empty fridge',
          round: 1,
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(200);
      
      // Verify the response includes the updated match with voting status
      const body = JSON.parse(response.body);
      expect(body.match.rounds[0].status).toBe('voting');
    });
  });

  describe('Match Completion', () => {
    it('should mark match as completed after round 5 voting completes', async () => {
      const matchId = 'match-123';
      const mockMatch = {
        matchId,
        status: 'round_voting',
        currentRound: 5,
        totalRounds: 5,
        participants: [
          { identity: 'A', playerName: 'TestPlayer', isConnected: true },
          { identity: 'B', isAI: true, isConnected: true },
          { identity: 'C', isAI: true, isConnected: true },
          { identity: 'D', isAI: true, isConnected: true },
        ],
        rounds: Array(5).fill(null).map((_, i) => ({
          roundNumber: i + 1,
          prompt: 'Test prompt',
          responses: { A: 'Response A', B: 'Response B', C: 'Response C', D: 'Response D' },
          votes: i < 4 ? { A: 'B', B: 'C', C: 'D', D: 'A' } : { A: 'B', B: 'C', C: 'D' }, // Round 5 missing one vote
          scores: {},
          status: i < 4 ? 'complete' : 'voting',
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock DynamoDB get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockMatch,
      });

      // Mock DynamoDB update operation
      mockDocClient.send.mockResolvedValueOnce({});

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: `/matches/${matchId}/votes`,
        pathParameters: { matchId },
        body: JSON.stringify({
          voter: 'D',
          votedFor: 'A',
          round: 5,
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(200);

      // Verify the response includes the completed match
      const body = JSON.parse(response.body);
      expect(body.match.status).toBe('completed');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in all responses', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/matches/test',
        pathParameters: { matchId: 'test' },
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      // Mock not found response
      mockDocClient.send.mockResolvedValueOnce({ Item: null });

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      });
    });
  });
});