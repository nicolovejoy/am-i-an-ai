import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonasPage from '../page';
import { api } from '@/services/apiClient';

// Mock useRoleAccess hook
jest.mock('@/hooks/useRoleAccess', () => ({
  useRoleAccess: () => ({
    isAdmin: jest.fn().mockReturnValue(false), // Default to non-admin user
    hasRole: jest.fn(),
    canAccessAdmin: jest.fn().mockReturnValue(false),
    userRole: 'user'
  })
}));

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: true,
  user: { id: 'test-user', email: 'test@example.com' },
  isLoading: false,
  signOut: jest.fn(),
  checkAuthStatus: jest.fn(),
  error: null
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    personas: {
      list: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock the PersonaList component
jest.mock('@/components/PersonaList', () => ({
  PersonaList: ({ personas, onEdit, onDelete }: { personas: unknown[]; onEdit: (persona: unknown) => void; onDelete: (id: string) => void }) => (
    <div data-testid="persona-list">
      {(personas || []).map((persona: unknown) => {
        const p = persona as { id: string; name: string };
        return (
          <div key={p.id} data-testid="persona-item">
            <span>{p.name}</span>
            <button onClick={() => onEdit(persona)}>Edit</button>
            <button onClick={() => onDelete(p.id)}>Delete</button>
          </div>
        );
      })}
    </div>
  ),
}));

// Mock the PersonaForm components
jest.mock('@/components/PersonaFormUser', () => ({
  PersonaFormUser: ({ onSubmit, onCancel }: { onSubmit: (data: unknown) => void; onCancel: () => void }) => (
    <div data-testid="persona-form-user">
      <button onClick={() => onSubmit({ name: 'Test Persona', type: 'human_persona' })}>
        Submit User Form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock('@/components/PersonaFormAdmin', () => ({
  PersonaFormAdmin: ({ onSubmit, onCancel }: { onSubmit: (data: unknown) => void; onCancel: () => void }) => (
    <div data-testid="persona-form-admin">
      <button onClick={() => onSubmit({ name: 'Test Persona', type: 'ai_agent' })}>
        Submit Admin Form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock the mock data module
const mockGetMockPersonas = jest.fn().mockResolvedValue([
  { id: 'mock-1', name: 'Mock Persona', type: 'ai_agent' }
]);

jest.mock('@/lib/mockData', () => ({
  getMockPersonas: mockGetMockPersonas,
}));

describe('PersonasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location.protocol
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:' },
      writable: true,
    });
  });

  it('renders personas page header', async () => {
    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: [] 
    });

    await act(async () => {
      render(<PersonasPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('personas')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Create and manage conversation personas for richer interactions')).toBeInTheDocument();
    expect(screen.getByText('Create Persona')).toBeInTheDocument();
  });

  it('loads personas using standardized API call', async () => {
    const mockPersonas = [
      { id: '1', name: 'Test Persona 1', type: 'ai_agent' },
      { id: '2', name: 'Test Persona 2', type: 'human_persona' },
    ];

    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: mockPersonas 
    });

    render(<PersonasPage />);

    await waitFor(() => {
      expect(api.personas.list).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('persona-list')).toBeInTheDocument();
      expect(screen.getByText('Test Persona 1')).toBeInTheDocument();
      expect(screen.getByText('Test Persona 2')).toBeInTheDocument();
    });
  });

  it('handles API errors and falls back to mock data', async () => {
    // Mock the dynamic import that happens in the error handler
    const mockImport = jest.fn().mockResolvedValue({
      getMockPersonas: jest.fn().mockResolvedValue([
        { id: 'mock-1', name: 'Mock Persona', type: 'ai_agent' }
      ])
    });
    
    // Mock the dynamic import function
    jest.doMock('@/lib/mockData', () => ({
      getMockPersonas: jest.fn().mockResolvedValue([
        { id: 'mock-1', name: 'Mock Persona', type: 'ai_agent' }
      ])
    }));

    (api.personas.list as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    await act(async () => {
      render(<PersonasPage />);
    });

    await waitFor(
      () => {
        // Check that the error state is rendered with demo mode
        expect(screen.getByText('Demo Mode Active')).toBeInTheDocument();
        expect(screen.getByText('Demo mode: Showing sample personas. Database connection will be restored soon.')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('shows demo mode banner for mock data', async () => {
    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: [{ id: 'mock-1', name: 'Mock Persona', type: 'ai_agent' }] 
    });

    render(<PersonasPage />);

    await waitFor(() => {
      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument();
      expect(screen.getByText('You\'re viewing sample personas. Database connection will be restored soon.')).toBeInTheDocument();
    });
  });

  it('creates persona using standardized API call', async () => {
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.personas.create as jest.Mock).mockResolvedValue({ success: true });

    render(<PersonasPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Create Persona')).toBeInTheDocument();
    });

    // Click create persona button
    fireEvent.click(screen.getByText('Create Persona'));

    await waitFor(() => {
      expect(screen.getByTestId('persona-form-user')).toBeInTheDocument();
    });

    // Submit User Form the form
    fireEvent.click(screen.getByText('Submit User Form'));

    await waitFor(() => {
      expect(api.personas.create).toHaveBeenCalledTimes(1);
      expect(api.personas.create).toHaveBeenCalledWith({
        name: 'Test Persona',
        type: 'human_persona'
      });
      // Form should be hidden after successful creation
      expect(screen.queryByTestId('persona-form-user')).not.toBeInTheDocument();
    });
  });

  it('deletes persona using standardized API call', async () => {
    const mockPersonas = [
      { id: '1', name: 'Test Persona', type: 'ai_agent' },
    ];

    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: mockPersonas 
    });
    (api.personas.delete as jest.Mock).mockResolvedValue({ success: true });

    render(<PersonasPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Persona')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(api.personas.delete).toHaveBeenCalledTimes(1);
      expect(api.personas.delete).toHaveBeenCalledWith('1');
    });
  });

  it('handles create persona errors', async () => {
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });
    (api.personas.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));

    await act(async () => {
      render(<PersonasPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Create Persona')).toBeInTheDocument();
    });

    // Open create form
    fireEvent.click(screen.getByText('Create Persona'));
    
    await waitFor(() => {
      expect(screen.getByTestId('persona-form-user')).toBeInTheDocument();
    });

    // Submit User Form the form
    fireEvent.click(screen.getByText('Submit User Form'));

    await waitFor(() => {
      expect(api.personas.create).toHaveBeenCalledTimes(1);
      // Form should still be visible on error
      expect(screen.getByTestId('persona-form-user')).toBeInTheDocument();
    });
  });

  it('handles delete persona errors', async () => {
    const mockPersonas = [
      { id: '1', name: 'Test Persona', type: 'ai_agent' },
    ];

    (api.personas.list as jest.Mock).mockResolvedValue({ 
      personas: mockPersonas 
    });
    (api.personas.delete as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

    render(<PersonasPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Persona')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(api.personas.delete).toHaveBeenCalledTimes(1);
      // Persona should still be visible on error
      expect(screen.getByText('Test Persona')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.personas.list as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PersonasPage />);

    expect(screen.getByText('Loading personas...')).toBeInTheDocument();
    expect(screen.getByText('This may take a moment while we connect to the database')).toBeInTheDocument();
  });

  it('handles demo mode creation attempt', async () => {
    // Set to file protocol to simulate static export
    Object.defineProperty(window, 'location', {
      value: { protocol: 'file:' },
      writable: true,
    });

    // In file protocol mode, the component should use mock data
    mockGetMockPersonas.mockResolvedValue([
      { id: 'mock-1', name: 'Mock Persona', type: 'ai_agent' }
    ]);

    await act(async () => {
      render(<PersonasPage />);
    });

    // Wait for mock data to load and component to show demo mode
    await waitFor(() => {
      expect(screen.getByText('Demo mode: Showing sample personas. Database connection will be restored soon.')).toBeInTheDocument();
    });

    // Click "Continue with Demo" to proceed
    fireEvent.click(screen.getByText('Continue with Demo'));

    // Wait for the main content to show
    await waitFor(() => {
      expect(screen.getByText('Create Persona')).toBeInTheDocument();
    });

    // Open create form
    fireEvent.click(screen.getByText('Create Persona'));
    
    await waitFor(() => {
      expect(screen.getByTestId('persona-form-user')).toBeInTheDocument();
    });

    // Submit User Form the form
    fireEvent.click(screen.getByText('Submit User Form'));

    await waitFor(() => {
      expect(api.personas.create).not.toHaveBeenCalled();
      // Should show demo mode message
      expect(screen.getByText(/Demo mode: Creating personas is not available/)).toBeInTheDocument();
    });
  });

  it('cancels form creation', async () => {
    (api.personas.list as jest.Mock).mockResolvedValue({ personas: [] });

    await act(async () => {
      render(<PersonasPage />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Create Persona')).toBeInTheDocument();
    });

    // Open create form
    fireEvent.click(screen.getByText('Create Persona'));
    
    await waitFor(() => {
      expect(screen.getByTestId('persona-form-user')).toBeInTheDocument();
    });

    // Cancel the form
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('persona-form-user')).not.toBeInTheDocument();
    });
  });
});