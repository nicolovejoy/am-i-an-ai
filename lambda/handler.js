// WebSocket Lambda Handler for amianai v2
// Supports both testing mode (1H+3AI) and production mode (2H+2AI)

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

const TABLE_NAME = process.env.DYNAMODB_TABLE;

// Configuration for different modes
const SESSION_CONFIG = {
  testing: {
    humanCount: 1,
    aiCount: 3,
    timeLimit: 180, // 3 minutes in seconds
    messageLimit: 10,
    mode: 'testing'
  },
  production: {
    humanCount: 2,
    aiCount: 2,
    timeLimit: 300, // 5 minutes in seconds
    messageLimit: 20,
    mode: 'production'
  }
};

// Helper to determine session mode based on participants
const getSessionMode = (session) => {
  const humanCount = Object.values(session.participants || {})
    .filter(p => p.type === 'human').length;
  
  return humanCount === 1 ? 'testing' : 'production';
};

// Helper to check if session has reached limits
const hasReachedLimits = (session) => {
  const mode = getSessionMode(session);
  const config = SESSION_CONFIG[mode];
  
  // Check message limit
  if (session.messageCount >= config.messageLimit) {
    return { reached: true, reason: 'message_limit' };
  }
  
  // Check time limit
  const elapsed = Date.now() - session.startTime;
  if (elapsed >= config.timeLimit * 1000) {
    return { reached: true, reason: 'time_limit' };
  }
  
  return { reached: false };
};

// Main handler
exports.handler = async (event) => {
  const { routeKey, connectionId, requestContext } = event;
  
  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(connectionId);
      
      case '$disconnect':
        return await handleDisconnect(connectionId);
      
      case 'sendMessage':
        return await handleMessage(connectionId, JSON.parse(event.body));
      
      case 'getStatus':
        return await handleGetStatus(connectionId);
      
      default:
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

// Handle new WebSocket connection
async function handleConnect(connectionId) {
  // Find or create a session
  let session = await findAvailableSession();
  
  if (!session) {
    // Create new session
    const mode = 'production'; // Default to production, can be changed via query params
    const config = SESSION_CONFIG[mode];
    
    session = {
      sessionId: generateSessionId(),
      participants: {},
      messages: [],
      messageCount: 0,
      startTime: Date.now(),
      status: 'waiting',
      mode: mode,
      config: config
    };
    
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: session
    }).promise();
  }
  
  // Assign participant identity
  const identity = assignIdentity(session);
  
  // Add participant to session
  session.participants[identity] = {
    connectionId,
    identity,
    type: Object.keys(session.participants).length < SESSION_CONFIG[session.mode].humanCount ? 'human' : 'ai',
    joinedAt: Date.now()
  };
  
  // Update session
  await dynamodb.update({
    TableName: TABLE_NAME,
    Key: { sessionId: session.sessionId },
    UpdateExpression: 'SET participants = :participants, #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':participants': session.participants,
      ':status': Object.keys(session.participants).length === 4 ? 'active' : 'waiting'
    }
  }).promise();
  
  // Store connection mapping
  await dynamodb.put({
    TableName: TABLE_NAME,
    Item: {
      connectionId,
      sessionId: session.sessionId,
      identity,
      type: 'connection'
    }
  }).promise();
  
  return { statusCode: 200, body: JSON.stringify({ identity, sessionId: session.sessionId }) };
}

// Handle WebSocket disconnection
async function handleDisconnect(connectionId) {
  // Find connection
  const connection = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { connectionId }
  }).promise();
  
  if (!connection.Item) {
    return { statusCode: 200 };
  }
  
  const { sessionId, identity } = connection.Item;
  
  // Remove from session
  const session = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { sessionId }
  }).promise();
  
  if (session.Item && session.Item.participants) {
    delete session.Item.participants[identity];
    
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { sessionId },
      UpdateExpression: 'SET participants = :participants',
      ExpressionAttributeValues: {
        ':participants': session.Item.participants
      }
    }).promise();
  }
  
  // Delete connection record
  await dynamodb.delete({
    TableName: TABLE_NAME,
    Key: { connectionId }
  }).promise();
  
  return { statusCode: 200 };
}

// Handle incoming message
async function handleMessage(connectionId, message) {
  // Get connection info
  const connection = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { connectionId }
  }).promise();
  
  if (!connection.Item) {
    return { statusCode: 400, body: 'Connection not found' };
  }
  
  const { sessionId, identity } = connection.Item;
  
  // Get session
  const session = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { sessionId }
  }).promise();
  
  if (!session.Item) {
    return { statusCode: 400, body: 'Session not found' };
  }
  
  // Check if session has reached limits
  const limits = hasReachedLimits(session.Item);
  if (limits.reached) {
    await broadcastToSession(sessionId, {
      type: 'session_ended',
      reason: limits.reason,
      timestamp: Date.now()
    });
    
    // Update session status
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { sessionId },
      UpdateExpression: 'SET #status = :status, endReason = :reason',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'ended',
        ':reason': limits.reason
      }
    }).promise();
    
    return { statusCode: 200, body: JSON.stringify({ status: 'session_ended', reason: limits.reason }) };
  }
  
  // Add message to session
  const newMessage = {
    id: generateMessageId(),
    sender: identity,
    content: message.content,
    timestamp: Date.now()
  };
  
  await dynamodb.update({
    TableName: TABLE_NAME,
    Key: { sessionId },
    UpdateExpression: 'SET messages = list_append(messages, :message), messageCount = messageCount + :inc',
    ExpressionAttributeValues: {
      ':message': [newMessage],
      ':inc': 1
    }
  }).promise();
  
  // Broadcast message to all participants
  await broadcastToSession(sessionId, {
    type: 'message',
    ...newMessage
  });
  
  return { statusCode: 200 };
}

// Handle status request
async function handleGetStatus(connectionId) {
  const connection = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { connectionId }
  }).promise();
  
  if (!connection.Item) {
    return { statusCode: 400, body: 'Connection not found' };
  }
  
  const { sessionId } = connection.Item;
  
  const session = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { sessionId }
  }).promise();
  
  if (!session.Item) {
    return { statusCode: 400, body: 'Session not found' };
  }
  
  const mode = getSessionMode(session.Item);
  const config = SESSION_CONFIG[mode];
  const elapsed = Date.now() - session.Item.startTime;
  const remainingTime = Math.max(0, (config.timeLimit * 1000) - elapsed);
  const remainingMessages = Math.max(0, config.messageLimit - session.Item.messageCount);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: session.Item.status,
      mode: mode,
      participantCount: Object.keys(session.Item.participants).length,
      messageCount: session.Item.messageCount,
      remainingTime: Math.floor(remainingTime / 1000),
      remainingMessages: remainingMessages,
      limits: config
    })
  };
}

// Broadcast message to all session participants
async function broadcastToSession(sessionId, message) {
  const session = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { sessionId }
  }).promise();
  
  if (!session.Item || !session.Item.participants) {
    return;
  }
  
  const promises = Object.values(session.Item.participants).map(async (participant) => {
    try {
      await apiGateway.postToConnection({
        ConnectionId: participant.connectionId,
        Data: JSON.stringify(message)
      }).promise();
    } catch (error) {
      if (error.statusCode === 410) {
        // Connection is stale, remove it
        await handleDisconnect(participant.connectionId);
      }
    }
  });
  
  await Promise.all(promises);
}

// Helper functions
function findAvailableSession() {
  // In a real implementation, this would scan DynamoDB for sessions
  // with status='waiting' and less than 4 participants
  return null; // For now, always create new sessions
}

function assignIdentity(session) {
  const identities = ['A', 'B', 'C', 'D'];
  const taken = Object.keys(session.participants || {});
  return identities.find(id => !taken.includes(id)) || 'A';
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}