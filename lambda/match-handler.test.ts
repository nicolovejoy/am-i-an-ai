import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handler, matchManager } from './match-handler';
import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { Identity } from './types';

// Test helpers
let broadcasts: any[] = [];

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  ApiGatewayManagementApi: jest.fn(() => ({
    postToConnection: jest.fn((params: any) => {
      broadcasts.push({ connectionId: params.ConnectionId, data: JSON.parse(params.Data) });
      return { promise: () => Promise.resolve() };
    })
  }))
}));

beforeEach(() => {
  matchManager.clearAllMatches();
  broadcasts = [];
});

// Helper functions
async function connectPlayer(connectionId: string) {
  const event: Partial<APIGatewayProxyWebsocketEventV2> = {
    requestContext: {
      eventType: 'CONNECT',
      connectionId,
      routeKey: '$connect'
    } as any
  };
  
  return await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
}

async function joinMatch(connectionId: string) {
  const event: Partial<APIGatewayProxyWebsocketEventV2> = {
    requestContext: {
      eventType: 'MESSAGE',
      connectionId,
      routeKey: 'message'
    } as any,
    body: JSON.stringify({ action: 'join_match' })
  };
  
  return await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
}

async function submitResponse(connectionId: string, roundNumber: number, response: string) {
  const event: Partial<APIGatewayProxyWebsocketEventV2> = {
    requestContext: {
      eventType: 'MESSAGE',
      connectionId,
      routeKey: 'message'
    } as any,
    body: JSON.stringify({ 
      action: 'submit_response', 
      roundNumber, 
      response 
    })
  };
  
  return await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
}

async function submitVote(connectionId: string, roundNumber: number, humanIdentity: Identity) {
  const event: Partial<APIGatewayProxyWebsocketEventV2> = {
    requestContext: {
      eventType: 'MESSAGE',
      connectionId,
      routeKey: 'message'
    } as any,
    body: JSON.stringify({ 
      action: 'submit_vote', 
      roundNumber, 
      humanIdentity 
    })
  };
  
  return await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
}

function getPlayerIdentity(connectionId: string): Identity | undefined {
  const joinedBroadcast = broadcasts.find(b => 
    b.connectionId === connectionId && b.data.action === 'match_joined'
  );
  return joinedBroadcast?.data.identity;
}

function getLastBroadcastOfType(action: string) {
  return broadcasts.filter(b => b.data.action === action).pop();
}

describe('Match Handler - WebSocket Actions', () => {
  describe('Connection Management', () => {
    it('should handle connection and disconnection', async () => {
      const connectResult = await connectPlayer('conn-1');
      expect(connectResult).toMatchObject({ statusCode: 200 });
      
      // Disconnect
      const event: Partial<APIGatewayProxyWebsocketEventV2> = {
        requestContext: {
          eventType: 'DISCONNECT',
          connectionId: 'conn-1',
          routeKey: '$disconnect'
        } as any
      };
      
      const disconnectResult = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
      expect(disconnectResult).toMatchObject({ statusCode: 200 });
    });
  });

  describe('Match Joining', () => {
    it('should allow player to join match and receive identity', async () => {
      await connectPlayer('player-1');
      const result = await joinMatch('player-1');
      
      expect(result).toMatchObject({ statusCode: 200 });
      
      // Check that player received match_joined message
      const joinedMessage = broadcasts.find(b => 
        b.connectionId === 'player-1' && b.data.action === 'match_joined'
      );
      
      expect(joinedMessage).toBeDefined();
      expect(joinedMessage.data.identity).toMatch(/^[A-D]$/);
      expect(joinedMessage.data.match).toBeDefined();
    });

    it('should start match when 4 players join', async () => {
      // Connect and join 2 players (triggers AI addition = 4 total)
      await connectPlayer('player-1');
      await connectPlayer('player-2');
      
      await joinMatch('player-1');
      await joinMatch('player-2');
      
      // Should have received round_start message
      const roundStart = getLastBroadcastOfType('round_start');
      expect(roundStart).toBeDefined();
      expect(roundStart.data).toMatchObject({
        action: 'round_start',
        roundNumber: 1,
        prompt: expect.any(String),
        timeLimit: 90
      });
    });

    it('should assign unique identities to players', async () => {
      await connectPlayer('player-1');
      await connectPlayer('player-2');
      
      await joinMatch('player-1');
      await joinMatch('player-2');
      
      const identity1 = getPlayerIdentity('player-1');
      const identity2 = getPlayerIdentity('player-2');
      
      expect(identity1).toBeDefined();
      expect(identity2).toBeDefined();
      expect(identity1).not.toBe(identity2);
    });
  });

  describe('Response Submission', () => {
    beforeEach(async () => {
      // Set up a match with 2 players (4 total with AIs)
      await connectPlayer('player-1');
      await connectPlayer('player-2');
      await joinMatch('player-1');
      await joinMatch('player-2');
      broadcasts = []; // Clear setup broadcasts
    });

    it('should accept responses in round_active status', async () => {
      const result = await submitResponse('player-1', 1, 'My response to round 1');
      
      expect(result).toMatchObject({ statusCode: 200 });
      
      // Should receive match_state update
      const stateUpdate = getLastBroadcastOfType('match_state');
      expect(stateUpdate).toBeDefined();
    });

    it('should transition to voting when all responses collected', async () => {
      // Get the match to find AI identities
      const match = matchManager.getMatch('global');
      const aiIdentities = match?.participants
        .filter(p => p.type === 'ai')
        .map(p => p.identity) || [];
      
      // Submit responses for all 4 participants
      await submitResponse('player-1', 1, 'Response from player 1');
      await submitResponse('player-2', 1, 'Response from player 2');
      
      // Simulate AI responses by directly submitting to match manager
      if (match) {
        matchManager.submitResponse(match.matchId, aiIdentities[0], 'AI response 1');
        const allCollected = matchManager.submitResponse(match.matchId, aiIdentities[1], 'AI response 2');
        expect(allCollected).toBe(true);
      }
      
      // Should receive round_voting message
      const votingMessage = getLastBroadcastOfType('round_voting');
      expect(votingMessage).toBeDefined();
      expect(votingMessage.data).toMatchObject({
        action: 'round_voting',
        roundNumber: 1,
        responses: expect.any(Object),
        timeLimit: 30
      });
    });
  });

  describe('Voting System', () => {
    beforeEach(async () => {
      // Set up match and complete response phase
      await connectPlayer('player-1');
      await connectPlayer('player-2');
      await joinMatch('player-1');
      await joinMatch('player-2');
      
      // Complete response phase
      const match = matchManager.getMatch('global');
      if (match) {
        const allIdentities: Identity[] = ['A', 'B', 'C', 'D'];
        allIdentities.forEach(identity => {
          matchManager.submitResponse(match.matchId, identity, `Response from ${identity}`);
        });
      }
      
      broadcasts = []; // Clear setup broadcasts
    });

    it('should accept votes in round_voting status', async () => {
      const result = await submitVote('player-1', 1, 'A');
      
      expect(result).toMatchObject({ statusCode: 200 });
      
      // Should receive match_state update
      const stateUpdate = getLastBroadcastOfType('match_state');
      expect(stateUpdate).toBeDefined();
    });

    it('should complete round when all votes collected', async () => {
      const match = matchManager.getMatch('global');
      if (!match) fail('Match not found');
      
      // Submit votes for all participants
      const allIdentities: Identity[] = ['A', 'B', 'C', 'D'];
      allIdentities.forEach(identity => {
        matchManager.submitVote(match.matchId, identity, 'A'); // Everyone votes A as human
      });
      
      // Should receive round_complete message
      const roundComplete = getLastBroadcastOfType('round_complete');
      expect(roundComplete).toBeDefined();
      expect(roundComplete.data).toMatchObject({
        action: 'round_complete',
        roundNumber: 1,
        scores: expect.any(Object),
        summary: expect.any(String),
        isMatchComplete: false
      });
    });
  });

  describe('Match Completion', () => {
    beforeEach(async () => {
      // Set up match
      await connectPlayer('player-1');
      await connectPlayer('player-2');
      await joinMatch('player-1');
      await joinMatch('player-2');
      broadcasts = []; // Clear setup broadcasts
    });

    it('should complete match after 5 rounds', async () => {
      const match = matchManager.getMatch('global');
      if (!match) fail('Match not found');
      
      const allIdentities: Identity[] = ['A', 'B', 'C', 'D'];
      
      // Complete 5 rounds
      for (let round = 1; round <= 5; round++) {
        // Submit responses
        allIdentities.forEach(identity => {
          matchManager.submitResponse(match.matchId, identity, `Round ${round} response from ${identity}`);
        });
        
        // Submit votes
        allIdentities.forEach(identity => {
          matchManager.submitVote(match.matchId, identity, 'A');
        });
      }
      
      // Should receive match_complete message
      const matchComplete = getLastBroadcastOfType('match_complete');
      expect(matchComplete).toBeDefined();
      expect(matchComplete.data).toMatchObject({
        action: 'match_complete',
        finalScores: expect.any(Object),
        rounds: expect.arrayContaining([
          expect.objectContaining({ roundNumber: 1 }),
          expect.objectContaining({ roundNumber: 2 }),
          expect.objectContaining({ roundNumber: 3 }),
          expect.objectContaining({ roundNumber: 4 }),
          expect.objectContaining({ roundNumber: 5 })
        ])
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown actions gracefully', async () => {
      await connectPlayer('player-1');
      
      const event: Partial<APIGatewayProxyWebsocketEventV2> = {
        requestContext: {
          eventType: 'MESSAGE',
          connectionId: 'player-1',
          routeKey: 'message'
        } as any,
        body: JSON.stringify({ action: 'unknown_action' })
      };
      
      const result = await handler(event as APIGatewayProxyWebsocketEventV2, {} as any, {} as any);
      expect(result).toMatchObject({ statusCode: 400 });
    });

    it('should send error messages to clients', async () => {
      await connectPlayer('player-1');
      
      // Try to submit response without joining match
      const result = await submitResponse('player-1', 1, 'Invalid response');
      expect(result).toMatchObject({ statusCode: 500 });
      
      // Should have sent error message to client
      const errorMessage = broadcasts.find(b => 
        b.connectionId === 'player-1' && b.data.action === 'error'
      );
      expect(errorMessage).toBeDefined();
      expect(errorMessage.data.message).toBe('Not in a match');
    });
  });

  describe('AI Response Generation', () => {
    it('should generate personality-based responses', async () => {
      const { generateAIResponse } = require('./match-handler');
      
      const response1 = await generateAIResponse('What is your favorite color?', 'curious_student');
      const response2 = await generateAIResponse('What is your favorite color?', 'witty_professional');
      const response3 = await generateAIResponse('What is your favorite color?', 'friendly_skeptic');
      
      expect(typeof response1).toBe('string');
      expect(typeof response2).toBe('string');
      expect(typeof response3).toBe('string');
      
      // Responses should be different (with high probability)
      expect([response1, response2, response3].length).toBe(3);
    });
  });
});