import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handleConversations } from './handlers/conversations';
import { handlePersonas } from './handlers/personas';
import { handleAI } from './handlers/ai';
import { handleUsers } from './handlers/userRoutes';
import { requireAdminAccess, requireAuthentication } from './middleware/cognito-auth';
import { handleSecureAdmin } from './handlers/secureAdmin';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Enable CORS for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    console.log('Lambda invoked:', {
      method: event.httpMethod,
      path: event.path,
      resource: event.resource,
    });

    // Handle preflight CORS requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    const path = event.path;

    // Route requests to appropriate handlers with middleware
    if (path.startsWith('/api/conversations')) {
      return await requireAuthentication(event, context, async (authenticatedEvent) => {
        return await handleConversations(authenticatedEvent, corsHeaders);
      });
    }
    
    if (path.startsWith('/api/personas')) {
      return await requireAuthentication(event, context, async (authenticatedEvent) => {
        return await handlePersonas(authenticatedEvent, corsHeaders);
      });
    }
    
    if (path.startsWith('/api/ai')) {
      return await requireAuthentication(event, context, async (authenticatedEvent) => {
        return await handleAI(authenticatedEvent, corsHeaders);
      });
    }
    
    if (path.startsWith('/api/admin')) {
      return await requireAdminAccess(event, context, async (authenticatedEvent) => {
        return await handleSecureAdmin(authenticatedEvent, corsHeaders);
      });
    }

    if (path.startsWith('/api/users') || path.startsWith('/api/connections')) {
      console.log('User routes matched for path:', path);
      // User profile endpoints - need authentication for most operations
      return await requireAuthentication(event, context, async (authenticatedEvent) => {
        console.log('Authentication successful, calling handleUsers');
        return await handleUsers(authenticatedEvent, corsHeaders);
      });
    }

    // Health check endpoint
    if (path === '/api/health' || path === '/health') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
        }),
      };
    }

    // Default 404 response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Path ${path} not found`,
      }),
    };

  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred'
          : String(error),
      }),
    };
  }
};