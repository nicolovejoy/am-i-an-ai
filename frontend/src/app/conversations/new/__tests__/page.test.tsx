import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import NewConversationPage from '../page';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

// Mock components
jest.mock('@/components/LoadingSpinner', () => ({
  FullPageLoader: ({ text }: { text: string }) => (
    <div data-testid="full-page-loader">{text}</div>
  ),
}));

const mockPush = jest.fn();
const mockAddToast = jest.fn();
const mockUseAuth = useAuth as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseToast = useToast as jest.Mock;

describe('NewConversationPage - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
    
    mockUseToast.mockReturnValue({
      addToast: mockAddToast,
    });
    
    // Default to authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders loading state initially', () => {
      render(<NewConversationPage />);
      expect(screen.getByTestId('full-page-loader')).toBeInTheDocument();
    });

    it('renders main page elements after loading', async () => {
      render(<NewConversationPage />);
      
      // Fast-forward loading timers
      jest.advanceTimersByTime(700);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('full-page-loader')).not.toBeInTheDocument();
      });

      // Check main page elements
      expect(screen.getByRole('heading', { level: 1, name: 'Start New Conversation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start conversation/i })).toBeInTheDocument();
    });

    it('redirects when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<NewConversationPage />);

      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });
  });

  describe('Form Structure', () => {
    beforeEach(async () => {
      render(<NewConversationPage />);
      
      // Fast-forward loading timers
      jest.advanceTimersByTime(700);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('full-page-loader')).not.toBeInTheDocument();
      });
    });

    it('renders all required form fields', () => {
      expect(screen.getByLabelText('Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Main Topic *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Conversation Goals')).toBeInTheDocument();
      expect(screen.getByLabelText('Topic Tags')).toBeInTheDocument();
      expect(screen.getByLabelText('Private Conversation')).toBeInTheDocument();
    });

    it('renders personas for selection', () => {
      expect(screen.getByText('The Philosopher')).toBeInTheDocument();
      expect(screen.getByText('Deep Thinker')).toBeInTheDocument();
      expect(screen.getByText('Creative Writer')).toBeInTheDocument();
      expect(screen.getByText('Story Weaver')).toBeInTheDocument();
      expect(screen.getByText('Tech Enthusiast')).toBeInTheDocument();
    });

    it('renders persona checkboxes', () => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(5); // At least 5 personas + privacy checkbox
    });

    it('has proper navigation elements', () => {
      expect(screen.getByRole('link', { name: /back to conversations/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<NewConversationPage />);
      
      // Fast-forward loading timers
      jest.advanceTimersByTime(700);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('full-page-loader')).not.toBeInTheDocument();
      });
    });

    it('has proper heading hierarchy', () => {
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2s).toHaveLength(3); // Details, Participants, Privacy
    });

    it('has accessible form labels', () => {
      expect(screen.getByLabelText('Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Main Topic *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Conversation Goals')).toBeInTheDocument();
      expect(screen.getByLabelText('Topic Tags')).toBeInTheDocument();
      expect(screen.getByLabelText('Private Conversation')).toBeInTheDocument();
    });

    it('has accessible submit button', () => {
      const submitButton = screen.getByRole('button', { name: /start conversation/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});