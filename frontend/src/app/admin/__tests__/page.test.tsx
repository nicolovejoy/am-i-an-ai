import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../page';
import { api } from '@/services/apiClient';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    admin: {
      health: jest.fn(),
      databaseStatus: jest.fn(),
      seedDatabase: jest.fn(),
      setupDatabase: jest.fn(),
      testAI: jest.fn(),
    },
    personas: {
      list: jest.fn(),
    },
    conversations: {
      list: jest.fn(),
    },
  },
}));

// Mock ProtectedRoute to just render its children
jest.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('renders admin console header', async () => {
    // Setup mock responses
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: { personas: 5, conversations: 3, messages: 10, users: 2 } });
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });

    render(<AdminPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Admin Console')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Database health checks and real-time data visibility')).toBeInTheDocument();
  });

  it('runs health checks on mount using standardized API calls', async () => {
    // Setup mock responses
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ 
      stats: { personas: 5, conversations: 3, messages: 10, users: 2 } 
    });
    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: [{ id: '1', name: 'Test Persona', type: 'ai_agent' }] 
    });
    (api.conversations.list as jest.Mock).mockResolvedValue({ 
      conversations: [{ id: '1', title: 'Test Conversation' }] 
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(api.admin.health).toHaveBeenCalledTimes(1);
      expect(api.admin.databaseStatus).toHaveBeenCalledTimes(1);
      expect(api.personas.list).toHaveBeenCalledTimes(1);
      expect(api.conversations.list).toHaveBeenCalledTimes(1);
    });
  });

  it('handles health check errors gracefully', async () => {
    // Setup mock responses with errors
    (api.admin.health as jest.Mock).mockRejectedValue(new Error('Network error'));
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: null });
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('seeds database using standardized API call', async () => {
    // Setup initial health check mocks
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: {} });
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });
    (api.admin.seedDatabase as jest.Mock).mockResolvedValue({ 
      recordsCreated: { personas: 3, conversations: 2, messages: 5 } 
    });

    render(<AdminPage />);

    // Wait for initial health checks to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset & Seed Database' })).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click the seed database button
    const seedButton = screen.getByRole('button', { name: 'Reset & Seed Database' });
    fireEvent.click(seedButton);

    await waitFor(() => {
      expect(api.admin.seedDatabase).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Database Seeded Successfully!')
      );
    });
  }, 15000);

  it('checks database setup using standardized API call', async () => {
    // Setup initial health check mocks
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: {} });
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });
    (api.admin.setupDatabase as jest.Mock).mockResolvedValue({ 
      message: 'Database is properly configured',
      existingTables: ['personas', 'conversations', 'messages']
    });

    render(<AdminPage />);

    // Wait for initial health checks to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Check Schema' })).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click the check schema button
    const checkButton = screen.getByRole('button', { name: 'Check Schema' });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(api.admin.setupDatabase).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Database Setup Check:')
      );
    });
  }, 15000);

  it('tests AI response using standardized API call', async () => {
    // Setup initial health check mocks with AI persona
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: {} });
    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: [{ 
        id: 'ai-persona-1', 
        name: 'AI Assistant', 
        type: 'ai_agent' 
      }] 
    });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });
    (api.admin.testAI as jest.Mock).mockResolvedValue({ 
      message: { content: 'Hello! This is a test AI response.' }
    });

    render(<AdminPage />);

    // Wait for initial health checks to complete
    await waitFor(() => {
      expect(screen.getByText('Test AI Response')).toBeInTheDocument();
    });

    // Click the test AI button
    const testButton = screen.getByText('Test AI Response');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(api.admin.testAI).toHaveBeenCalledTimes(1);
      expect(api.admin.testAI).toHaveBeenCalledWith({
        conversationId: '770e8400-e29b-41d4-a716-446655440001',
        message: 'Hello, this is an admin test. Please respond briefly.',
        personaId: 'ai-persona-1',
        personaName: 'AI Assistant',
        personaType: 'ai_agent'
      });
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('AI Test Successful!')
      );
    });
  });

  it('handles AI test with no personas available', async () => {
    // Setup health checks with no personas
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: {} });
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });

    render(<AdminPage />);

    // Wait for initial health checks to complete
    await waitFor(() => {
      expect(screen.getByText('Test AI Response')).toBeInTheDocument();
    });

    // Click the test AI button
    const testButton = screen.getByText('Test AI Response');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('No personas available for AI test');
      expect(api.admin.testAI).not.toHaveBeenCalled();
    });
  });

  it('refreshes health checks when refresh button is clicked', async () => {
    // Setup initial health check mocks
    (api.admin.health as jest.Mock).mockResolvedValue({ status: 'healthy' });
    (api.admin.databaseStatus as jest.Mock).mockResolvedValue({ stats: {} });
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.conversations.list as jest.Mock).mockResolvedValue({ conversations: [] });

    render(<AdminPage />);

    // Wait for initial health checks to complete
    await waitFor(() => {
      expect(screen.getByText('Refresh All')).toBeInTheDocument();
    });

    // Clear the mock call counts
    jest.clearAllMocks();

    // Click the refresh button
    const refreshButton = screen.getByText('Refresh All');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(api.admin.health).toHaveBeenCalledTimes(1);
      expect(api.admin.databaseStatus).toHaveBeenCalledTimes(1);
      expect(api.personas.list).toHaveBeenCalledTimes(1);
      expect(api.conversations.list).toHaveBeenCalledTimes(1);
    });
  });
});