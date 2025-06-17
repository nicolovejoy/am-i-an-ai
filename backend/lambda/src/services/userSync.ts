import { getDatabase } from '../lib/database';
import { UserContext } from '../middleware/cognito-auth';

export interface DatabaseUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar: string | null;
  role: 'user' | 'moderator' | 'admin';
  subscription: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_expires_at: Date | null;
  preferences: Record<string, any>;
  current_usage: Record<string, any>;
  limits: Record<string, any>;
  is_email_verified: boolean;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function getUserFromDatabase(userId: string): Promise<DatabaseUser | null> {
  const db = await getDatabase();
  
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rowCount === 0) {
      return null;
    }
    
    return result.rows[0] as DatabaseUser;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
}

export function mapCognitoGroupsToRole(cognitoGroups: string[]): 'user' | 'moderator' | 'admin' {
  if (cognitoGroups.includes('admin')) {
    return 'admin';
  }
  if (cognitoGroups.includes('moderator')) {
    return 'moderator';
  }
  return 'user';
}

export function mapRoleToSubscription(role: 'user' | 'moderator' | 'admin'): 'free' | 'basic' | 'premium' | 'enterprise' {
  switch (role) {
    case 'admin':
      return 'enterprise';
    case 'moderator':
      return 'premium';
    default:
      return 'free';
  }
}

export async function createUserInDatabase(userContext: UserContext): Promise<DatabaseUser> {
  const db = await getDatabase();
  
  const role = mapCognitoGroupsToRole(userContext.cognitoGroups);
  const subscription = mapRoleToSubscription(role);
  
  const defaultPreferences = {
    theme: 'system',
    notifications: {
      email: true,
      push: true,
    },
    privacy: {
      profileVisible: true,
      conversationsVisible: false,
    },
    conversation: {
      autoSave: true,
      showTypingIndicators: true,
    },
  };
  
  const defaultUsage = {
    messagesThisMonth: 0,
    conversationsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
  };
  
  const defaultLimits = {
    messagesPerMonth: role === 'admin' ? -1 : role === 'moderator' ? 10000 : 1000,
    conversationsPerMonth: role === 'admin' ? -1 : role === 'moderator' ? 100 : 50,
    aiRequestsPerDay: role === 'admin' ? -1 : role === 'moderator' ? 500 : 100,
  };
  
  try {
    const result = await db.query(
      `INSERT INTO users (
        id, email, role, subscription, preferences, current_usage, limits,
        is_email_verified, is_active, last_login_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userContext.id,
        userContext.email,
        role,
        subscription,
        JSON.stringify(defaultPreferences),
        JSON.stringify(defaultUsage),
        JSON.stringify(defaultLimits),
        true, // Assume email is verified if they got through Cognito
        true,
        new Date(),
      ]
    );
    
    return result.rows[0] as DatabaseUser;
  } catch (error) {
    console.error('Error creating user in database:', error);
    throw error;
  }
}

export async function updateUserInDatabase(userId: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser> {
  const db = await getDatabase();
  
  const setClause = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(', ');
  
  const values = [userId, ...Object.values(updates)];
  
  try {
    const result = await db.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rowCount === 0) {
      throw new Error(`User ${userId} not found for update`);
    }
    
    return result.rows[0] as DatabaseUser;
  } catch (error) {
    console.error('Error updating user in database:', error);
    throw error;
  }
}

export async function syncUserFromCognito(userContext: UserContext): Promise<DatabaseUser | null> {
  // Return null for anonymous users
  if (!userContext.isAuthenticated || !userContext.id || !userContext.email) {
    return null;
  }
  
  try {
    // Check if user exists in database
    const existingUser = await getUserFromDatabase(userContext.id);
    
    if (!existingUser) {
      // Create new user
      console.log(`Creating new user in database: ${userContext.email}`);
      return await createUserInDatabase(userContext);
    }
    
    // Check if user role needs to be updated based on Cognito groups
    const newRole = mapCognitoGroupsToRole(userContext.cognitoGroups);
    const newSubscription = mapRoleToSubscription(newRole);
    
    if (existingUser.role !== newRole) {
      console.log(`Updating user role: ${existingUser.role} -> ${newRole}`);
      return await updateUserInDatabase(userContext.id, {
        role: newRole,
        subscription: newSubscription,
        last_login_at: new Date(),
      });
    }
    
    // Update last login time only if needed
    const now = new Date();
    let shouldUpdateLastLogin = false;
    
    if (existingUser.last_login_at) {
      const timeSinceLastLogin = now.getTime() - existingUser.last_login_at.getTime();
      const oneHour = 60 * 60 * 1000;
      
      // Only update if it's been more than an hour since last login
      if (timeSinceLastLogin > oneHour) {
        shouldUpdateLastLogin = true;
      }
    } else {
      // First time login, update last_login_at
      shouldUpdateLastLogin = true;
    }
    
    if (shouldUpdateLastLogin) {
      return await updateUserInDatabase(userContext.id, {
        last_login_at: now,
      });
    }
    
    return existingUser;
  } catch (error) {
    console.error('Error syncing user from Cognito:', error);
    throw error;
  }
}

export async function getUserWithSync(userContext: UserContext): Promise<DatabaseUser | null> {
  if (!userContext.isAuthenticated) {
    return null;
  }
  
  try {
    return await syncUserFromCognito(userContext);
  } catch (error) {
    console.error('Error getting user with sync:', error);
    // Fallback to just getting existing user if sync fails
    if (userContext.id) {
      return await getUserFromDatabase(userContext.id);
    }
    return null;
  }
}