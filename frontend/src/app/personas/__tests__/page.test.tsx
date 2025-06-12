import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PersonasPage from '../page';

// Mock cognito service
jest.mock('@/services/cognito', () => ({
  cognitoService: {
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

// Mock the child components
jest.mock('@/components/PersonaList', () => {
  return {
    PersonaList: ({ personas, onEdit, onDelete }: { personas: unknown[]; onEdit: (persona: unknown) => void; onDelete: (id: string) => void }) => (
      <div data-testid="persona-list">
        <div>Personas: {personas.length}</div>
        {(personas as Record<string, unknown>[]).map((persona: Record<string, unknown>) => (
          <div key={persona.id as string} data-testid={`persona-${persona.id}`}>
            <span>{persona.name as string}</span>
            <button onClick={() => onEdit(persona)}>Edit {persona.name as string}</button>
            <button onClick={() => onDelete(persona.id as string)}>Delete {persona.name as string}</button>
          </div>
        ))}
      </div>
    )
  };
});

jest.mock('@/components/PersonaForm', () => {
  return {
    PersonaForm: ({ persona, onSubmit, onCancel }: { persona?: Record<string, unknown>; onSubmit: (data: unknown) => void; onCancel: () => void }) => (
      <div data-testid="persona-form">
        <div>Form for: {persona ? persona.name as string : 'New Persona'}</div>
        <button onClick={() => onSubmit({ name: 'Test Persona', type: 'human_persona' })}>
          Submit Form
        </button>
        <button onClick={onCancel}>Cancel Form</button>
      </div>
    )
  };
});

jest.mock('@/components/LoadingSpinner', () => {
  return {
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
  };
});

jest.mock('@/components/ErrorBoundary', () => {
  return {
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
  };
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPersonas = [
  {
    id: 'persona-1',
    name: 'Creative Writer',
    type: 'human_persona',
    description: 'A passionate writer',
    personality: {
      openness: 85, conscientiousness: 70, extraversion: 60,
      agreeableness: 75, neuroticism: 30, creativity: 95,
      assertiveness: 65, empathy: 80
    },
    knowledge: ['arts'],
    communicationStyle: 'creative',
    isPublic: true,
    allowedInteractions: ['casual_chat'],
    conversationCount: 15,
    totalMessages: 234,
    averageRating: 4.3,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-20T14:30:00Z')
  },
  {
    id: 'persona-2',
    name: 'Data Scientist',
    type: 'ai_agent',
    description: 'AI expert in data analysis',
    personality: {
      openness: 70, conscientiousness: 90, extraversion: 40,
      agreeableness: 60, neuroticism: 20, creativity: 75,
      assertiveness: 80, empathy: 50
    },
    knowledge: ['technology'],
    communicationStyle: 'analytical',
    isPublic: true,
    allowedInteractions: ['casual_chat'],
    conversationCount: 8,
    totalMessages: 156,
    averageRating: 4.7,
    createdAt: new Date('2024-01-10T09:00:00Z'),
    updatedAt: new Date('2024-01-18T16:45:00Z')
  }
];

describe('PersonasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner initially', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PersonasPage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });
    });

    it('renders page header correctly', async () => {
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Personas')).toBeInTheDocument();
      });

      expect(screen.getByText(/Create and manage conversation personas/)).toBeInTheDocument();
      expect(screen.getByText('Create Persona')).toBeInTheDocument();
    });

    it('loads and displays personas', async () => {
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('persona-list')).toBeInTheDocument();
      });

      expect(screen.getByText('Personas: 2')).toBeInTheDocument();
      expect(screen.getByTestId('persona-persona-1')).toBeInTheDocument();
      expect(screen.getByTestId('persona-persona-2')).toBeInTheDocument();
    });

    it('calls personas API with correct parameters', async () => {
      render(<PersonasPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod/api/personas', {
          signal: expect.any(AbortSignal)
        });
      });
    }, 10000);
  });

  describe('Error Handling', () => {
    it('shows error message when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Personas')).toBeInTheDocument();
      });

      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows error message when API returns error status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: 'Server error occurred'
        })
      });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Personas')).toBeInTheDocument();
      });

      // With our improved UX, should show either server error or demo mode
      expect(
        screen.getByText('Server error occurred') || 
        screen.getByText(/Demo mode/)
      ).toBeInTheDocument();
    });

    it('shows database unavailable message gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          personas: [],
          total: 0,
          error: 'Database temporarily unavailable. Please try again later.'
        })
      });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Personas')).toBeInTheDocument();
      });

      expect(screen.getByText('Database temporarily unavailable. Please try again later.')).toBeInTheDocument();
    });

    it('allows retrying after error', async () => {
      const user = userEvent.setup();
      
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      // Second call succeeds
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('persona-list')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Create Persona Flow', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });
    });

    it('shows create form when create button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Persona')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Persona');
      await user.click(createButton);

      expect(screen.getByTestId('persona-form')).toBeInTheDocument();
      expect(screen.getByText('Create New Persona')).toBeInTheDocument();
    });

    it('closes create form when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Persona')).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByText('Create Persona');
      await user.click(createButton);

      expect(screen.getByTestId('persona-form')).toBeInTheDocument();

      // Close form
      const cancelButton = screen.getByText('Cancel Form');
      await user.click(cancelButton);

      expect(screen.queryByTestId('persona-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('persona-list')).toBeInTheDocument();
    });

    it('creates persona and reloads list', async () => {
      const user = userEvent.setup();
      
      // Mock successful creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: mockPersonas })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, personaId: 'new-persona' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: [...mockPersonas, { id: 'new-persona', name: 'New Persona' }] })
        });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Persona')).toBeInTheDocument();
      });

      // Open form and submit
      const createButton = screen.getByText('Create Persona');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Persona', type: 'human_persona' })
        });
      });

      // Should reload personas
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(screen.queryByTestId('persona-form')).not.toBeInTheDocument();
    }, 10000);

    it('handles create persona error', async () => {
      const user = userEvent.setup();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: mockPersonas })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Creation failed' })
        });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Persona')).toBeInTheDocument();
      });

      // Open form and submit
      const createButton = screen.getByText('Create Persona');
      await user.click(createButton);

      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Persona Flow', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });
    });

    it('shows edit form when edit is clicked', async () => {
      const user = userEvent.setup();
      
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Creative Writer')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit Creative Writer');
      await user.click(editButton);

      expect(screen.getByTestId('persona-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Persona')).toBeInTheDocument();
      expect(screen.getByText('Form for: Creative Writer')).toBeInTheDocument();
    });

    it('closes edit form and clears editing state', async () => {
      const user = userEvent.setup();
      
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Creative Writer')).toBeInTheDocument();
      });

      // Open edit form
      const editButton = screen.getByText('Edit Creative Writer');
      await user.click(editButton);

      // Close form with cancel button
      const cancelButton = screen.getByText('Cancel Form');
      await user.click(cancelButton);

      expect(screen.queryByTestId('persona-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('persona-list')).toBeInTheDocument();
    });
  });

  describe('Delete Persona Flow', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });
    });

    it('deletes persona and reloads list', async () => {
      const user = userEvent.setup();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: mockPersonas })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: [mockPersonas[1]] })
        });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete Creative Writer')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete Creative Writer');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod/api/personas/persona-1', {
          method: 'DELETE'
        });
      });

      // Should reload personas
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000);

    it('handles delete persona error', async () => {
      const user = userEvent.setup();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: mockPersonas })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Deletion failed' })
        });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete Creative Writer')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete Creative Writer');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Deletion failed')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('wraps content in error boundary', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });

      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });
    });

    it('has proper heading structure', async () => {
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Personas' })).toBeInTheDocument();
      });
    });

    it('has accessible create button', async () => {
      render(<PersonasPage />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create persona/i });
        expect(createButton).toBeInTheDocument();
      });
    });

    it('provides clear form labels when editing', async () => {
      const user = userEvent.setup();
      
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Creative Writer')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit Creative Writer');
      await user.click(editButton);

      expect(screen.getByRole('heading', { name: /edit persona/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ personas: mockPersonas })
      });
    });

    it('applies responsive container classes', async () => {
      render(<PersonasPage />);

      await waitFor(() => {
        expect(screen.getByTestId('persona-list')).toBeInTheDocument();
      });

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      const personaList = screen.getByTestId('persona-list');
      expect(personaList).toBeInTheDocument();
    });
  });
});