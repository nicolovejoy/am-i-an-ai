/**
 * New WebSocket handler for 5-Round Match System
 * Clean Match/Round architecture with proper action handling
 */

import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { MatchManager } from './MatchManager';
import {
  WebSocketMessage,
  JoinMatchMessage,
  SubmitResponseMessage,
  SubmitVoteMessage,
  MatchStateMessage,
  RoundStartMessage,
  RoundVotingMessage,
  RoundCompleteMessage,
  MatchCompleteMessage,
  Match
} from './types';

// Global match manager instance (in production, this would use DynamoDB)
export const matchManager = new MatchManager();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  try {
    console.log('WebSocket event:', JSON.stringify(event, null, 2));
    
    const { eventType, connectionId, routeKey } = event.requestContext;
    
    switch (routeKey || eventType) {
      case '$connect':
      case 'CONNECT':
        return handleConnect(connectionId!);
      
      case '$disconnect':
      case 'DISCONNECT':
        return handleDisconnect(connectionId!);
      
      case 'message':
      case 'MESSAGE':
      case '$default':
        return handleMessage(connectionId!, JSON.parse(event.body || '{}'), event);
      
      default:
        console.log('Unknown route/event:', routeKey, eventType);
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function handleConnect(connectionId: string) {
  console.log(`Connection established: ${connectionId}`);
  return { statusCode: 200 };
}

async function handleDisconnect(connectionId: string) {
  console.log(`Connection disconnected: ${connectionId}`);
  
  // Remove participant from any active match
  matchManager.removeParticipant(connectionId);
  
  return { statusCode: 200 };
}

async function handleMessage(connectionId: string, message: WebSocketMessage, event: any) {
  console.log(`Handling message from ${connectionId}:`, message);
  
  try {
    switch (message.action) {
      case 'join_match':
        return await handleJoinMatch(connectionId, message as JoinMatchMessage, event);
      
      case 'submit_response':
        return await handleSubmitResponse(connectionId, message as SubmitResponseMessage, event);
      
      case 'submit_vote':
        return await handleSubmitVote(connectionId, message as SubmitVoteMessage, event);
      
      default:
        console.log('Unknown action:', message.action);
        return { statusCode: 400, body: 'Unknown action' };
    }
  } catch (error) {
    console.error(`Error handling ${message.action}:`, error);
    
    // Send error to client
    await sendToConnection(connectionId, {
      action: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, event);
    
    return { statusCode: 500, body: 'Message handling error' };
  }
}

async function handleJoinMatch(connectionId: string, _message: JoinMatchMessage, event: any) {
  // For MVP, use a single global match
  const matchId = 'global';
  
  // Get or create match
  let match = matchManager.getMatch(matchId);
  if (!match) {
    match = matchManager.createMatch(matchId);
  }
  
  // Add human participant
  const { identity } = matchManager.addHumanParticipant(matchId, connectionId);
  
  console.log(`Player ${connectionId} joined as ${identity}`);
  
  // Send match state to the new participant
  await sendToConnection(connectionId, {
    action: 'match_joined',
    identity,
    match
  }, event);
  
  // Broadcast updated match state to all participants
  await broadcastToMatch(match, {
    action: 'match_state',
    match
  } as MatchStateMessage, event);
  
  // For MVP testing: Auto-fill with AI participants and start match immediately
  if (match.participants.filter(p => p.type === 'human').length === 1 && match.status === 'waiting') {
    // Fill remaining slots with AI participants
    matchManager.addAIParticipants(matchId);
    
    // Start the match
    const firstRound = matchManager.startMatch(matchId);
    
    await broadcastToMatch(match, {
      action: 'round_start',
      roundNumber: firstRound.roundNumber,
      prompt: firstRound.prompt,
      timeLimit: match.settings.responseTimeLimit
    } as RoundStartMessage, event);
  }
  
  return { statusCode: 200 };
}

async function handleSubmitResponse(connectionId: string, message: SubmitResponseMessage, event: any) {
  const match = matchManager.getMatchByConnection(connectionId);
  if (!match) {
    throw new Error('Not in a match');
  }
  
  const participant = match.participants.find(p => p.connectionId === connectionId);
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  console.log(`${participant.identity} submitted response for round ${message.roundNumber}`);
  
  // Submit response and check if round is ready for voting
  const allResponsesCollected = matchManager.submitResponse(
    match.matchId, 
    participant.identity, 
    message.response
  );
  
  // Broadcast updated match state
  await broadcastToMatch(match, {
    action: 'match_state',
    match
  } as MatchStateMessage, event);
  
  // If all responses collected, start voting phase
  if (allResponsesCollected) {
    const currentRound = matchManager.getCurrentRound(match);
    if (currentRound) {
      await broadcastToMatch(match, {
        action: 'round_voting',
        roundNumber: currentRound.roundNumber,
        responses: currentRound.responses,
        timeLimit: match.settings.votingTimeLimit
      } as RoundVotingMessage, event);
    }
  }
  
  return { statusCode: 200 };
}

async function handleSubmitVote(connectionId: string, message: SubmitVoteMessage, event: any) {
  const match = matchManager.getMatchByConnection(connectionId);
  if (!match) {
    throw new Error('Not in a match');
  }
  
  const participant = match.participants.find(p => p.connectionId === connectionId);
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  console.log(`${participant.identity} voted ${message.humanIdentity} as human for round ${message.roundNumber}`);
  
  // Submit vote and check if round is complete
  const allVotesCollected = matchManager.submitVote(
    match.matchId,
    participant.identity,
    message.humanIdentity
  );
  
  // Broadcast updated match state
  await broadcastToMatch(match, {
    action: 'match_state',
    match
  } as MatchStateMessage, event);
  
  if (allVotesCollected) {
    const currentRound = matchManager.getCurrentRound(match);
    
    if (match.status === 'completed') {
      // Match is finished
      await broadcastToMatch(match, {
        action: 'match_complete',
        finalScores: match.finalScores!,
        rounds: match.rounds
      } as MatchCompleteMessage, event);
    } else if (currentRound) {
      // Round completed, show results and start next round
      await broadcastToMatch(match, {
        action: 'round_complete',
        roundNumber: currentRound.roundNumber,
        scores: currentRound.scores,
        summary: currentRound.summary || '',
        isMatchComplete: false
      } as RoundCompleteMessage, event);
      
      // Start next round
      const nextRound = matchManager.getCurrentRound(match);
      if (nextRound) {
        // Small delay for dramatic effect
        setTimeout(async () => {
          await broadcastToMatch(match, {
            action: 'round_start',
            roundNumber: nextRound.roundNumber,
            prompt: nextRound.prompt,
            timeLimit: match.settings.responseTimeLimit
          } as RoundStartMessage, event);
        }, 2000);
      }
    }
  }
  
  return { statusCode: 200 };
}

/**
 * Send a message to a specific connection
 */
async function sendToConnection(connectionId: string, data: any, event?: any) {
  // In test environment, use mocked AWS SDK
  if (process.env.NODE_ENV === 'test') {
    try {
      const AWS = require('aws-sdk');
      const api = new AWS.ApiGatewayManagementApi();
      
      await api.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(data)
      }).promise();
    } catch (error) {
      console.error('Test broadcast error:', error);
    }
    return;
  }

  // In production, use the API Gateway Management API
  const endpoint = process.env.WEBSOCKET_ENDPOINT || 
    `https://${event?.requestContext?.domainName}/${event?.requestContext?.stage}`;
  
  const apiClient = new ApiGatewayManagementApiClient({ endpoint });
  
  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(data))
    });
    
    await apiClient.send(command);
  } catch (error) {
    console.error(`Failed to send to ${connectionId}:`, error);
  }
}

/**
 * Broadcast a message to all human participants in a match
 */
async function broadcastToMatch(match: Match, data: any, event?: any) {
  const humanParticipants = match.participants.filter(p => p.type === 'human');
  
  const promises = humanParticipants.map(participant => {
    if (participant.connectionId) {
      return sendToConnection(participant.connectionId, data, event);
    }
    return Promise.resolve();
  });
  
  await Promise.all(promises);
}

/**
 * Generate AI response for testing (mock implementation)
 */
export async function generateAIResponse(_prompt: string, personality: string): Promise<string> {
  // Mock AI responses based on personality
  const responses: Record<string, string[]> = {
    curious_student: [
      "That's interesting! I wonder if there's more to explore here?",
      "Hmm, what do you think about the implications of that?",
      "Could you tell me more about your perspective on this?"
    ],
    witty_professional: [
      "Well, that's one way to look at it.",
      "Efficient solution. I appreciate the practicality.",
      "Interesting approach. Very methodical."
    ],
    friendly_skeptic: [
      "I'm not entirely convinced, but I see your point.",
      "That raises some questions for me, actually.",
      "Sounds reasonable, though I'd want to verify that first."
    ]
  };
  
  const personalityResponses = responses[personality] || responses.curious_student;
  const randomIndex = Math.floor(Math.random() * personalityResponses.length);
  
  return personalityResponses[randomIndex];
}