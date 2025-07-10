import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock modules before imports
jest.mock('@/store/sessionStore');
jest.mock('@/contexts/useAuth');
interface LinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
}

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to, className }: LinkProps) => <a href={to} className={className}>{children}</a>
}));

import WelcomeDashboard from '../WelcomeDashboard';

// Setup mocks
const mockUser = { email: 'testuser@example.com', sub: '123' };

// Import mocks
import { useSessionStore } from '@/store/sessionStore';
import type { SessionStore } from '@/store/types';
import { useAuth } from '@/contexts/useAuth';

const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

mockUseSessionStore.mockReturnValue({
  createRealMatch: jest.fn(),
  connectionStatus: 'disconnected',
} as Partial<SessionStore> as SessionStore);

mockUseAuth.mockReturnValue({
  user: mockUser,
  signOut: jest.fn()
} as ReturnType<typeof useAuth>);

describe('WelcomeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders RobotOrchestra header', () => {
    render(<WelcomeDashboard />);
    
    expect(screen.getByRole('heading', { name: /RobotOrchestra/ })).toBeInTheDocument();
    expect(screen.getByText('A social experiment for the AI age')).toBeInTheDocument();
  });

  it('displays Start Match button and name input', () => {
    render(<WelcomeDashboard />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    expect(nameInput).toHaveValue('testuser');
    
    const startButton = screen.getByRole('button', { name: /start match/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).not.toBeDisabled();
  });

  it('creates real match when Start Match is clicked', () => {
    const mockCreateRealMatch = jest.fn();
    mockUseSessionStore.mockReturnValue({
      createRealMatch: mockCreateRealMatch,
      connectionStatus: 'disconnected',
    } as Partial<SessionStore> as SessionStore);
    
    render(<WelcomeDashboard />);
    
    const startButton = screen.getByRole('button', { name: /start match/i });
    fireEvent.click(startButton);
    
    expect(mockCreateRealMatch).toHaveBeenCalledWith('testuser');
  });

  it('shows History and About links', () => {
    render(<WelcomeDashboard />);
    
    const historyLink = screen.getByText('📊 History').closest('a');
    expect(historyLink).toHaveAttribute('href', '/history');
    
    const aboutLink = screen.getByText('ℹ️ About').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('disables button when name input is empty', () => {
    render(<WelcomeDashboard />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const startButton = screen.getByRole('button', { name: /start match/i });
    
    // Clear the name input
    fireEvent.change(nameInput, { target: { value: '' } });
    
    expect(startButton).toBeDisabled();
  });

  it('shows loading state when connecting', () => {
    mockUseSessionStore.mockReturnValue({
      createRealMatch: jest.fn(),
      connectionStatus: 'connecting',
    } as Partial<SessionStore> as SessionStore);
    
    render(<WelcomeDashboard />);
    
    const startButton = screen.getByRole('button', { name: /starting/i });
    expect(startButton).toBeDisabled();
  });

  it('allows changing player name', () => {
    render(<WelcomeDashboard />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    fireEvent.change(nameInput, { target: { value: 'NewPlayer' } });
    
    expect(nameInput).toHaveValue('NewPlayer');
  });

  it('shows game description', () => {
    render(<WelcomeDashboard />);
    
    expect(screen.getByText(/Join an anonymous creative collaboration/i)).toBeInTheDocument();
    expect(screen.getByText(/try to identify who.*s human/i)).toBeInTheDocument();
  });
});