import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { verify } from 'jsonwebtoken';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface UserContext {
  id: string | null;
  email: string | null;
  cognitoGroups: string[];
  isAuthenticated: boolean;
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: UserContext;
}

export interface JWTPayload {
  sub: string;
  email: string;
  'cognito:groups'?: string[];
  iat: number;
  exp: number;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowAnonymous?: boolean;
  requiredGroups?: string[];
}

// Cache for JWT public key
let cachedJWTSecret: string | null = null;

export async function getJWTSecret(): Promise<string> {
  if (cachedJWTSecret) {
    return cachedJWTSecret;
  }

  // In test environment, use a mock secret
  if (process.env.NODE_ENV === 'test') {
    cachedJWTSecret = 'test-secret-key';
    return cachedJWTSecret;
  }

  try {
    const client = new SecretsManagerClient({ region: 'us-east-1' });
    const command = new GetSecretValueCommand({
      SecretId: 'amianai-jwt-secret',
    });
    
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('JWT secret not found in AWS Secrets Manager');
    }
    
    const secret = JSON.parse(response.SecretString);
    cachedJWTSecret = secret.jwtSecret || secret.key;
    
    if (!cachedJWTSecret) {
      throw new Error('JWT secret format invalid');
    }
    
    return cachedJWTSecret;
  } catch (error) {
    console.error('Failed to retrieve JWT secret:', error);
    // For development, fall back to a default (this should be configured properly in production)
    cachedJWTSecret = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    return cachedJWTSecret;
  }
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = await getJWTSecret();
  
  try {
    const payload = verify(token, secret) as JWTPayload;
    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error}`);
  }
}

export async function extractUserFromEvent(event: APIGatewayProxyEvent): Promise<UserContext> {
  try {
    // Check for Authorization header (case-insensitive)
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      return {
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      };
    }

    // Extract Bearer token
    const matches = authHeader.match(/^Bearer\s+(.+)$/);
    if (!matches || matches.length < 2) {
      console.warn('Invalid Authorization header format');
      return {
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      };
    }

    const token = matches[1];
    const payload = await verifyJWT(token);

    return {
      id: payload.sub,
      email: payload.email,
      cognitoGroups: payload['cognito:groups'] || [],
      isAuthenticated: true,
    };
  } catch (error) {
    console.warn('JWT verification failed:', error);
    return {
      id: null,
      email: null,
      cognitoGroups: [],
      isAuthenticated: false,
    };
  }
}

export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const {
    requireAuth = false,
    allowAnonymous = true,
    requiredGroups = [],
  } = options;

  return async function authMiddleware(
    event: APIGatewayProxyEvent,
    context: Context,
    handler: (event: AuthenticatedEvent, context: Context) => Promise<APIGatewayProxyResult>
  ): Promise<APIGatewayProxyResult> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    try {
      // Extract user context
      const user = await extractUserFromEvent(event);

      // Check authentication requirements
      if (requireAuth && !user.isAuthenticated) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required',
          }),
        };
      }

      // Check group requirements
      if (requiredGroups.length > 0 && user.isAuthenticated) {
        const hasRequiredGroup = requiredGroups.some(group => 
          user.cognitoGroups.includes(group)
        );
        
        if (!hasRequiredGroup) {
          return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Forbidden',
              message: `Access denied. Required groups: ${requiredGroups.join(', ')}`,
            }),
          };
        }
      }

      // Check anonymous access
      if (!allowAnonymous && !user.isAuthenticated) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Anonymous access not allowed',
          }),
        };
      }

      // Add user context to event and proceed
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user,
      };

      return await handler(authenticatedEvent, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Authentication processing failed',
        }),
      };
    }
  };
}

// Predefined middleware configurations
export const requireAuthentication = createAuthMiddleware({
  requireAuth: true,
  allowAnonymous: false,
});

export const allowAnonymousAccess = createAuthMiddleware({
  requireAuth: false,
  allowAnonymous: true,
});

export const requireAdminAccess = createAuthMiddleware({
  requireAuth: true,
  allowAnonymous: false,
  requiredGroups: ['admin'],
});

export const requireModeratorAccess = createAuthMiddleware({
  requireAuth: true,
  allowAnonymous: false,
  requiredGroups: ['admin', 'moderator'],
});