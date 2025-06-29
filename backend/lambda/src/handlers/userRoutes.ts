import { APIGatewayProxyResult } from 'aws-lambda';
import { AuthenticatedEvent } from '../middleware/cognito-auth.js';
import { 
  getCurrentUser, 
  updateCurrentUser, 
  getUserProfile, 
  sendConnectionRequest, 
  updateConnectionRequest 
} from './users.js';

export async function handleUsers(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;

    console.log('UserRoutes Debug:', { method, path, user: event.user });

    // Extract path segments
    const pathSegments = path.split('/').filter(Boolean);
    // pathSegments = ['api', 'users', ...rest]

    console.log('Path segments:', pathSegments);

    if (pathSegments.length < 3) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid user endpoint' }),
      };
    }

    const endpoint = pathSegments[2]; // 'me' or userId

    // GET /api/users/me
    if (method === 'GET' && endpoint === 'me') {
      const result = await getCurrentUser(event, event);
      return { ...result, headers: { ...result.headers, ...corsHeaders } };
    }

    // PUT /api/users/me
    if (method === 'PUT' && endpoint === 'me') {
      const result = await updateCurrentUser(event, event);
      return { ...result, headers: { ...result.headers, ...corsHeaders } };
    }

    // GET /api/users/{userId}/profile
    if (method === 'GET' && pathSegments[3] === 'profile') {
      const result = await getUserProfile(event, event);
      return { ...result, headers: { ...result.headers, ...corsHeaders } };
    }

    // POST /api/users/{userId}/connect
    if (method === 'POST' && pathSegments[3] === 'connect') {
      const result = await sendConnectionRequest(event, event);
      return { ...result, headers: { ...result.headers, ...corsHeaders } };
    }

    // PUT /api/connections/{connectionId}
    if (method === 'PUT' && pathSegments[1] === 'connections') {
      const result = await updateConnectionRequest(event, event);
      return { ...result, headers: { ...result.headers, ...corsHeaders } };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'User endpoint not found',
        path: path,
        method: method,
      }),
    };

  } catch (error) {
    console.error('Error in user routes:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}