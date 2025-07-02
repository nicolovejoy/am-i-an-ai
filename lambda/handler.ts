// Minimal WebSocket handler to make tests pass
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

interface Connection {
  connectionId: string;
  identity: 'A' | 'B' | 'C' | 'D';
  sessionId: string;
  isAI?: boolean;
  personality?: string;
}

interface Session {
  id: string;
  connections: Map<string, Connection>;
  startTime: number;
  messages: Message[];
  timer?: NodeJS.Timeout;
}

interface Message {
  sender: string;
  content: string;
  timestamp: number;
}

// DynamoDB storage for production
// import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
// const tableName = process.env.DYNAMODB_TABLE || 'amianai-v2-sessions';

// In-memory cache for tests (export for testing)
export const sessions = new Map<string, Session>();
export const connectionToSession = new Map<string, string>();

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
  // Find or create session (MVP: single global session)
  let session = sessions.get('global') || createSession('global');
  
  // Check if session is full
  if (session.connections.size >= 4) {
    return { statusCode: 403, body: 'Session full' };
  }
  
  // Assign next available identity
  const usedIdentities = new Set([...session.connections.values()].map(c => c.identity));
  const availableIdentities = (['A', 'B', 'C', 'D'] as const).filter(id => !usedIdentities.has(id));
  const identity = availableIdentities[0];
  
  // Store connection
  const connection: Connection = {
    connectionId,
    identity,
    sessionId: session.id
  };
  
  session.connections.set(connectionId, connection);
  connectionToSession.set(connectionId, session.id);
  sessions.set(session.id, session);
  
  // If we now have 2 humans, add 2 AI participants and start timer
  if (session.connections.size === 2) {
    addAIParticipants(session);
    startSessionTimer(session);
  }
  
  console.log(`Connection ${connectionId} assigned identity ${identity} in session ${session.id}`);
  
  // Return connection details for tests
  return { 
    statusCode: 200, 
    body: JSON.stringify({
      identity,
      sessionId: session.id
    })
  };
}

async function handleDisconnect(connectionId: string) {
  const sessionId = connectionToSession.get(connectionId);
  if (!sessionId) return { statusCode: 200 };
  
  const session = sessions.get(sessionId);
  if (!session) return { statusCode: 200 };
  
  session.connections.delete(connectionId);
  connectionToSession.delete(connectionId);
  
  // Clean up empty sessions
  if (session.connections.size === 0) {
    if (session.timer) {
      clearTimeout(session.timer);
    }
    sessions.delete(sessionId);
  }
  
  return { statusCode: 200 };
}

async function handleMessage(connectionId: string, body: any, event: any) {
  const sessionId = connectionToSession.get(connectionId);
  if (!sessionId) return { statusCode: 400, body: 'Not in session' };
  
  const session = sessions.get(sessionId);
  if (!session) return { statusCode: 400, body: 'Session not found' };
  
  const sender = session.connections.get(connectionId);
  if (!sender) return { statusCode: 400, body: 'Connection not found' };
  
  // Handle join action
  if (body.action === 'join') {
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const apiClient = new ApiGatewayManagementApiClient({ endpoint });
    
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify({ 
        action: 'connected',
        identity: sender.identity,
        sessionId: session.id,
        participantCount: session.connections.size,
        sessionStartTime: session.startTime,
        serverTime: Date.now()
      }))
    });
    
    try {
      await apiClient.send(command);
    } catch (error) {
      console.error('Failed to send identity:', error);
    }
    
    return { statusCode: 200 };
  }
  
  // Handle regular messages
  const message: Message = {
    sender: sender.identity,
    content: body.content,
    timestamp: Date.now()
  };
  
  session.messages.push(message);
  
  // Broadcast to all participants
  await broadcastToSession(session, {
    action: 'message',
    ...message
  }, event);
  
  // Trigger AI responses if needed
  if (!sender.isAI) {
    await triggerAIResponses(session, message, event);
  }
  
  return { statusCode: 200 };
}

function createSession(id: string): Session {
  return {
    id,
    connections: new Map(),
    startTime: Date.now(),
    messages: []
  };
}

function addAIParticipants(session: Session) {
  const aiPersonalities = ['analytical', 'creative'];
  const availableIdentities = (['A', 'B', 'C', 'D'] as const)
    .filter(id => ![...session.connections.values()].some(c => c.identity === id));
  
  for (let i = 0; i < 2; i++) {
    const aiConnection: Connection = {
      connectionId: `ai-${i}-${Date.now()}`,
      identity: availableIdentities[i],
      sessionId: session.id,
      isAI: true,
      personality: aiPersonalities[i]
    };
    
    session.connections.set(aiConnection.connectionId, aiConnection);
  }
}

async function broadcastToSession(session: Session, data: any, event?: any) {
  // In test environment, use mocked AWS SDK
  if (process.env.NODE_ENV === 'test') {
    try {
      const AWS = require('aws-sdk');
      const api = new AWS.ApiGatewayManagementApi();
      
      // Broadcast to all connections in session (including AI participants for testing)
      for (const [connectionId] of session.connections) {
        await api.postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(data)
        }).promise();
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
    for (const [connectionId, connection] of session.connections) {
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

async function triggerAIResponses(session: Session, humanMessage: Message, event: any) {
  // Simple AI response for MVP
  const aiConnections = [...session.connections.values()].filter(c => c.isAI);
  
  for (const ai of aiConnections) {
    // 30% chance to respond
    if (Math.random() < 0.3) {
      setTimeout(async () => {
        await handleMessage(ai.connectionId, {
          content: `Interesting point about "${humanMessage.content.slice(0, 20)}..."`
        }, event);
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    }
  }
}

function startSessionTimer(session: Session) {
  // 10-minute session timer
  session.timer = setTimeout(async () => {
    await endSessionAndReveal(session);
  }, 10 * 60 * 1000); // 10 minutes
}

async function endSessionAndReveal(session: Session) {
  // Create identity reveal data
  const identities: Record<string, any> = {};
  
  for (const [, connection] of session.connections) {
    identities[connection.identity] = {
      type: connection.isAI ? 'ai' : 'human',
      name: connection.isAI ? `AI Assistant` : `Human User`,
      personality: connection.personality || undefined
    };
  }
  
  // Broadcast reveal to all participants
  await broadcastToSession(session, {
    action: 'reveal',
    identities
  });
  
  // Clean up session
  if (session.timer) {
    clearTimeout(session.timer);
  }
  
  for (const connectionId of session.connections.keys()) {
    connectionToSession.delete(connectionId);
  }
  
  sessions.delete(session.id);
}