/**
 * Sign-In Navigation Flow Tests
 * 
 * Tests to ensure proper user experience after sign-in, including
 * navigation flow, error handling, and first-time user experience.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { SignInForm } from '../SignInForm';
import { useAuth } from '../../../contexts/AuthContext';
import { useToastContext } from '../../../contexts/ToastContext';
import { cognitoService } from '../../../services/cognito';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/ToastContext');
jest.mock('../../../services/cognito');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToastContext = useToastContext as jest.MockedFunction<typeof useToastContext>;
const mockCognitoService = cognitoService as jest.Mocked<typeof cognitoService>;

describe('SignInForm Navigation Flow', () => {
  const mockPush = jest.fn();
  const mockSuccess = jest.fn();
  const mockError = jest.fn();
  const mockCheckAuth = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      checkAuth: mockCheckAuth,
      signOut: jest.fn(),
    });

    mockUseToastContext.mockReturnValue({
      success: mockSuccess,
      error: mockError,
      info: jest.fn(),
      warning: jest.fn(),
    });

    jest.clearAllMocks();
  });

  describe('✅ IMPROVED: Post Sign-In Navigation', () => {
    it('should redirect to dashboard instead of conversations on successful sign-in', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockResolvedValue(undefined);
      mockCheckAuth.mockResolvedValue(undefined);

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect new users to onboarding flow', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockResolvedValue(undefined);
      mockCheckAuth.mockResolvedValue(undefined);

      // Mock new user detection
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'newuser@example.com', 
          sub: 'new123',
          isFirstLogin: true
        },
        checkAuth: mockCheckAuth,
        signOut: jest.fn(),
      });

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'newuser@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      });
    });

    it('should redirect returning users to conversations', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockResolvedValue(undefined);
      mockCheckAuth.mockResolvedValue(undefined);

      // Mock returning user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { 
          email: 'user@example.com', 
          sub: 'user123',
          isFirstLogin: false,
          lastLoginAt: '2025-06-10T10:00:00Z'
        },
        checkAuth: mockCheckAuth,
        signOut: jest.fn(),
      });

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/conversations');
      });
    });
  });

  describe('🔧 IMPROVED: Error Handling and Recovery', () => {
    it('should provide helpful error messages for common sign-in failures', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Incorrect username or password'
      });

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith(
          'Sign in failed',
          'Incorrect username or password'
        );
      });

      expect(screen.getByText(/incorrect username or password/i)).toBeInTheDocument();
    });

    it('should provide recovery options for account issues', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockRejectedValue({
        code: 'UserNotConfirmedException',
        message: 'User account not confirmed'
      });

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'unconfirmed@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/resend confirmation email/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockRejectedValue(new Error('Network error'));

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });
  });

  describe('🎯 IMPROVED: Loading States and Feedback', () => {
    it('should show appropriate loading state during sign-in', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      
      mockCognitoService.signIn.mockReturnValue(signInPromise);

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

      // Resolve the promise
      resolveSignIn!();
      
      await waitFor(() => {
        expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
      });
    });

    it('should provide success feedback before navigation', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockResolvedValue(undefined);
      mockCheckAuth.mockResolvedValue(undefined);

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(
          'Welcome back!',
          'You have been successfully signed in.'
        );
      });
    });
  });

  describe('📱 IMPROVED: Responsive Design', () => {
    it('should maintain usability on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SignInForm />);

      const form = screen.getByRole('form') || screen.getByTestId('signin-form');
      expect(form).toHaveClass(/max-w-md/); // Should be mobile-appropriate width
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveClass(/w-full/); // Full width on mobile
    });
  });

  describe('♿ IMPROVED: Accessibility', () => {
    it('should provide proper error announcements for screen readers', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Incorrect username or password'
      });

      render(<SignInForm />);

      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(/incorrect username or password/i);
      });
    });

    it('should maintain focus management during form submission', async () => {
      const user = userEvent.setup();
      
      mockCognitoService.signIn.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Incorrect username or password'
      });

      render(<SignInForm />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      await user.type(screen.getByPlaceholderText('your@email.com'), 'user@example.com');
      await user.type(passwordInput, 'wrongpassword');
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        // Focus should return to password field for easy correction
        expect(passwordInput).toHaveFocus();
      });
    });
  });
});