/**
 * Role-based access control hook
 * 
 * Provides utilities for checking user roles and permissions
 */

import { useAuth } from "../contexts/AuthContext";

export type UserRole = 'user' | 'moderator' | 'admin';

export const useRoleAccess = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user?.role) {
      return false;
    }

    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[user.role.toLowerCase() as UserRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isModerator = (): boolean => hasRole('moderator');
  const isUser = (): boolean => hasRole('user');

  const canAccessAdmin = (): boolean => isAdmin();
  const canModerate = (): boolean => isModerator() || isAdmin();

  return {
    hasRole,
    isAdmin,
    isModerator,
    isUser,
    canAccessAdmin,
    canModerate,
    userRole: user?.role || null,
  };
};