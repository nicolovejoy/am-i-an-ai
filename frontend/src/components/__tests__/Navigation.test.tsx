import { render, screen } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

// Mock the dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('next/navigation');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('should render nothing when no user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: jest.fn(),
    } as any);

    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('should render navigation with exactly one sign out button when user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as any);

    render(<Navigation />);
    
    // Check that sign out button exists
    const signOutButtons = screen.getAllByText('Sign Out');
    expect(signOutButtons).toHaveLength(1);
  });

  it('should display the correct project name', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as any);

    render(<Navigation />);
    
    // Check for Robot Orchestra, not am I an AI
    expect(screen.getByText('Robot Orchestra')).toBeInTheDocument();
    expect(screen.queryByText('am I an AI?')).not.toBeInTheDocument();
  });

  it('should show all navigation links', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as any);

    render(<Navigation />);
    
    expect(screen.getByText('🏠 Dashboard')).toBeInTheDocument();
    expect(screen.getByText('📖 About')).toBeInTheDocument();
    expect(screen.getByText('📊 Match History')).toBeInTheDocument();
  });

  it('should highlight the current page', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    } as any);
    
    mockUsePathname.mockReturnValue('/about');

    render(<Navigation />);
    
    const aboutLink = screen.getByText('📖 About').closest('a');
    expect(aboutLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });
});