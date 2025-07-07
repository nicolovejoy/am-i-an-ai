import { handler } from './match-service';
import { KafkaProducer } from './kafka-producer';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Mock the Kafka producer
jest.mock('./kafka-producer');

describe('Match Service Lambda', () => {
  let mockProducer: jest.Mocked<KafkaProducer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    } as any;
    (KafkaProducer as jest.Mock).mockImplementation(() => mockProducer);
  });

  describe('POST /matches - Create Match', () => {
    it('should create a new match and publish match.created event', async () => {
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

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        matchId: expect.stringMatching(/^match-/),
        status: 'waiting',
        currentRound: 0,
        totalRounds: 5,
        participants: [{
          identity: 'A',
          isHuman: true,
          playerName: 'TestPlayer',
          isConnected: true,
        }],
        createdAt: expect.any(String),
      });

      // Verify Kafka event was published
      expect(mockProducer.send).toHaveBeenCalledWith(
        'match-events',
        'match.created',
        body.matchId,
        expect.objectContaining({
          status: 'waiting',
          participants: expect.any(Array),
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
    it('should return match details', async () => {
      // First create a match
      const createEvent: APIGatewayProxyEvent = {
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

      const createResponse = await handler(createEvent) as APIGatewayProxyResult;
      const createdMatch = JSON.parse(createResponse.body);
      const matchId = createdMatch.matchId;

      // Then get the match
      const getEvent: APIGatewayProxyEvent = {
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

      const response = await handler(getEvent) as APIGatewayProxyResult;

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        matchId,
        status: 'waiting',
        participants: expect.any(Array),
      });
    });

    it('should return 404 if match not found', async () => {
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
    it('should submit response for existing match', async () => {
      // First create a match
      const createEvent: APIGatewayProxyEvent = {
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

      const createResponse = await handler(createEvent) as APIGatewayProxyResult;
      const createdMatch = JSON.parse(createResponse.body);
      const matchId = createdMatch.matchId;

      // Then submit response
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: `/matches/${matchId}/responses`,
        pathParameters: { matchId },
        body: JSON.stringify({
          identity: 'A',
          response: 'My thoughtful response',
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

  describe('POST /matches/{matchId}/votes - Submit Vote', () => {
    it('should submit vote for existing match', async () => {
      // First create a match
      const createEvent: APIGatewayProxyEvent = {
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

      const createResponse = await handler(createEvent) as APIGatewayProxyResult;
      const createdMatch = JSON.parse(createResponse.body);
      const matchId = createdMatch.matchId;

      // Then submit vote
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: `/matches/${matchId}/votes`,
        pathParameters: { matchId },
        body: JSON.stringify({
          voter: 'A',
          votedFor: 'B',
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
    });

    it('should return 400 when required fields are missing', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/matches/test/votes',
        pathParameters: { matchId: 'test' },
        body: JSON.stringify({
          voter: 'A',
          // missing votedFor and round
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
      expect(body.error).toBe('matchId, voter, votedFor, and round are required');
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

      const response = await handler(event) as APIGatewayProxyResult;

      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      });
    });
  });
});