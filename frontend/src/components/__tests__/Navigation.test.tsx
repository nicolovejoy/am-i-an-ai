import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { useAuth } from '@/contexts/useAuth';
import { useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';

// Mock the dependencies
jest.mock('@/contexts/AuthContext');
interface LinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
}

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, className }: LinkProps) => <a href={to} className={className}>{children}</a>,
  useLocation: jest.fn()
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

describe('Navigation', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/' } as Location);
  });

  it('should render nothing when no user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: jest.fn(),
    } as ReturnType<typeof useAuth>);

    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('should render navigation with exactly one sign out button when user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(<Navigation />);
    
    // Check that sign out button exists
    const signOutButtons = screen.getAllByText('Sign Out');
    expect(signOutButtons).toHaveLength(1);
  });

  it('should display the correct project name', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(<Navigation />);
    
    // Check for Robot Orchestra, not am I an AI
    expect(screen.getByText('Robot Orchestra')).toBeInTheDocument();
    expect(screen.queryByText('am I an AI?')).not.toBeInTheDocument();
  });

  it('should show all navigation links', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(<Navigation />);
    
    expect(screen.getByText('🏠 Dashboard')).toBeInTheDocument();
    expect(screen.getByText('📖 About')).toBeInTheDocument();
    expect(screen.getByText('📊 Match History')).toBeInTheDocument();
  });

  it('should highlight the current page', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as ReturnType<typeof useAuth>);
    
    mockUseLocation.mockReturnValue({ pathname: '/about' } as Location);

    render(<Navigation />);
    
    const aboutLink = screen.getByText('📖 About').closest('a');
    expect(aboutLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });
});