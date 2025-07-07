import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for MVP (will be replaced with DynamoDB later)
const matchStore = new Map<string, Match>();

interface Match {
  matchId: string;
  status: 'waiting' | 'active' | 'completed';
  currentRound: number;
  totalRounds: number;
  participants: Participant[];
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  identity: 'A' | 'B' | 'C' | 'D';
  isHuman: boolean;
  playerName?: string;
  isConnected: boolean;
}

interface Round {
  roundNumber: number;
  prompt: string;
  responses: Record<string, string>;
  votes: Record<string, string>;
  status: 'pending' | 'active' | 'voting' | 'completed';
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

// Kafka removed for now - focusing on core match functionality

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Match Service received event:', JSON.stringify(event, null, 2));

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: '',
      };
    }

    // Route requests - handle both with and without stage prefix
    const pathWithoutStage = path.replace(/^\/prod/, '');
    
    if (method === 'POST' && (pathWithoutStage === '/matches' || path === '/matches')) {
      return await createMatch(event);
    } else if (method === 'GET' && pathWithoutStage.match(/^\/matches\/[^\/]+$/)) {
      return await getMatch(event);
    } else if (method === 'POST' && pathWithoutStage.match(/^\/matches\/[^\/]+\/responses$/)) {
      return await submitResponse(event);
    } else if (method === 'POST' && pathWithoutStage.match(/^\/matches\/[^\/]+\/votes$/)) {
      return await submitVote(event);
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error in match service:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function createMatch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  
  if (!body.playerName) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'playerName is required' }),
    };
  }

  const matchId = `match-${uuidv4()}`;
  const now = new Date().toISOString();
  
  const match: Match = {
    matchId,
    status: 'waiting',
    currentRound: 0,
    totalRounds: 5,
    participants: [
      {
        identity: 'A',
        isHuman: true,
        playerName: body.playerName,
        isConnected: true,
      },
    ],
    rounds: [],
    createdAt: now,
    updatedAt: now,
  };

  // Store match
  matchStore.set(matchId, match);

  // TODO: Add Kafka event publishing later
  console.log('Match created:', matchId, 'Status:', match.status);

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify(match),
  };
}

async function getMatch(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const matchId = event.pathParameters?.matchId;
  
  if (!matchId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'matchId is required' }),
    };
  }

  const match = matchStore.get(matchId);
  
  if (!match) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Match not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(match),
  };
}

async function submitResponse(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const matchId = event.pathParameters?.matchId;
  const body = JSON.parse(event.body || '{}');
  
  if (!matchId || !body.identity || !body.response || body.round === undefined) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'matchId, identity, response, and round are required' }),
    };
  }

  const match = matchStore.get(matchId);
  if (!match) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Match not found' }),
    };
  }

  // TODO: Add Kafka event publishing later
  console.log('Response submitted:', matchId, 'Round:', body.round, 'Identity:', body.identity);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: true }),
  };
}

async function submitVote(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const matchId = event.pathParameters?.matchId;
  const body = JSON.parse(event.body || '{}');
  
  if (!matchId || !body.voter || !body.votedFor || body.round === undefined) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'matchId, voter, votedFor, and round are required' }),
    };
  }

  const match = matchStore.get(matchId);
  if (!match) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Match not found' }),
    };
  }

  // TODO: Add Kafka event publishing later
  console.log('Vote submitted:', matchId, 'Voter:', body.voter, 'Voted for:', body.votedFor);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: true }),
  };
}

// Cleanup on Lambda shutdown - simplified without Kafka
export const cleanup = async () => {
  console.log('Lambda cleanup completed');
};