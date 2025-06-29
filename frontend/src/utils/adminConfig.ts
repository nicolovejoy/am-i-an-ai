import { AuthUser } from '../types/auth';

declare const process: {
  env: {
    NEXT_PUBLIC_ADMIN_EMAILS?: string;
  };
};

export interface AdminConfig {
  emails: string[];
  fallbackToEmailList: boolean;
}

export const ADMIN_CONFIG: AdminConfig = {
  emails: process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || ['nlovejoy@me.com'],
  fallbackToEmailList: true,
};

/**
 * Check if user is admin
 * Note: This is a client-side check only for UI purposes.
 * Server-side authorization is the source of truth.
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }

  // Check if user has admin role (from server)
  if (user.role === 'admin') {
    return true;
  }

  // Fallback to email whitelist for backwards compatibility
  if (ADMIN_CONFIG.fallbackToEmailList && user.email && 
      ADMIN_CONFIG.emails.includes(user.email)) {
    return true;
  }

  return false;
}

/**
 * Check if user has moderator access
 */
export function isModerator(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }

  // Admins are also moderators
  if (isAdmin(user)) {
    return true;
  }

  // Check moderator role
  return user.role === 'moderator';
}

/**
 * Get user's role for display purposes
 */
export function getUserRole(user: AuthUser | null): 'admin' | 'moderator' | 'user' {
  if (!user) {
    return 'user';
  }

  if (isAdmin(user)) {
    return 'admin';
  }
  
  if (isModerator(user)) {
    return 'moderator';
  }

  return 'user';
}