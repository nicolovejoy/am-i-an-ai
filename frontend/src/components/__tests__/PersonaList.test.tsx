import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PersonaList } from '../PersonaList';
import type { Persona } from '@/types/personas';

// Mock PersonaCard component
jest.mock('../PersonaCard', () => {
  return {
    PersonaCard: ({ persona, onEdit, onDelete }: { 
      persona: Persona; 
      onEdit: () => void; 
      onDelete: () => void; 
    }) => (
      <div data-testid={`persona-card-${persona.id}`}>
        <h3>{persona.name}</h3>
        <p>{persona.type}</p>
        <p>{persona.description}</p>
        <button onClick={onEdit}>Edit {persona.name}</button>
        <button onClick={onDelete}>Delete {persona.name}</button>
      </div>
    )
  };
});

const mockPersonas: Persona[] = [
  {
    id: 'persona-1',
    name: 'Creative Writer',
    type: 'human_persona',
    ownerId: 'user-1',
    description: 'A passionate writer with expertise in storytelling.',
    personality: {
      openness: 85, conscientiousness: 70, extraversion: 60,
      agreeableness: 75, neuroticism: 30, creativity: 95,
      assertiveness: 65, empathy: 80
    },
    knowledge: ['arts', 'entertainment'],
    communicationStyle: 'creative',
    isPublic: true,
    allowedInteractions: ['casual_chat', 'storytelling'],
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
    ownerId: 'user-1',
    description: 'An AI specialized in data analysis.',
    personality: {
      openness: 70, conscientiousness: 90, extraversion: 40,
      agreeableness: 60, neuroticism: 20, creativity: 75,
      assertiveness: 80, empathy: 50
    },
    knowledge: ['technology', 'science'],
    communicationStyle: 'analytical',
    isPublic: true,
    allowedInteractions: ['casual_chat', 'interview'],
    conversationCount: 8,
    totalMessages: 156,
    averageRating: 4.7,
    createdAt: new Date('2024-01-10T09:00:00Z'),
    updatedAt: new Date('2024-01-18T16:45:00Z')
  },
  {
    id: 'persona-3',
    name: 'Philosophy Student',
    type: 'human_persona',
    ownerId: 'user-2',
    description: 'Deep thinker interested in philosophical debates.',
    personality: {
      openness: 95, conscientiousness: 65, extraversion: 45,
      agreeableness: 70, neuroticism: 35, creativity: 85,
      assertiveness: 60, empathy: 90
    },
    knowledge: ['philosophy', 'general'],
    communicationStyle: 'academic',
    isPublic: false,
    allowedInteractions: ['debate', 'casual_chat'],
    conversationCount: 22,
    totalMessages: 445,
    averageRating: 4.1,
    createdAt: new Date('2024-01-05T14:20:00Z'),
    updatedAt: new Date('2024-01-22T11:15:00Z')
  }
];

describe('PersonaList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when no personas provided', () => {
      render(
        <PersonaList 
          personas={[]} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('No personas yet')).toBeInTheDocument();
      expect(screen.getByText(/Create your first persona/)).toBeInTheDocument();
    });
  });

  describe('Persona Display', () => {
    it('renders all personas correctly', () => {
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByTestId('persona-card-persona-1')).toBeInTheDocument();
      expect(screen.getByTestId('persona-card-persona-2')).toBeInTheDocument();
      expect(screen.getByTestId('persona-card-persona-3')).toBeInTheDocument();
    });

    it('shows correct persona count', () => {
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Showing 3 of 3 personas')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters personas by name', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search personas/);
      await user.type(searchInput, 'Creative');

      expect(screen.getByTestId('persona-card-persona-1')).toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-3')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 3 personas')).toBeInTheDocument();
    });

    it('filters personas by description', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search personas/);
      await user.type(searchInput, 'data analysis');

      expect(screen.getByTestId('persona-card-persona-2')).toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-1')).not.toBeInTheDocument();
    });

    it('shows no results when search has no matches', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search personas/);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No personas match your filters')).toBeInTheDocument();
      expect(screen.getByText('Showing 0 of 3 personas')).toBeInTheDocument();
    });
  });

  describe('Type Filtering', () => {
    it('filters by persona type', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'ai_agent');

      expect(screen.getByTestId('persona-card-persona-2')).toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-3')).not.toBeInTheDocument();
    });

    it('shows all types when filter is reset', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'ai_agent');
      await user.selectOptions(typeSelect, 'all');

      expect(screen.getAllByTestId(/persona-card-/)).toHaveLength(3);
    });
  });

  describe('Knowledge Domain Filtering', () => {
    it('filters by knowledge domain', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const knowledgeSelect = screen.getByDisplayValue('All Domains');
      await user.selectOptions(knowledgeSelect, 'technology');

      expect(screen.getByTestId('persona-card-persona-2')).toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-1')).not.toBeInTheDocument();
    });
  });

  describe('Communication Style Filtering', () => {
    it('filters by communication style', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const styleSelect = screen.getByDisplayValue('All Styles');
      await user.selectOptions(styleSelect, 'creative');

      expect(screen.getByTestId('persona-card-persona-1')).toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-2')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts by name alphabetically', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const sortSelect = screen.getByDisplayValue('Recently Created');
      await user.selectOptions(sortSelect, 'name');

      const cards = screen.getAllByTestId(/persona-card-/);
      expect(cards[0]).toHaveAttribute('data-testid', 'persona-card-persona-1'); // Creative Writer
      expect(cards[1]).toHaveAttribute('data-testid', 'persona-card-persona-2'); // Data Scientist
      expect(cards[2]).toHaveAttribute('data-testid', 'persona-card-persona-3'); // Philosophy Student
    });

    it('sorts by rating (highest first)', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const sortSelect = screen.getByDisplayValue('Recently Created');
      await user.selectOptions(sortSelect, 'rating');

      const cards = screen.getAllByTestId(/persona-card-/);
      expect(cards[0]).toHaveAttribute('data-testid', 'persona-card-persona-2'); // 4.7 rating
      expect(cards[1]).toHaveAttribute('data-testid', 'persona-card-persona-1'); // 4.3 rating
      expect(cards[2]).toHaveAttribute('data-testid', 'persona-card-persona-3'); // 4.1 rating
    });

    it('sorts by usage (most used first)', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const sortSelect = screen.getByDisplayValue('Recently Created');
      await user.selectOptions(sortSelect, 'usage');

      const cards = screen.getAllByTestId(/persona-card-/);
      expect(cards[0]).toHaveAttribute('data-testid', 'persona-card-persona-3'); // 22 conversations
      expect(cards[1]).toHaveAttribute('data-testid', 'persona-card-persona-1'); // 15 conversations
      expect(cards[2]).toHaveAttribute('data-testid', 'persona-card-persona-2'); // 8 conversations
    });
  });

  describe('Clear Filters', () => {
    it('shows clear filters button when filters are applied', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search personas/);
      await user.type(searchInput, 'test');

      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText(/Search personas/);
      await user.type(searchInput, 'test');

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'ai_agent');

      // Clear filters
      const clearButton = screen.getByText('Clear filters');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
      expect(screen.getAllByTestId(/persona-card-/)).toHaveLength(3);
    });

    it('does not show clear filters button when no filters are applied', () => {
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });
  });

  describe('Combined Filtering', () => {
    it('applies multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search personas/);
      await user.type(searchInput, 'Creative');

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'human_persona');

      expect(screen.getByTestId('persona-card-persona-1')).toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('persona-card-persona-3')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 3 personas')).toBeInTheDocument();
    });
  });

  describe('Action Callbacks', () => {
    it('calls onEdit with correct persona', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByText('Edit Creative Writer');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockPersonas[0]);
    });

    it('calls onDelete with correct persona id', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByText('Delete Creative Writer');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('persona-1');
    });
  });

  describe('Responsive Layout', () => {
    it('renders personas in grid layout', () => {
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const personaCards = screen.getAllByTestId(/persona-card-/);
      expect(personaCards).toHaveLength(3);
      // Check that all personas are rendered in the list
      expect(personaCards[0]).toBeInTheDocument();
      expect(personaCards[1]).toBeInTheDocument();
      expect(personaCards[2]).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible labels for form controls', () => {
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/knowledge domain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/communication style/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('provides accessible search input', () => {
      render(
        <PersonaList 
          personas={mockPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search'));
    });
  });

  describe('Performance', () => {
    it('handles large number of personas efficiently', () => {
      const manyPersonas = Array.from({ length: 100 }, (_, i) => ({
        ...mockPersonas[0],
        id: `persona-${i}`,
        name: `Persona ${i}`
      }));

      render(
        <PersonaList 
          personas={manyPersonas} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Showing 100 of 100 personas')).toBeInTheDocument();
    });
  });
});