import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handler, sessions, connectionToSession } from '../lambda/handler';
import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

// Test helpers
let broadcasts: any[] = [];

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  ApiGatewayManagementApi: jest.fn(() => ({
    postToConnection: jest.fn((params: any) => {
      broadcasts.push(JSON.parse(params.Data));
      return { promise: () => Promise.resolve() };
    })
  }))
}));

beforeEach(() => {
  sessions.clear();
  connectionToSession.clear();
  broadcasts = [];
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

// async function startSession() {
//   // Trigger session start logic
//   return { success: true };
// }

function getSessionParticipants() {
  // Return current session participants from the global session
  const session = sessions.get('global');
  if (!session) return [];
  
  return Array.from(session.connections.values()).map(conn => ({
    identity: conn.identity,
    isAI: conn.isAI,
    personality: conn.personality
  }));
}

async function advanceTime(ms: number) {
  jest.advanceTimersByTime(ms);
}

async function createFullSession() {
  // Connect 2 humans, which automatically adds 2 AIs
  await connect('human-1');
  await connect('human-2');
  // AIs are added automatically, so session is now full
}

describe('WebSocket Lambda Handler', () => {
  describe('Connection Management', () => {
    it('should handle $connect and assign A/B/C/D identity', async () => {
      // When connection is processed
      const result = await connect('test-connection-1');

      // Then should assign identity and store connection
      expect(result).toMatchObject({
        identity: expect.stringMatching(/^[A-D]$/),
        sessionId: expect.any(String)
      });
    });

    it('should limit sessions to exactly 4 participants', async () => {
      // Given 4 connections already exist
      for (let i = 1; i <= 4; i++) {
        await connect(`connection-${i}`);
      }

      // When 5th connection attempts to join
      const result = await connect('connection-5');

      // Then should reject with session full
      expect(result.statusCode).toBe(403);
      expect(result.body).toContain('Session full');
    });

    it('should assign unique A/B/C/D identities', async () => {
      // When 2 humans connect (which triggers AI addition)
      await connect('human-1');
      await connect('human-2');
      
      // Get all participants (including AIs)
      const participants = getSessionParticipants();
      const identities = new Set(participants.map(p => p.identity));

      // Then each has unique identity
      expect(identities.size).toBe(4);
      expect([...identities].sort()).toEqual(['A', 'B', 'C', 'D']);
      
      // And we should have 2 humans and 2 AIs
      expect(participants.filter(p => !p.isAI)).toHaveLength(2);
      expect(participants.filter(p => p.isAI)).toHaveLength(2);
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

  describe('AI Participant Integration', () => {
    it('should inject 2 AI participants when only 2 humans join', async () => {
      // Given 2 human connections
      await connect('human-1');
      await connect('human-2');

      // When session starts (automatic after 2 humans)
      // Then 2 AI participants should be added
      const participants = getSessionParticipants();
      expect(participants).toHaveLength(4);
      expect(participants.filter(p => p.isAI)).toHaveLength(2);
    });

    it('should assign different personalities to AI participants', async () => {
      // Given a session with 2 humans (triggers AI addition)
      await connect('human-1');
      await connect('human-2');

      // Then AI personalities should differ
      const participants = getSessionParticipants();
      const ais = participants.filter(p => p.isAI);
      expect(ais[0].personality).not.toBe(ais[1].personality);
    });
  });

  describe('Session Management', () => {
    it('should enforce 10-minute session timer', async () => {
      jest.useFakeTimers();
      
      // Given an active session
      await createFullSession();
      
      // When 10 minutes pass
      await advanceTime(10 * 60 * 1000);

      // Then session should end and reveal identities
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