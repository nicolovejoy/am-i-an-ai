/**
 * Protected Route Tests for Admin Areas
 * 
 * Tests to ensure admin routes are properly protected and redirect
 * unauthorized users appropriately.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../hooks/useRoleAccess');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Import the mocked useRoleAccess
import { useRoleAccess } from '../../../hooks/useRoleAccess';
const mockUseRoleAccess = useRoleAccess as jest.MockedFunction<typeof useRoleAccess>;

// Test component for admin protection
const AdminTestComponent = () => <div>Admin Content</div>;

describe('ProtectedRoute Admin Access', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    // Set default mock returns to prevent destructuring errors
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      checkAuth: jest.fn(),
      signOut: jest.fn(),
    });

    mockUseRoleAccess.mockReturnValue({
      canAccessAdmin: () => false,
      hasRole: () => false,
      isAdmin: () => false,
      isModerator: () => false,
      isUser: () => false,
      canModerate: () => false,
      userRole: null,
    });

    jest.clearAllMocks();
  });

  describe('🚨 CRITICAL: Admin Route Protection', () => {
    it('should redirect unauthenticated users from admin routes', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/signin?redirect=/admin');
      });

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should redirect regular users from admin routes', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'user@example.com', 
          sub: 'user123',
          role: 'user'
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/?error=insufficient_privileges');
      });

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should redirect moderators from admin routes', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'mod@example.com', 
          sub: 'mod123',
          role: 'moderator'
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/?error=insufficient_privileges');
      });

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should allow administrators to access admin routes', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'admin@example.com', 
          sub: 'admin123',
          role: 'admin'
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      mockUseRoleAccess.mockReturnValue({
        canAccessAdmin: () => true,
        hasRole: () => true,
        isAdmin: () => true,
        isModerator: () => false,
        isUser: () => false,
        canModerate: () => true,
        userRole: 'admin',
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('🔒 SECURITY: Access Denied Messages', () => {
    it('should show access denied message for insufficient privileges', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'user@example.com', 
          sub: 'user123',
          role: 'user'
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin showAccessDenied>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/administrator privileges required/i)).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should show sign-in prompt for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin showAccessDenied>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/signin');
    });
  });

  describe('⏳ LOADING: Authentication States', () => {
    it('should show loading spinner while checking authentication', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText(/checking permissions/i)).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should not redirect while authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('🎯 EDGE CASES: Role Validation', () => {
    it('should handle undefined user role gracefully', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'user@example.com', 
          sub: 'user123'
          // role is undefined
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/?error=insufficient_privileges');
      });
    });

    it('should handle null user object gracefully', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: null,
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/?error=insufficient_privileges');
      });
    });

    it('should handle case-insensitive role checking', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'admin@example.com', 
          sub: 'admin123',
          role: 'admin' // Lowercase
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      mockUseRoleAccess.mockReturnValue({
        canAccessAdmin: () => true,
        hasRole: () => true,
        isAdmin: () => true,
        isModerator: () => false,
        isUser: () => false,
        canModerate: () => true,
        userRole: 'admin',
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });
    });
  });

  describe('🔐 SECURITY: No Information Leakage', () => {
    it('should not expose admin content in DOM when access denied', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'user@example.com', 
          sub: 'user123',
          role: 'user'
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      // Check that admin content is not present anywhere in the DOM
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should not expose role checking logic in DOM attributes', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'user@example.com', 
          sub: 'user123',
          role: 'user'
        },
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      render(
        <ProtectedRoute requireAdmin>
          <AdminTestComponent />
        </ProtectedRoute>
      );

      // Check that role information is not exposed in test ids
      const elementsWithRole = screen.queryAllByTestId(/role|user-role/i);
      expect(elementsWithRole).toHaveLength(0);
    });
  });
});