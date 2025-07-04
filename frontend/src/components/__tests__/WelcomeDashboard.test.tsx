import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock modules before imports
jest.mock('@/store/sessionStore');
jest.mock('@/contexts/AuthContext');

import WelcomeDashboard from '../WelcomeDashboard';

// Setup mocks
const mockStartTestingMode = jest.fn();
const mockUser = { email: 'testuser@example.com', sub: '123' };

// Mock implementations
const { useSessionStore } = require('@/store/sessionStore');
const { useAuth } = require('@/contexts/AuthContext');

useSessionStore.mockReturnValue({
  startTestingMode: mockStartTestingMode,
  connect: jest.fn(),
  connectionStatus: 'disconnected',
  myIdentity: null,
  match: null
});

useAuth.mockReturnValue({
  user: mockUser,
  signOut: jest.fn()
});

describe('WelcomeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome header with user info', () => {
    render(<WelcomeDashboard />);
    
    expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /RobotOrchestra/ })).toBeInTheDocument();
  });

  it('displays Start Test Performance button prominently', () => {
    render(<WelcomeDashboard />);
    
    const startButton = screen.getByRole('button', { name: /start test performance/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).not.toBeDisabled();
  });

  it('starts testing mode when Start Test Performance is clicked', () => {
    render(<WelcomeDashboard />);
    
    const startButton = screen.getByRole('button', { name: /start test performance/i });
    fireEvent.click(startButton);
    
    expect(mockStartTestingMode).toHaveBeenCalledTimes(1);
  });

  it('shows available performances section with mock data', () => {
    render(<WelcomeDashboard />);
    
    expect(screen.getByText(/available performances/i)).toBeInTheDocument();
    expect(screen.getByText(/ensemble #1/i)).toBeInTheDocument();
    expect(screen.getByText(/ensemble #2/i)).toBeInTheDocument();
  });

  it('displays not implemented badges on performance browser items', () => {
    render(<WelcomeDashboard />);
    
    const badges = screen.getAllByText(/not implemented/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('shows recent performance history section with placeholder data', () => {
    render(<WelcomeDashboard />);
    
    expect(screen.getByText(/recent performances/i)).toBeInTheDocument();
    expect(screen.getByText(/last performance/i)).toBeInTheDocument();
  });

  it('displays About link', () => {
    render(<WelcomeDashboard />);
    
    const aboutLink = screen.getByText(/about robotorchestra/i);
    expect(aboutLink).toBeInTheDocument();
  });

  it('shows performance description and instructions', () => {
    render(<WelcomeDashboard />);
    
    expect(screen.getByText(/join the ensemble and discover who's human/i)).toBeInTheDocument();
  });
});