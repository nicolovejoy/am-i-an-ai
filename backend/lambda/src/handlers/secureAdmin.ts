import { APIGatewayProxyResult } from 'aws-lambda';
import { AuthenticatedEvent } from '../middleware/cognito-auth';
import { getUserWithSync } from '../services/userSync';
import { handleAdmin } from './admin';
import { isAdmin, logAdminAccess } from '../utils/adminConfig';

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

    // Try to get user from database to check role
    // If database doesn't exist yet, we'll handle this gracefully
    let dbUser;
    try {
      console.log('Attempting to get user from database:', event.user.email);
      dbUser = await getUserWithSync(event.user);
      console.log('User found in database:', { email: dbUser?.email, role: dbUser?.role });
    } catch (error) {
      console.log('Error getting user from database:', error);
      // If database tables don't exist yet, allow setup operations for admin users
      if (isAdmin(event.user)) {
        console.log('Database not ready, but allowing admin user for setup operations');
        logAdminAccess(event.user, 'database_setup', event.path);
        // Allow the admin operations to proceed
        return await handleAdmin(event, corsHeaders);
      } else {
        throw error; // Re-throw for non-admin users
      }
    }
    
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

    // Check if user has admin access using centralized admin configuration
    if (!isAdmin(event.user, dbUser)) {
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
    
    // If user is admin by email/cognito but not by database role, log for potential update
    if (isAdmin(event.user) && dbUser.role !== 'admin') {
      console.log(`User ${dbUser.email} has admin access but database role is ${dbUser.role}`);
      // Note: We're not updating the database here to avoid circular dependencies
      // The role could be updated on next sync or by admin management
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