import { APIGatewayProxyResult } from 'aws-lambda';
import { queryDatabase } from '../lib/database.js';
import { z } from 'zod';

// Input validation schemas
const UserProfileUpdateSchema = z.object({
  displayName: z.string().min(2).max(30).optional(),
  bio: z.string().max(160).optional(),
});

const ConnectionResponseSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

// Helper function to check if user can view profile based on privacy settings
async function canViewProfile(viewerId: string | null, targetUserId: string): Promise<boolean> {
  if (!viewerId || viewerId === targetUserId) {
    return true; // Own profile or anonymous (will get limited view)
  }

  // Get target user's privacy level
  const userResult = await queryDatabase(
    'SELECT privacy_level FROM users WHERE id = $1',
    [targetUserId]
  );

  if (userResult.rows.length === 0) {
    return false;
  }

  const privacyLevel = userResult.rows[0].privacy_level;

  switch (privacyLevel) {
    case 'public':
      return true;
    
    case 'network':
      // Check if viewer is in network (direct connection or friend-of-friend)
      const networkResult = await queryDatabase(`
        WITH RECURSIVE network_users AS (
          -- Direct connections
          SELECT to_user_id as user_id, 1 as depth
          FROM user_connections 
          WHERE from_user_id = $1 AND status = 'accepted'
          
          UNION
          
          SELECT from_user_id as user_id, 1 as depth
          FROM user_connections 
          WHERE to_user_id = $1 AND status = 'accepted'
          
          UNION
          
          -- Friends of friends (depth 2)
          SELECT uc.to_user_id as user_id, 2 as depth
          FROM network_users nu
          JOIN user_connections uc ON nu.user_id = uc.from_user_id
          WHERE nu.depth = 1 AND uc.status = 'accepted'
          
          UNION
          
          SELECT uc.from_user_id as user_id, 2 as depth
          FROM network_users nu
          JOIN user_connections uc ON nu.user_id = uc.to_user_id
          WHERE nu.depth = 1 AND uc.status = 'accepted'
        )
        SELECT 1 FROM network_users WHERE user_id = $2 LIMIT 1
      `, [viewerId, targetUserId]);
      
      return networkResult.rows.length > 0;
    
    case 'connections':
    default:
      // Check if they are direct connections
      const connectionResult = await queryDatabase(`
        SELECT 1 FROM user_connections 
        WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
        AND status = 'accepted'
        LIMIT 1
      `, [viewerId, targetUserId]);
      
      return connectionResult.rows.length > 0;
  }
}

// Helper function to calculate trust score (reserved for future use)
// function calculateTrustScore(factors: {
//   accountAge: number;
//   emailVerified: boolean;
//   connectionCount: number;
//   positiveInteractions: number;
//   flaggedContent: number;
// }): number {
//   let score = 50; // Base score
//   
//   // Account age (max +20)
//   score += Math.min(factors.accountAge / 30, 20);
//   
//   // Email verified (+10)
//   if (factors.emailVerified) score += 10;
//   
//   // Connections (max +15)
//   score += Math.min(factors.connectionCount * 2, 15);
//   
//   // Positive interactions (max +15)  
//   score += Math.min(factors.positiveInteractions / 10, 15);
//   
//   // Penalties for flags (-5 per flag)
//   score -= factors.flaggedContent * 5;
//   
//   return Math.max(0, Math.min(100, Math.round(score)));
// }

/**
 * GET /api/users/me
 * Get current user's profile
 */
export const getCurrentUser = async (
  event: any,
  _context: any
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('getCurrentUser called with user:', event.user);
    const userId = event.user.id;

    const result = await queryDatabase(`
      SELECT 
        id, email, display_name, bio, privacy_level, trust_score,
        is_email_verified, created_at, last_login_at,
        (SELECT COUNT(*) FROM user_connections 
         WHERE (from_user_id = $1 OR to_user_id = $1) AND status = 'accepted') as connection_count
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const user = result.rows[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        bio: user.bio,
        privacyLevel: user.privacy_level,
        trustScore: user.trust_score,
        connectionCount: parseInt(user.connection_count),
        joinedAt: user.created_at,
        lastSeen: user.last_login_at,
      }),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * PUT /api/users/me
 * Update current user's profile
 */
export const updateCurrentUser = async (
  event: any,
  _context: any
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.user.id;
    const body = JSON.parse(event.body || '{}');
    
    const validation = UserProfileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validation.error.issues,
        }),
      };
    }

    const { displayName, bio } = validation.data;
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramCount = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${++paramCount}`);
      values.push(displayName);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${++paramCount}`);
      values.push(bio);
    }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No valid fields to update' }),
      };
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, display_name, bio, updated_at
    `;

    const result = await queryDatabase(query, values);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const updatedUser = result.rows[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updatedUser.id,
        displayName: updatedUser.display_name,
        bio: updatedUser.bio,
        updatedAt: updatedUser.updated_at,
      }),
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * GET /api/users/{userId}/profile
 * Get user profile (respects privacy settings)
 */
export const getUserProfile = async (
  event: any,
  _context: any
): Promise<APIGatewayProxyResult> => {
  try {
    const targetUserId = event.pathParameters?.userId;
    const viewerId = event.user?.id || null;

    if (!targetUserId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Check if viewer can see this profile
    const canView = await canViewProfile(viewerId, targetUserId);
    
    if (!canView) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Profile is private' }),
      };
    }

    const result = await queryDatabase(`
      SELECT 
        id, display_name, bio, trust_score, created_at,
        (SELECT COUNT(*) FROM user_connections 
         WHERE (from_user_id = $1 OR to_user_id = $1) AND status = 'accepted') as connection_count
      FROM users 
      WHERE id = $1
    `, [targetUserId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const user = result.rows[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        displayName: user.display_name,
        bio: user.bio,
        trustScore: user.trust_score,
        connectionCount: parseInt(user.connection_count),
        joinedAt: user.created_at,
      }),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * POST /api/users/{userId}/connect
 * Send connection request to user
 */
export const sendConnectionRequest = async (
  event: any,
  _context: any
): Promise<APIGatewayProxyResult> => {
  try {
    const fromUserId = event.user.id;
    const toUserId = event.pathParameters?.userId;

    if (!toUserId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Target user ID is required' }),
      };
    }

    if (fromUserId === toUserId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cannot connect to yourself' }),
      };
    }

    // Check if connection already exists
    const existingConnection = await queryDatabase(`
      SELECT status FROM user_connections 
      WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
    `, [fromUserId, toUserId]);

    if (existingConnection.rows.length > 0) {
      const status = existingConnection.rows[0].status;
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Connection already exists',
          currentStatus: status,
        }),
      };
    }

    // Create connection request
    const result = await queryDatabase(`
      INSERT INTO user_connections (from_user_id, to_user_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING id, created_at
    `, [fromUserId, toUserId]);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: result.rows[0].id,
        status: 'pending',
        createdAt: result.rows[0].created_at,
      }),
    };
  } catch (error) {
    console.error('Error sending connection request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * PUT /api/connections/{connectionId}
 * Accept or reject connection request
 */
export const updateConnectionRequest = async (
  event: any,
  _context: any
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.user.id;
    const connectionId = event.pathParameters?.connectionId;
    const body = JSON.parse(event.body || '{}');

    if (!connectionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Connection ID is required' }),
      };
    }

    const validation = ConnectionResponseSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validation.error.issues,
        }),
      };
    }

    const { status } = validation.data;

    // Verify user is the recipient of this connection request
    const connectionResult = await queryDatabase(`
      SELECT from_user_id, to_user_id, status as current_status
      FROM user_connections 
      WHERE id = $1 AND to_user_id = $2
    `, [connectionId, userId]);

    if (connectionResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Connection request not found' }),
      };
    }

    const connection = connectionResult.rows[0];

    if (connection.current_status !== 'pending') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Connection request already processed',
          currentStatus: connection.current_status,
        }),
      };
    }

    // Update connection status
    const updateResult = await queryDatabase(`
      UPDATE user_connections 
      SET status = $1, confirmed_at = NOW()
      WHERE id = $2
      RETURNING id, status, confirmed_at
    `, [status, connectionId]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        confirmedAt: updateResult.rows[0].confirmed_at,
      }),
    };
  } catch (error) {
    console.error('Error updating connection request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};