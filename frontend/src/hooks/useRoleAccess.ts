/**
 * Role-based access control hook
 * 
 * Provides utilities for checking user roles and permissions
 */

import { useAuth } from "../contexts/AuthContext";
import { isAdmin, isModerator, getUserRole } from "../utils/adminConfig";

export type UserRole = 'user' | 'moderator' | 'admin';

export const useRoleAccess = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    const userRole = getUserRole(user);
    
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  };

  const checkIsAdmin = (): boolean => isAdmin(user);
  const checkIsModerator = (): boolean => isModerator(user);
  const checkIsUser = (): boolean => hasRole('user');

  const canAccessAdmin = (): boolean => checkIsAdmin();
  const canModerate = (): boolean => checkIsModerator() || checkIsAdmin();

  return {
    hasRole,
    isAdmin: checkIsAdmin,
    isModerator: checkIsModerator,
    isUser: checkIsUser,
    canAccessAdmin,
    canModerate,
    userRole: getUserRole(user),
  };
};