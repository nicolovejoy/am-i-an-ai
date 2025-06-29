import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { isAdmin, logAdminAccess } from '../utils/adminConfig';

export interface UserContext {
  id: string | null;
  email: string | null;
  cognitoGroups: string[];
  isAuthenticated: boolean;
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: UserContext;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowAnonymous?: boolean;
  requiredGroups?: string[];
}

// Create verifier outside of function for reuse
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    
    if (!userPoolId || !clientId) {
      throw new Error('Cognito configuration missing: COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set');
    }
    
    verifier = CognitoJwtVerifier.create({
      userPoolId: userPoolId,
      tokenUse: 'id',
      clientId: clientId,
    });
  }
  
  return verifier;
}

export async function extractUserFromEvent(event: APIGatewayProxyEvent): Promise<UserContext> {
  try {
    // Check for Authorization header (case-insensitive)
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No auth header found');
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
      console.warn('Invalid Authorization header format:', authHeader);
      return {
        id: null,
        email: null,
        cognitoGroups: [],
        isAuthenticated: false,
      };
    }

    const token = matches[1];
    console.log('Token extracted, length:', token.length);
    
    // Verify Cognito token
    console.log('About to verify token with Cognito');
    const verifier = getVerifier();
    const payload = await verifier.verify(token);
    console.log('Token verified successfully, payload keys:', Object.keys(payload));

    return {
      id: payload.sub,
      email: payload.email as string,
      cognitoGroups: (payload['cognito:groups'] as string[]) || [],
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Cognito token verification failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
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

// Custom admin access check based on email
export function createAdminEmailMiddleware() {
  return async function adminEmailMiddleware(
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
      console.log('Admin middleware: Starting authentication check');
      console.log('Admin middleware: Authorization header:', event.headers?.Authorization || event.headers?.authorization);
      // Extract user context
      const user = await extractUserFromEvent(event);
      console.log('Admin middleware: User extracted:', { email: user.email, isAuthenticated: user.isAuthenticated });

      // Check authentication
      if (!user.isAuthenticated) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required',
          }),
        };
      }

      // Check if user has admin access using centralized config
      if (!isAdmin(user)) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Forbidden',
            message: 'Admin access required',
          }),
        };
      }

      // Log admin access for audit purposes
      logAdminAccess(user, 'admin_access', event.path);

      // Add user context to event and proceed
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user,
      };

      return await handler(authenticatedEvent, context);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
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

export const requireAdminAccess = createAdminEmailMiddleware();

export const requireModeratorAccess = createAuthMiddleware({
  requireAuth: true,
  allowAnonymous: false,
  requiredGroups: ['admin', 'moderator'],
});