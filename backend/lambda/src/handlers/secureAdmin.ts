import { APIGatewayProxyResult } from 'aws-lambda';
import { AuthenticatedEvent } from '../middleware/cognito-auth';
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

    // Try to get user from database to check role
    // If database doesn't exist yet, we'll handle this gracefully
    let dbUser;
    try {
      console.log('Attempting to get user from database:', event.user.email);
      dbUser = await getUserWithSync(event.user);
      console.log('User found in database:', { email: dbUser?.email, role: dbUser?.role });
    } catch (error) {
      console.log('Error getting user from database:', error);
      // If database tables don't exist yet, allow setup operations for known admin emails
      const adminEmails = ['nlovejoy@me.com'];
      if (adminEmails.includes(event.user.email || '')) {
        console.log('Database not ready, but allowing admin email for setup operations');
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

    // Check if user has admin role or is in admin email list
    const adminEmails = ['nlovejoy@me.com'];
    const isAdminEmail = adminEmails.includes(dbUser.email || '');
    
    if (dbUser.role !== 'admin' && !isAdminEmail) {
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
    
    // If user is admin by email but not by role, update their role
    if (isAdminEmail && dbUser.role !== 'admin') {
      console.log(`Granting admin role to ${dbUser.email} based on email whitelist`);
      // Note: We're not updating the database here to avoid circular dependencies
      // The role will be updated on next sync
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