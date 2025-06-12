import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { verifyJWT, extractUserFromEvent, createAuthMiddleware } from '../auth';

// Mock the jsonwebtoken library
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  GetSecretValueCommand: jest.fn(),
}));

const jwt = require('jsonwebtoken');

// Mock Lambda context
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test-stream',
  identity: undefined,
  clientContext: undefined,
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('verifyJWT', () => {
    it('should verify a valid JWT token', async () => {
      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
        'cognito:groups': ['user'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jwt.verify.mockReturnValue(mockPayload);

      const result = await verifyJWT('valid.jwt.token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', expect.any(String));
    });

    it('should throw error for invalid JWT token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(verifyJWT('invalid.token')).rejects.toThrow('Invalid token');
    });

    it('should throw error for expired JWT token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(verifyJWT('expired.token')).rejects.toThrow('jwt expired');
    });
  });

  describe('extractUserFromEvent', () => {
    it('should extract user from Authorization header', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {
          Authorization: 'Bearer valid.jwt.token',
        },
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
        'cognito:groups': ['user'],
      };

      jwt.verify.mockReturnValue(mockPayload);

      const result = await extractUserFromEvent(mockEvent as APIGatewayProxyEvent);

      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        cognitoGroups: ['user'],
        isAuthenticated: true,
      });
    });

    it('should extract user from authorization header (lowercase)', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
        'cognito:groups': ['user'],
      };

      jwt.verify.mockReturnValue(mockPayload);

      const result = await extractUserFromEvent(mockEvent as APIGatewayProxyEvent);

      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        cognitoGroups: ['user'],
        isAuthenticated: true,
      });
    });

    it('should return anonymous user when no authorization header', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {},
      };

      const result = await extractUserFromEvent(mockEvent as APIGatewayProxyEvent);

      expect(result).toEqual({
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      });
    });

    it('should return anonymous user when authorization header is malformed', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {
          Authorization: 'InvalidFormat',
        },
      };

      const result = await extractUserFromEvent(mockEvent as APIGatewayProxyEvent);

      expect(result).toEqual({
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      });
    });

    it('should return anonymous user when JWT verification fails', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {
          Authorization: 'Bearer invalid.token',
        },
      };

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await extractUserFromEvent(mockEvent as APIGatewayProxyEvent);

      expect(result).toEqual({
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      });
    });
  });

  describe('createAuthMiddleware', () => {
    it('should allow requests that pass authentication', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {
          Authorization: 'Bearer valid.jwt.token',
        },
        httpMethod: 'GET',
        path: '/api/conversations',
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
        'cognito:groups': ['user'],
      };

      jwt.verify.mockReturnValue(mockPayload);

      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const middleware = createAuthMiddleware({
        requireAuth: true,
        allowAnonymous: false,
      });

      const result = await middleware(mockEvent as APIGatewayProxyEvent, mockContext, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: {
            id: 'user123',
            email: 'test@example.com',
            cognitoGroups: ['user'],
            isAuthenticated: true,
          },
        }),
        mockContext
      );
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    it('should reject unauthenticated requests when auth is required', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {},
        httpMethod: 'GET',
        path: '/api/conversations',
      };

      const mockHandler = jest.fn();

      const middleware = createAuthMiddleware({
        requireAuth: true,
        allowAnonymous: false,
      });

      const result = await middleware(mockEvent as APIGatewayProxyEvent, mockContext, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: 401,
        headers: expect.objectContaining({
          'Access-Control-Allow-Origin': '*',
        }),
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
      });
    });

    it('should allow anonymous requests when allowAnonymous is true', async () => {
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        headers: {},
        httpMethod: 'GET',
        path: '/api/conversations',
      };

      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const middleware = createAuthMiddleware({
        requireAuth: false,
        allowAnonymous: true,
      });

      const result = await middleware(mockEvent as APIGatewayProxyEvent, mockContext, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: {
            id: null,
            email: null,
            cognitoGroups: [],
            isAuthenticated: false,
          },
        }),
        mockContext
      );
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });
    });
  });
});