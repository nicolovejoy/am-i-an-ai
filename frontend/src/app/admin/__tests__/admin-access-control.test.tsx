/**
 * Admin Console Access Control Tests
 * 
 * Critical security tests to ensure only administrators can access admin console
 * and that appropriate UI elements are shown/hidden based on user role.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminPage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ProtectedRoute
jest.mock('../../../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) => {
    const { isAuthenticated, user } = mockUseAuth();
    if (!isAuthenticated) return <div>Sign In Required</div>;
    if (requireAdmin && user?.role !== 'admin') return <div>Access Denied</div>;
    return <div>{children}</div>;
  },
}));

describe('Admin Console Access Control', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

    // Mock fetch globally for admin API calls
    global.fetch = jest.fn();
    
    jest.clearAllMocks();
  });

  const renderAdminPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdminPage />
      </QueryClientProvider>
    );
  };

  describe('🚨 CRITICAL: Unauthenticated Access Prevention', () => {
    it('should show sign-in required message for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        checkAuth: jest.fn(),
        signOut: jest.fn(),
      });

      renderAdminPage();

      expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
    });
  });

  describe('🚨 CRITICAL: Non-Admin User Access Prevention', () => {
    it('should show access denied message for regular users', () => {
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

      renderAdminPage();

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it('should show access denied message for moderators', () => {
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

      renderAdminPage();

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
  });

  describe('✅ VALID: Administrator Access', () => {
    it('should allow administrators to access admin console', () => {
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

      renderAdminPage();

      // Should render the actual admin content, not access denied
      expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();
    });
  });

});