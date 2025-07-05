import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handler, matches, connectionToMatch } from './handler';
import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

// Test helpers
let broadcasts: any[] = [];

// Mock AWS SDK v2
jest.mock('aws-sdk', () => ({
  ApiGatewayManagementApi: jest.fn(() => ({
    postToConnection: jest.fn((params: any) => {
      broadcasts.push(JSON.parse(params.Data));
      return { promise: () => Promise.resolve() };
    })
  }))
}));

// Mock AWS SDK v3
jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => ({
  ApiGatewayManagementApiClient: jest.fn(() => ({
    send: jest.fn((command: any) => {
      const data = command.Data ? command.Data.toString() : command.input.Data.toString();
      broadcasts.push(JSON.parse(data));
      return Promise.resolve();
    })
  })),
  PostToConnectionCommand: jest.fn((params: any) => ({
    input: params,
    Data: params.Data
  }))
}));

beforeEach(() => {
  matches.clear();
  connectionToMatch.clear();
  broadcasts = [];
  process.env.NODE_ENV = 'test';
});

// Helper functions
async function connect(connectionId: string) {
  const event: Partial<APIGatewayProxyWebsocketEventV2> = {
    requestContext: {
      eventType: 'CONNECT',
      connectionId,
      routeKey: '$connect'
    } as any
  };
  
  const result = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
  
  if (result && typeof result === 'object' && 'statusCode' in result && result.statusCode === 200) {
    const body = JSON.parse(result.body || '{}');
    return body;
  }
  
  return result as any;
}

async function sendMessage(connectionId: string, content: string) {
  const event: Partial<APIGatewayProxyWebsocketEventV2> = {
    requestContext: {
      eventType: 'MESSAGE',
      connectionId,
      routeKey: 'message'
    } as any,
    body: JSON.stringify({ action: 'message', content })
  };
  
  return handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
}

// async function startMatch() {
//   // Trigger session start logic
//   return { success: true };
// }

function getMatchParticipants() {
  // Return current match participants from the global match
  const match = matches.get('global');
  if (!match) return [];
  
  return Array.from(match.connections.values()).map(conn => ({
    identity: conn.identity,
    isAI: conn.isAI,
    personality: conn.personality
  }));
}

async function advanceTime(ms: number) {
  jest.advanceTimersByTime(ms);
}

async function createFullMatch() {
  // Connect 1 human, which automatically adds 3 robots
  await connect('human-1');
  // Robots are added automatically, so match is now full
}

describe('WebSocket Lambda Handler', () => {
  describe('Response Submission Protocol', () => {
    it('should handle submit_response action from frontend', async () => {
      // Given a connected user in an active match
      await connect('test-connection');
      
      // When frontend sends submit_response action
      const event: Partial<APIGatewayProxyWebsocketEventV2> = {
        requestContext: {
          eventType: 'MESSAGE',
          connectionId: 'test-connection',
          routeKey: 'message',
          domainName: 'test.execute-api.us-east-1.amazonaws.com',
          stage: 'test'
        } as any,
        body: JSON.stringify({ 
          action: 'submit_response', 
          roundNumber: 1, 
          response: 'My favorite hobby is reading sci-fi novels.' 
        })
      };
      
      const result = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
      
      // Then should respond with success
      expect(result).toEqual({ statusCode: 200 });
      
      // And should broadcast the response as a message
      expect(broadcasts).toContainEqual(
        expect.objectContaining({
          action: 'message',
          sender: expect.stringMatching(/^[A-D]$/),
          content: 'My favorite hobby is reading sci-fi novels.',
          timestamp: expect.any(Number)
        })
      );
    });

    it('should handle legacy content-only messages for backward compatibility', async () => {
      // Given a connected user
      await connect('test-connection-legacy');
      
      // When backend receives legacy content message
      const event: Partial<APIGatewayProxyWebsocketEventV2> = {
        requestContext: {
          eventType: 'MESSAGE',
          connectionId: 'test-connection-legacy',
          routeKey: 'message',
          domainName: 'test.execute-api.us-east-1.amazonaws.com',
          stage: 'test'
        } as any,
        body: JSON.stringify({ content: 'Legacy message format' })
      };
      
      const result = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
      
      // Then should respond with success
      expect(result).toEqual({ statusCode: 200 });
      
      // And should broadcast the message
      expect(broadcasts).toContainEqual(
        expect.objectContaining({
          action: 'message',
          sender: expect.stringMatching(/^[A-D]$/),
          content: 'Legacy message format',
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('Join Protocol Compatibility', () => {
    it('should handle join_match action from frontend', async () => {
      // Given a connected user
      await connect('test-connection');
      
      // When frontend sends join_match action
      const event: Partial<APIGatewayProxyWebsocketEventV2> = {
        requestContext: {
          eventType: 'MESSAGE',
          connectionId: 'test-connection',
          routeKey: 'message',
          domainName: 'test.execute-api.us-east-1.amazonaws.com',
          stage: 'test'
        } as any,
        body: JSON.stringify({ action: 'join_match' })
      };
      
      const result = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
      
      // Then should respond with success (proving the action was recognized)
      expect(result).toEqual({ statusCode: 200 });
      
      // And should send participants update (from broadcastToMatch call)
      expect(broadcasts).toContainEqual(
        expect.objectContaining({
          action: 'participants',
          participants: expect.arrayContaining([
            expect.objectContaining({
              identity: expect.stringMatching(/^[A-D]$/),
              isAI: false,
              connectionId: 'test-connection'
            })
          ])
        })
      );
    });

    it('should handle legacy join action for backward compatibility', async () => {
      // Given a connected user
      await connect('test-connection-2');
      
      // When backend receives legacy join action
      const event: Partial<APIGatewayProxyWebsocketEventV2> = {
        requestContext: {
          eventType: 'MESSAGE',
          connectionId: 'test-connection-2',
          routeKey: 'message',
          domainName: 'test.execute-api.us-east-1.amazonaws.com',
          stage: 'test'
        } as any,
        body: JSON.stringify({ action: 'join' })
      };
      
      const result = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
      
      // Then should respond with success
      expect(result).toEqual({ statusCode: 200 });
      expect(broadcasts).toContainEqual(
        expect.objectContaining({
          action: 'connected',
          identity: expect.stringMatching(/^[A-D]$/),
          matchId: 'global'
        })
      );
    });
  });

  describe('Connection Management', () => {
    it('should handle $connect and assign A/B/C/D identity', async () => {
      // When connection is processed
      const result = await connect('test-connection-1');

      // Then should assign identity and store connection
      expect(result).toMatchObject({
        identity: expect.stringMatching(/^[A-D]$/),
        matchId: expect.any(String)
      });
    });

    it('should limit matches to exactly 4 participants', async () => {
      // Given 4 connections already exist
      for (let i = 1; i <= 4; i++) {
        await connect(`connection-${i}`);
      }

      // When 5th connection attempts to join
      const result = await connect('connection-5');

      // Then should reject with match full
      expect(result.statusCode).toBe(403);
      expect(result.body).toContain('Match full');
    });

    it('should assign unique A/B/C/D identities', async () => {
      // When 1 human connects (which triggers 3 robot additions)
      await connect('human-1');
      
      // Get all participants (including robots)
      const participants = getMatchParticipants();
      const identities = new Set(participants.map(p => p.identity));

      // Then each has unique identity
      expect(identities.size).toBe(4);
      expect([...identities].sort()).toEqual(['A', 'B', 'C', 'D']);
      
      // And we should have 1 human and 3 robots
      expect(participants.filter(p => !p.isAI)).toHaveLength(1);
      expect(participants.filter(p => p.isAI)).toHaveLength(3);
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast messages to all participants', async () => {
      // Given 4 connected participants
      const connectionIds = ['conn-1', 'conn-2', 'conn-3', 'conn-4'];
      await Promise.all(connectionIds.map(connect));

      // When participant A sends a message
      await sendMessage('conn-1', 'Hello everyone!');

      // Then all participants receive it
      expect(broadcasts).toHaveLength(4);
      expect(broadcasts[0]).toMatchObject({
        action: 'message',
        sender: 'A',
        content: 'Hello everyone!',
        timestamp: expect.any(Number)
      });
    });

    it('should maintain sender anonymity as A/B/C/D', async () => {
      // Given connected participants
      const senderData = await connect('sender-connection');
      
      // When sending a message
      await sendMessage('sender-connection', 'Test message');

      // Then message shows identity not connectionId
      expect(broadcasts[0].sender).toBe(senderData.identity);
      expect(broadcasts[0].sender).not.toBe('sender-connection');
    });
  });

  describe('Robot Participant Integration', () => {
    it('should inject 3 robots when 1 human joins', async () => {
      // Given 1 human connection
      await connect('human-1');

      // Then 3 robot participants should be added automatically
      const participants = getMatchParticipants();
      expect(participants).toHaveLength(4);
      expect(participants.filter(p => p.isAI)).toHaveLength(3);
      expect(participants.filter(p => !p.isAI)).toHaveLength(1);
    });
  });

  describe('Match Management', () => {
    it('should enforce 10-minute match timer', async () => {
      jest.useFakeTimers();
      
      // Given an active match
      await createFullMatch();
      
      // When 10 minutes pass
      await advanceTime(10 * 60 * 1000);

      // Then match should end and reveal identities
      const reveals = broadcasts.filter(b => b.action === 'reveal');
      expect(reveals).toHaveLength(2); // One reveal per real WebSocket connection (2 humans)
      expect(reveals[0]).toMatchObject({
        action: 'reveal',
        identities: {
          A: { type: 'human', name: 'Human User' },
          B: { type: 'human', name: 'Human User' },
          C: { type: 'ai', name: 'AI Assistant', personality: 'analytical' },
          D: { type: 'ai', name: 'AI Assistant', personality: 'creative' }
        }
      });
      
      jest.useRealTimers();
    });
  });
});