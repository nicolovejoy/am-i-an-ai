// Minimal WebSocket handler to make tests pass
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

interface Connection {
  connectionId: string;
  identity: 'A' | 'B' | 'C' | 'D';
  matchId: string;
  isAI?: boolean; // true for robot participants
  personality?: string; // future: will store robot personality traits
}

interface Match {
  id: string;
  connections: Map<string, Connection>;
  startTime: number;
  messages: Message[]; // DEPRECATED: 'messages' - will be replaced with round-based contributions
  timer?: NodeJS.Timeout;
  currentRound: number; // track which round we're in (1-5)
  roundContributions: Map<number, Set<string>>; // round -> set of identities who have contributed
}

interface Message {
  sender: string;
  content: string; // DEPRECATED: 'content' terminology - will become 'contribution' in round-based system
  timestamp: number;
}

// DynamoDB storage for production
// import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
// const tableName = process.env.DYNAMODB_TABLE || 'amianai-v2-matches';

// In-memory cache for tests (export for testing)
export const matches = new Map<string, Match>();
export const connectionToMatch = new Map<string, string>();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  try {
    console.log('WebSocket event:', JSON.stringify(event, null, 2));
    
    const { eventType, connectionId, routeKey } = event.requestContext;
    
    switch (routeKey || eventType) {
      case '$connect':
      case 'CONNECT':
        return handleConnect(connectionId!, event);
      
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

async function handleConnect(connectionId: string, _event: any) {
  // Find or create match (MVP: single global match)
  let match = matches.get('global') || createMatch('global');
  
  // Check if match is full
  if (match.connections.size >= 4) {
    return { statusCode: 403, body: 'Match full' };
  }
  
  // Assign random available identity
  const usedIdentities = new Set([...match.connections.values()].map(c => c.identity));
  const availableIdentities = (['A', 'B', 'C', 'D'] as const).filter(id => !usedIdentities.has(id));
  const randomIndex = Math.floor(Math.random() * availableIdentities.length);
  const identity = availableIdentities[randomIndex];
  
  // Store connection
  const connection: Connection = {
    connectionId,
    identity,
    matchId: match.id
  };
  
  match.connections.set(connectionId, connection);
  connectionToMatch.set(connectionId, match.id);
  matches.set(match.id, match);
  
  // MVP: When first human joins, immediately add 3 robot participants
  if (match.connections.size === 1) {
    await addRobotParticipants(match, _event);
    startMatchTimer(match);
    
    // Start first round after robots are added
    setTimeout(async () => {
      await broadcastToMatch(match, {
        action: 'round_start',
        round: 1,
        prompt: ROUND_PROMPTS[0]
      }, _event);
    }, 2000); // 2 second delay to let everything settle
  }
  
  console.log(`Connection ${connectionId} assigned identity ${identity} in match ${match.id}`);
  
  // Return connection details for tests
  return { 
    statusCode: 200, 
    body: JSON.stringify({
      identity,
      matchId: match.id
    })
  };
}

async function handleDisconnect(connectionId: string) {
  const matchId = connectionToMatch.get(connectionId);
  if (!matchId) return { statusCode: 200 };
  
  const match = matches.get(matchId);
  if (!match) return { statusCode: 200 };
  
  match.connections.delete(connectionId);
  connectionToMatch.delete(connectionId);
  
  // Clean up empty matches
  if (match.connections.size === 0) {
    if (match.timer) {
      clearTimeout(match.timer);
    }
    matches.delete(matchId);
  }
  
  return { statusCode: 200 };
}

async function handleMessage(connectionId: string, body: any, event: any) {
  const matchId = connectionToMatch.get(connectionId);
  if (!matchId) return { statusCode: 400, body: 'Not in match' };
  
  const match = matches.get(matchId);
  if (!match) return { statusCode: 400, body: 'Match not found' };
  
  const sender = match.connections.get(connectionId);
  if (!sender) return { statusCode: 400, body: 'Connection not found' };
  
  // Handle join action (both legacy 'join' and new 'join_match')
  if (body.action === 'join' || body.action === 'join_match') {
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const apiClient = new ApiGatewayManagementApiClient({ endpoint });
    
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify({ 
        action: 'connected',
        identity: sender.identity,
        matchId: match.id,
        participantCount: match.connections.size,
        matchStartTime: match.startTime,
        serverTime: Date.now()
      }))
    });
    
    try {
      await apiClient.send(command);
    } catch (error) {
      console.error('Failed to send identity:', error);
    }
    
    // Broadcast updated participant list to all participants
    const participants = Array.from(match.connections.values()).map(conn => ({
      identity: conn.identity,
      isAI: conn.isAI || false,
      connectionId: conn.connectionId
    }));
    
    await broadcastToMatch(match, {
      action: 'participants',
      participants
    }, event);
    
    return { statusCode: 200 };
  }
  
  // Handle regular messages (support both legacy content format and new submit_response format)
  let content: string;
  if (body.action === 'submit_response') {
    content = body.response;
  } else {
    content = body.content;
  }
  
  const message: Message = {
    sender: sender.identity,
    content: content,
    timestamp: Date.now()
  };
  
  match.messages.push(message);
  
  // Broadcast to all participants
  await broadcastToMatch(match, {
    action: 'message',
    ...message
  }, event);
  
  // Trigger robot responses if needed
  if (!sender.isAI) {
    await triggerRobotResponses(match, message, event);
  }
  
  return { statusCode: 200 };
}

function createMatch(id: string): Match {
  return {
    id,
    connections: new Map(),
    startTime: Date.now(),
    messages: [],
    currentRound: 1,
    roundContributions: new Map()
  };
}

async function addRobotParticipants(match: Match, event?: any) {
  // MVP: Add 3 robots (no personalities yet)
  const availableIdentities = (['A', 'B', 'C', 'D'] as const)
    .filter(id => ![...match.connections.values()].some(c => c.identity === id));
  
  for (let i = 0; i < 3; i++) {
    const robotConnection: Connection = {
      connectionId: `robot-${i}-${Date.now()}`,
      identity: availableIdentities[i],
      matchId: match.id,
      isAI: true
      // personality will be added in future iteration
    };
    
    match.connections.set(robotConnection.connectionId, robotConnection);
  }
  
  // Broadcast updated participant list after adding AI participants
  if (event) {
    const participants = Array.from(match.connections.values()).map(conn => ({
      identity: conn.identity,
      isAI: conn.isAI || false,
      connectionId: conn.connectionId
    }));
    
    await broadcastToMatch(match, {
      action: 'participants',
      participants
    }, event);
  }
}

async function broadcastToMatch(match: Match, data: any, event?: any) {
  // In test environment, use mocked AWS SDK
  if (process.env.NODE_ENV === 'test') {
    try {
      const AWS = require('aws-sdk');
      const api = new AWS.ApiGatewayManagementApi();
      
      // Broadcast to all real connections in match (skip AI participants)
      for (const [connectionId, connection] of match.connections) {
        if (!connection.isAI) {
          await api.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(data)
          }).promise();
        }
      }
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  } else {
    // In production, use the API Gateway Management API
    const endpoint = process.env.WEBSOCKET_ENDPOINT || 
      `https://${event?.requestContext?.domainName}/${event?.requestContext?.stage}`;
    
    const apiClient = new ApiGatewayManagementApiClient({
      endpoint
    });
    
    // Broadcast to all real connections (skip AI connections as they don't have real WebSocket connections)
    const promises = [];
    for (const [connectionId, connection] of match.connections) {
      if (!connection.isAI) {
        const command = new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(JSON.stringify(data))
        });
        promises.push(apiClient.send(command).catch(err => {
          console.error(`Failed to send to ${connectionId}:`, err);
        }));
      }
    }
    
    await Promise.all(promises);
  }
}

// Round prompts for MVP
const ROUND_PROMPTS = [
  "What's your favorite hobby?",
  "Describe your perfect day",
  "What technology excites you?",
  "Share a memorable experience",
  "What makes you laugh?"
];

// Mock robot responses for each round
const ROBOT_RESPONSES = {
  1: [ // Hobbies
    "I really enjoy reading science fiction novels in my spare time.",
    "Photography has become my passion lately - capturing everyday moments.",
    "I've been learning to cook different cuisines from around the world."
  ],
  2: [ // Perfect day
    "A perfect day would start with coffee and a good book by the window.",
    "I'd love to spend it exploring a new city with no set plans.",
    "Just hanging out with friends and family, maybe a barbecue outside."
  ],
  3: [ // Technology
    "AI and machine learning developments are fascinating to watch unfold.",
    "I'm really excited about renewable energy innovations.",
    "Virtual reality has so much potential for education and creativity."
  ],
  4: [ // Memorable experience
    "I remember the first time I saw the ocean - it was breathtaking.",
    "Moving to a new city was scary but ended up being amazing.",
    "Learning to ride a bike as a kid - felt like I could do anything."
  ],
  5: [ // What makes you laugh
    "Silly animal videos always crack me up, especially cats being dramatic.",
    "My friends' terrible dad jokes somehow always get me.",
    "Comedy shows where everything goes wrong but somehow works out."
  ]
};

async function triggerRobotResponses(match: Match, humanMessage: Message, event: any) {
  const senderIdentity = humanMessage.sender;
  if (!senderIdentity) return;
  
  // Track that this participant contributed to current round
  if (!match.roundContributions.has(match.currentRound)) {
    match.roundContributions.set(match.currentRound, new Set());
  }
  match.roundContributions.get(match.currentRound)!.add(senderIdentity);
  
  // Get robots who haven't responded in this round yet
  const allContributors = match.roundContributions.get(match.currentRound)!;
  const robotConnections = [...match.connections.values()].filter(c => 
    c.isAI && !allContributors.has(c.identity)
  );
  
  // Each robot responds once per round
  for (let i = 0; i < robotConnections.length; i++) {
    const robot = robotConnections[i];
    const responses = ROBOT_RESPONSES[match.currentRound as keyof typeof ROBOT_RESPONSES];
    const response = responses[i % responses.length];
    
    setTimeout(async () => {
      await handleMessage(robot.connectionId, {
        content: response
      }, event);
      
      // Check if round is complete (all 4 participants contributed)
      const updatedContributors = match.roundContributions.get(match.currentRound)!;
      updatedContributors.add(robot.identity);
      
      if (updatedContributors.size === 4) {
        await advanceToNextRound(match, event);
      }
    }, 2000 + i * 1000); // Stagger responses 2s, 3s, 4s
  }
}

async function advanceToNextRound(match: Match, event: any) {
  if (match.currentRound >= 5) {
    // Start voting phase
    await startVotingPhase(match, event);
    return;
  }
  
  match.currentRound++;
  const nextPrompt = ROUND_PROMPTS[match.currentRound - 1];
  
  // Broadcast new round prompt to all participants
  setTimeout(async () => {
    await broadcastToMatch(match, {
      action: 'round_start',
      round: match.currentRound,
      prompt: nextPrompt
    }, event);
  }, 3000); // 3 second pause between rounds
}

async function startVotingPhase(match: Match, event: any) {
  await broadcastToMatch(match, {
    action: 'voting_start',
    message: 'Time to vote! Who do you think is human vs robot?'
  }, event);
}

function startMatchTimer(match: Match) {
  // 10-minute match timer
  match.timer = setTimeout(async () => {
    await endMatchAndReveal(match);
  }, 10 * 60 * 1000); // 10 minutes
}

async function endMatchAndReveal(match: Match) {
  // Create identity reveal data
  const identities: Record<string, any> = {};
  
  for (const [, connection] of match.connections) {
    identities[connection.identity] = {
      type: connection.isAI ? 'ai' : 'human',
      name: connection.isAI ? `AI Assistant` : `Human User`,
      personality: connection.personality || undefined
    };
  }
  
  // Broadcast reveal to all participants
  await broadcastToMatch(match, {
    action: 'reveal',
    identities
  });
  
  // Clean up match
  if (match.timer) {
    clearTimeout(match.timer);
  }
  
  for (const connectionId of match.connections.keys()) {
    connectionToMatch.delete(connectionId);
  }
  
  matches.delete(match.id);
}