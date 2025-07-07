import { handler } from './match-service';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('Match Service Integration Tests', () => {
  let matchId: string;

  const createEvent = (method: string, path: string, body?: any): APIGatewayProxyEvent => ({
    httpMethod: method,
    path,
    headers: {},
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: {},
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  });

  describe('Match Creation', () => {
    it('should create a match with robots and initial prompt', async () => {
      const response = await handler(createEvent('POST', '/matches', {
        playerName: 'TestPlayer'
      }));

      expect(response.statusCode).toBe(201);
      
      const match = JSON.parse(response.body);
      console.log('Created match:', JSON.stringify(match, null, 2));
      
      // Store matchId for subsequent tests
      matchId = match.matchId;

      // Verify match structure
      expect(match.matchId).toBeDefined();
      expect(match.status).toBe('active');
      expect(match.currentRound).toBe(1);
      expect(match.totalRounds).toBe(5);
      
      // Verify participants
      expect(match.participants).toHaveLength(4);
      expect(match.participants[0]).toEqual({
        identity: 'A',
        isHuman: true,
        playerName: 'TestPlayer',
        isConnected: true
      });
      
      // Verify robots
      const robots = match.participants.filter((p: any) => !p.isHuman);
      expect(robots).toHaveLength(3);
      expect(robots.map((r: any) => r.identity)).toEqual(['B', 'C', 'D']);
      
      // Verify initial round
      expect(match.rounds).toHaveLength(1);
      expect(match.rounds[0].roundNumber).toBe(1);
      expect(match.rounds[0].prompt).toBeDefined();
      expect(match.rounds[0].prompt.length).toBeGreaterThan(10);
      expect(match.rounds[0].status).toBe('active');
      expect(match.rounds[0].responses).toEqual({});
      expect(match.rounds[0].votes).toEqual({});
    });

    it('should reject match creation without playerName', async () => {
      const response = await handler(createEvent('POST', '/matches', {}));
      
      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.error).toBe('playerName is required');
    });
  });

  describe('Response Submission', () => {
    it('should accept human response and generate robot responses', async () => {
      const response = await handler(createEvent('POST', `/matches/${matchId}/responses`, {
        identity: 'A',
        response: 'Like the echo of forgotten dreams',
        round: 1
      }));

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      console.log('Response result:', JSON.stringify(result, null, 2));
      
      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      
      // Check that all robots responded
      const round1 = result.match.rounds[0];
      expect(round1.responses['A']).toBe('Like the echo of forgotten dreams');
      expect(round1.responses['B']).toBeDefined();
      expect(round1.responses['C']).toBeDefined();
      expect(round1.responses['D']).toBeDefined();
      
      // Verify round moved to voting
      expect(round1.status).toBe('voting');
    });
  });

  describe('Vote Submission', () => {
    it('should accept human vote and generate robot votes', async () => {
      const response = await handler(createEvent('POST', `/matches/${matchId}/votes`, {
        voter: 'A',
        votedFor: 'C',
        round: 1
      }));

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      console.log('Vote result:', JSON.stringify(result, null, 2));
      
      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      
      // Check votes
      const round1 = result.match.rounds[0];
      expect(round1.votes['A']).toBe('C');
      expect(round1.votes['B']).toBeDefined();
      expect(round1.votes['C']).toBeDefined();
      expect(round1.votes['D']).toBeDefined();
      
      // Verify round completed and next round started
      expect(round1.status).toBe('completed');
      expect(result.match.currentRound).toBe(2);
      expect(result.match.rounds).toHaveLength(2);
      
      // Check new round
      const round2 = result.match.rounds[1];
      expect(round2.roundNumber).toBe(2);
      expect(round2.prompt).toBeDefined();
      expect(round2.status).toBe('active');
    });
  });

  describe('Match Retrieval', () => {
    it('should retrieve match by ID', async () => {
      const response = await handler(createEvent('GET', `/matches/${matchId}`, null));
      
      expect(response.statusCode).toBe(200);
      
      const match = JSON.parse(response.body);
      expect(match.matchId).toBe(matchId);
      expect(match.currentRound).toBe(2);
    });
  });
});