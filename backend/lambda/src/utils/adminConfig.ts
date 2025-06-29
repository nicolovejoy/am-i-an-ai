import { UserContext } from '../middleware/cognito-auth';

export interface AdminConfig {
  emails: string[];
  requiredGroups: string[];
  fallbackToEmailList: boolean;
}

export const ADMIN_CONFIG: AdminConfig = {
  emails: process.env.ADMIN_EMAILS?.split(',') || ['nlovejoy@me.com'],
  requiredGroups: ['admin'],
  fallbackToEmailList: true,
};

export interface User {
  id: string;
  email: string;
  role?: 'user' | 'moderator' | 'admin';
}

/**
 * Unified admin check function
 * Checks if user is admin based on:
 * 1. Database role (preferred)
 * 2. Cognito groups
 * 3. Fallback to email whitelist
 */
export function isAdmin(user: UserContext, dbUser?: User): boolean {
  // Check database role first (most authoritative)
  if (dbUser?.role === 'admin') {
    return true;
  }

  // Check Cognito groups
  if (user.cognitoGroups && ADMIN_CONFIG.requiredGroups.some(group => 
    user.cognitoGroups.includes(group)
  )) {
    return true;
  }

  // Fallback to email whitelist
  if (ADMIN_CONFIG.fallbackToEmailList && user.email && 
      ADMIN_CONFIG.emails.includes(user.email)) {
    return true;
  }

  return false;
}

/**
 * Check if user has moderator access
 */
export function isModerator(user: UserContext, dbUser?: User): boolean {
  // Admins are also moderators
  if (isAdmin(user, dbUser)) {
    return true;
  }

  // Check database role
  if (dbUser?.role === 'moderator') {
    return true;
  }

  // Check Cognito groups
  return user.cognitoGroups?.includes('moderator') || false;
}

/**
 * Get user's highest role
 */
export function getUserRole(user: UserContext, dbUser?: User): 'admin' | 'moderator' | 'user' {
  if (isAdmin(user, dbUser)) {
    return 'admin';
  }
  if (isModerator(user, dbUser)) {
    return 'moderator';
  }
  return 'user';
}

/**
 * Log admin access events for audit purposes
 */
export function logAdminAccess(user: UserContext, action: string, resource?: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: user.id,
    email: user.email,
    action,
    resource,
    cognitoGroups: user.cognitoGroups,
    type: 'ADMIN_ACCESS'
  };

  console.log('ADMIN_AUDIT', JSON.stringify(logEntry));
}