// Set up test environment
process.env.USERS_TABLE_NAME = 'test-users-table';
process.env.MATCHES_TABLE_NAME = 'test-matches-table';
process.env.AWS_REGION = 'us-east-1';

// Mock Zod for schema imports
jest.mock('zod', () => {
  const actual = jest.requireActual('zod');
  return actual;
});

// Store for mock data
const mockDataStore: { [key: string]: any } = {};
const inviteCodeToMatchId: { [key: string]: string } = {};

// Mock AWS SDK v2
jest.mock('aws-sdk', () => {
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => ({
      put: jest.fn((params: any) => ({ 
        promise: jest.fn(async () => {
          mockDataStore[params.Item.matchId] = params.Item;
          if (params.Item.inviteCode) {
            inviteCodeToMatchId[params.Item.inviteCode] = params.Item.matchId;
          }
          return {};
        })
      })),
      get: jest.fn((params: any) => ({ 
        promise: jest.fn(async () => {
          // Check if we're looking up by invite code
          const matchId = inviteCodeToMatchId[params.Key.matchId] || params.Key.matchId;
          return {
            Item: mockDataStore[matchId]
          };
        })
      })),
      query: jest.fn((params: any) => ({ 
        promise: jest.fn(async () => {
          // Mock returning AI users for getRandomAIUsers
          if (params.ExpressionAttributeValues?.[':userType'] === 'ai') {
            return {
              Items: [
                { userId: 'ai-philosopher', displayName: 'Philosopher', personality: 'philosopher', userType: 'ai' },
                { userId: 'ai-scientist', displayName: 'Scientist', personality: 'scientist', userType: 'ai' },
                { userId: 'ai-comedian', displayName: 'Comedian', personality: 'comedian', userType: 'ai' },
                { userId: 'ai-artist', displayName: 'Artist', personality: 'artist', userType: 'ai' },
                { userId: 'ai-engineer', displayName: 'Engineer', personality: 'engineer', userType: 'ai' }
              ]
            };
          }
          return { Items: [] };
        })
      })),
      update: jest.fn((params: any) => ({ 
        promise: jest.fn(async () => {
          const match = mockDataStore[params.Key.matchId];
          if (match) {
            // Apply updates from expression values
            if (params.ExpressionAttributeValues[':participants']) {
              match.participants = params.ExpressionAttributeValues[':participants'];
            }
            if (params.ExpressionAttributeValues[':status']) {
              match.status = params.ExpressionAttributeValues[':status'];
            }
            if (params.ExpressionAttributeValues[':waitingFor']) {
              match.waitingFor = params.ExpressionAttributeValues[':waitingFor'];
            }
            match.updatedAt = params.ExpressionAttributeValues[':updatedAt'];
          }
          return { Attributes: match };
        })
      })),
      scan: jest.fn(() => ({ promise: jest.fn() }))
    }))
  };
  return { DynamoDB: mockDynamoDB };
});

// Mock AWS SDK v3
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn()
}));

// Global Lambda client mock
const mockLambdaClient = {
  send: jest.fn()
};

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => mockLambdaClient),
  InvokeCommand: jest.fn((input: any) => ({ input, constructor: { name: 'InvokeCommand' } }))
}));

// Set default Lambda response for AI prompt generation
mockLambdaClient.send.mockImplementation(async (command: any) => {
  if (command.constructor.name === 'InvokeCommand') {
    // Mock AI service response
    return {
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({
          result: {
            prompt: "What's a simple pleasure that brings you unexpected joy?"
          }
        })
      }))
    };
  }
  return {};
});

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn(async (command: any) => {
        // Handle different command types
        if (command.constructor.name === 'PutCommand') {
          mockDataStore[command.input.Item.matchId] = command.input.Item;
          if (command.input.Item.inviteCode) {
            inviteCodeToMatchId[command.input.Item.inviteCode] = command.input.Item.matchId;
          }
          return {};
        } else if (command.constructor.name === 'GetCommand') {
          const matchId = inviteCodeToMatchId[command.input.Key.matchId] || command.input.Key.matchId;
          return { Item: mockDataStore[matchId] };
        } else if (command.constructor.name === 'UpdateCommand') {
          const match = mockDataStore[command.input.Key.matchId];
          if (match && command.input.ExpressionAttributeValues) {
            // Apply updates
            Object.entries(command.input.ExpressionAttributeValues).forEach(([key, value]) => {
              const fieldName = key.substring(1); // Remove : prefix
              if (fieldName in match || fieldName === 'participants' || fieldName === 'status' || fieldName === 'waitingFor') {
                match[fieldName] = value;
              }
            });
          }
          return { Attributes: match };
        } else if (command.constructor.name === 'ScanCommand') {
          // Find matches by invite code
          const inviteCode = command.input.ExpressionAttributeValues?.[':inviteCode'];
          if (inviteCode) {
            const matchId = inviteCodeToMatchId[inviteCode];
            if (matchId) {
              return { Items: [mockDataStore[matchId]] };
            }
          }
          return { Items: [] };
        } else if (command.constructor.name === 'QueryCommand') {
          // Mock returning AI users for getRandomAIUsers
          if (command.input.ExpressionAttributeValues?.[':userType'] === 'ai') {
            return {
              Items: [
                { userId: 'ai-philosopher', displayName: 'Philosopher', personality: 'philosopher', userType: 'ai' },
                { userId: 'ai-scientist', displayName: 'Scientist', personality: 'scientist', userType: 'ai' },
                { userId: 'ai-comedian', displayName: 'Comedian', personality: 'comedian', userType: 'ai' },
                { userId: 'ai-artist', displayName: 'Artist', personality: 'artist', userType: 'ai' },
                { userId: 'ai-engineer', displayName: 'Engineer', personality: 'engineer', userType: 'ai' }
              ]
            };
          }
          return { Items: [] };
        }
        return {};
      })
    }))
  },
  PutCommand: jest.fn((input: any) => ({ input, constructor: { name: 'PutCommand' } })),
  GetCommand: jest.fn((input: any) => ({ input, constructor: { name: 'GetCommand' } })),
  UpdateCommand: jest.fn((input: any) => ({ input, constructor: { name: 'UpdateCommand' } })),
  ScanCommand: jest.fn((input: any) => ({ input, constructor: { name: 'ScanCommand' } })),
  QueryCommand: jest.fn((input: any) => ({ input, constructor: { name: 'QueryCommand' } }))
}));