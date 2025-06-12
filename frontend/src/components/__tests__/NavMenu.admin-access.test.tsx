/**
 * Navigation Menu Admin Access Tests
 * 
 * Tests to ensure admin navigation links are only visible to administrators
 * and that role-based navigation works correctly.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import NavMenu from '../NavMenu';

// Mock next navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useRoleAccess hook
const mockUseRoleAccess = jest.fn();
jest.mock('../../hooks/useRoleAccess', () => ({
  useRoleAccess: () => mockUseRoleAccess(),
}));

describe('NavMenu Admin Access Control', () => {
  const mockUsePathname = usePathname as jest.Mock;

  const setupMocks = (authConfig: any, roleConfig: any) => {
    mockUseAuth.mockReturnValue(authConfig);
    mockUseRoleAccess.mockReturnValue(roleConfig);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    
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
  });

  describe('🚨 CRITICAL: Admin Link Visibility Control', () => {
    it('should hide admin link from unauthenticated users', () => {
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

      render(<NavMenu />);

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('should hide admin link from regular users', () => {
      setupMocks(
        {
          isAuthenticated: true,
          isLoading: false,
          user: { email: 'user@example.com', sub: 'user123', role: 'user' },
          checkAuth: jest.fn(),
          signOut: jest.fn(),
        },
        {
          canAccessAdmin: () => false,
          hasRole: () => false,
          isAdmin: () => false,
          isModerator: () => false,
          isUser: () => true,
          canModerate: () => false,
          userRole: 'user',
        }
      );

      render(<NavMenu />);

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('should hide admin link from moderators', () => {
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

      render(<NavMenu />);

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('should show admin link only to administrators', () => {
      setupMocks(
        {
          isAuthenticated: true,
          isLoading: false,
          user: { email: 'admin@example.com', sub: 'admin123', role: 'admin' },
          checkAuth: jest.fn(),
          signOut: jest.fn(),
        },
        {
          canAccessAdmin: () => true,
          hasRole: () => true,
          isAdmin: () => true,
          isModerator: () => false,
          isUser: () => false,
          canModerate: () => true,
          userRole: 'admin',
        }
      );

      render(<NavMenu />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin');
    });
  });

  describe('✅ VALID: Standard Navigation for All Roles', () => {
    it('should show standard navigation for regular users', () => {
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

      render(<NavMenu />);

      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Personas')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should show standard navigation for moderators', () => {
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

      render(<NavMenu />);

      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Personas')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should show all navigation including admin for administrators', () => {
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

      render(<NavMenu />);

      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Personas')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  describe('📱 MOBILE: Admin Link Visibility in Mobile Menu', () => {
    it('should hide admin link in mobile menu for regular users', () => {
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

      render(<NavMenu />);

      // Click mobile menu button to open mobile menu
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      mobileMenuButton.click();

      // Check that admin is not in mobile menu
      const mobileMenuLinks = screen.getAllByRole('link');
      const adminLinks = mobileMenuLinks.filter(link => link.textContent?.includes('Admin'));
      expect(adminLinks).toHaveLength(0);
    });

    it('should show admin link in mobile menu for administrators', () => {
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

      render(<NavMenu />);

      // Click mobile menu button to open mobile menu
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      mobileMenuButton.click();

      // Check that admin is in mobile menu
      const adminLinks = screen.getAllByText('Admin');
      expect(adminLinks.length).toBeGreaterThan(0);
    });
  });

  describe('🔐 SECURITY: Role Information Not Exposed', () => {
    it('should not expose user role information in DOM attributes', () => {
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

      render(<NavMenu />);

      // Check that role information is not exposed in data attributes or classes
      const elementsWithRole = screen.queryAllByTestId(/role|admin/i);
      expect(elementsWithRole).toHaveLength(0);
    });

    it('should not expose user information in accessible text when admin link is hidden', () => {
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

      render(<NavMenu />);

      // Check that there are no admin text visible when user doesn't have access
      const adminLinks = screen.queryAllByText(/admin/i);
      expect(adminLinks).toHaveLength(0);
    });
  });
});