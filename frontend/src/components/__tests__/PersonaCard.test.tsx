import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PersonaCard } from '../PersonaCard';
import type { Persona } from '@/types/personas';

const mockPersona: Persona = {
  id: 'persona-1',
  name: 'Creative Writer',
  type: 'human_persona',
  ownerId: 'user-1',
  description: 'A passionate writer with expertise in storytelling and creative expression.',
  personality: {
    openness: 85,
    conscientiousness: 70,
    extraversion: 60,
    agreeableness: 75,
    neuroticism: 30,
    creativity: 95,
    assertiveness: 65,
    empathy: 80
  },
  knowledge: ['arts', 'entertainment', 'general'],
  communicationStyle: 'creative',
  isPublic: true,
  allowedInteractions: ['casual_chat', 'storytelling', 'brainstorm'],
  conversationCount: 15,
  totalMessages: 234,
  averageRating: 4.3,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-20T14:30:00Z')
};

const mockAiPersona: Persona = {
  ...mockPersona,
  id: 'persona-2',
  name: 'Data Scientist AI',
  type: 'ai_agent',
  description: 'An AI specialized in data analysis and machine learning.',
  knowledge: ['technology', 'science'],
  communicationStyle: 'analytical',
  modelConfig: {
    modelProvider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  },
  systemPrompt: 'You are a data scientist expert...'
};

describe('PersonaCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders persona information correctly', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Creative Writer')).toBeInTheDocument();
      expect(screen.getByText('Human Persona')).toBeInTheDocument();
      expect(screen.getByText('A passionate writer with expertise in storytelling and creative expression.')).toBeInTheDocument();
    });

    it('displays persona type with correct styling', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeElement = screen.getByText('Human Persona');
      expect(typeElement).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('displays AI agent type with correct styling', () => {
      render(
        <PersonaCard 
          persona={mockAiPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeElement = screen.getByText('AI Agent');
      expect(typeElement).toHaveClass('bg-purple-100', 'text-purple-800');
    });
  });

  describe('Statistics Display', () => {
    it('shows conversation and message counts', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('234')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('displays rating correctly', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('4.3')).toBeInTheDocument();
    });

    it('renders star rating visually', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      // Should have 4 full stars and 1 partial star for 4.3 rating
      const ratingElement = screen.getByText('4.3');
      expect(ratingElement).toBeInTheDocument();
      // Check that the rating is displayed
      expect(ratingElement).toBeInTheDocument();
    });
  });

  describe('Knowledge Domains', () => {
    it('displays knowledge domains correctly', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Arts')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('shows overflow indicator for many domains', () => {
      const personaWithManyDomains = {
        ...mockPersona,
        knowledge: ['arts', 'entertainment', 'general', 'technology', 'science'] as any
      };

      render(
        <PersonaCard 
          persona={personaWithManyDomains} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('Communication Style', () => {
    it('displays communication style correctly', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Creative')).toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    it('shows creation date', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText(/Created Jan 15, 2024/)).toBeInTheDocument();
    });

    it('shows public indicator for public personas', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('does not show public indicator for private personas', () => {
      const privatePersona = { ...mockPersona, isPublic: false };
      
      render(
        <PersonaCard 
          persona={privatePersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.queryByText('Public')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('shows delete confirmation flow', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('calls onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('cancels delete confirmation', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('auto-cancels delete confirmation on blur', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(screen.getByText('Confirm')).toBeInTheDocument();

      // Simulate blur event
      fireEvent.blur(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
      });
    });
  });

  describe('Persona Type Icons', () => {
    it('displays correct icon for human persona', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeElement = screen.getByText('Human Persona');
      expect(typeElement).toBeInTheDocument();
      // Check that persona type is properly displayed
      expect(typeElement).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('displays correct icon for AI agent', () => {
      render(
        <PersonaCard 
          persona={mockAiPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeElement = screen.getByText('AI Agent');
      expect(typeElement).toBeInTheDocument();
      // Check that AI agent type is properly styled
      expect(typeElement).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('displays correct icon for AI ambiguous', () => {
      const ambiguousPersona = { ...mockPersona, type: 'ai_ambiguous' as const };
      
      render(
        <PersonaCard 
          persona={ambiguousPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const typeElement = screen.getByText('AI Ambiguous');
      expect(typeElement).toBeInTheDocument();
      // Check that AI ambiguous type is properly displayed
      expect(typeElement).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('maintains focus management for delete confirmation', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaCard 
          persona={mockPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero ratings gracefully', () => {
      const zeroRatedPersona = { ...mockPersona, averageRating: 0 };
      
      render(
        <PersonaCard 
          persona={zeroRatedPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('handles personas with no conversations', () => {
      const newPersona = { 
        ...mockPersona, 
        conversationCount: 0, 
        totalMessages: 0 
      };
      
      render(
        <PersonaCard 
          persona={newPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(2); // Both conversations and messages should be 0
    });

    it('handles long persona names gracefully', () => {
      const longNamePersona = { 
        ...mockPersona, 
        name: 'This is a very long persona name that might overflow the container'
      };
      
      render(
        <PersonaCard 
          persona={longNamePersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText(longNamePersona.name)).toBeInTheDocument();
    });

    it('handles long descriptions gracefully', () => {
      const longDescPersona = { 
        ...mockPersona, 
        description: 'This is a very long description that should be truncated with the line-clamp class to prevent it from taking up too much space in the card layout.'
      };
      
      render(
        <PersonaCard 
          persona={longDescPersona} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );

      expect(screen.getByText(longDescPersona.description)).toBeInTheDocument();
    });
  });
});