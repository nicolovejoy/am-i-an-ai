import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleConversations } from './handlers/conversations';
import { handlePersonas } from './handlers/personas';
import { handleAI } from './handlers/ai';
import { handleAdmin } from './handlers/admin';

export const handler = async (
  event: APIGatewayProxyEvent
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

    // Route requests to appropriate handlers
    if (path.startsWith('/api/conversations')) {
      return await handleConversations(event, corsHeaders);
    }
    
    if (path.startsWith('/api/personas')) {
      return await handlePersonas(event, corsHeaders);
    }
    
    if (path.startsWith('/api/ai')) {
      return await handleAI(event, corsHeaders);
    }
    
    if (path.startsWith('/api/admin')) {
      return await handleAdmin(event, corsHeaders);
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