import { APIGatewayProxyResult } from 'aws-lambda';
import { AuthenticatedEvent } from '../middleware/auth';
import { getUserWithSync } from '../services/userSync';
import { handleAdmin } from './admin';

export async function handleSecureAdmin(
  event: AuthenticatedEvent,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    // Ensure user is authenticated
    if (!event.user.isAuthenticated) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required for admin access',
        }),
      };
    }

    // Get user from database to check role
    const dbUser = await getUserWithSync(event.user);
    
    if (!dbUser) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'User not found in database',
        }),
      };
    }

    // Check if user has admin role
    if (dbUser.role !== 'admin') {
      console.warn(`Unauthorized admin access attempt by user ${dbUser.email} with role ${dbUser.role}`);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Admin role required for this operation',
          userRole: dbUser.role,
        }),
      };
    }

    // Log admin operation for audit trail
    console.log(`Admin operation by ${dbUser.email}: ${event.httpMethod} ${event.path}`);

    // Add user context to event for downstream handlers
    const enrichedEvent = {
      ...event,
      dbUser,
    };

    // Forward to existing admin handler
    return await handleAdmin(enrichedEvent, corsHeaders);

  } catch (error) {
    console.error('Secure admin handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Admin authentication failed',
      }),
    };
  }
}