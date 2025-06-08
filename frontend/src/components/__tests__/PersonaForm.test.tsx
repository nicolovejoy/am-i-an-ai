import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PersonaForm } from '../PersonaForm';
import type { Persona } from '@/types/personas';

const mockPersona: Persona = {
  id: 'persona-1',
  name: 'Creative Writer',
  type: 'human_persona',
  ownerId: 'user-1',
  description: 'A passionate writer with expertise in storytelling.',
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
  knowledge: ['arts', 'entertainment'],
  communicationStyle: 'creative',
  isPublic: true,
  allowedInteractions: ['casual_chat', 'storytelling'],
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
  modelConfig: {
    modelProvider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  },
  systemPrompt: 'You are a data scientist expert...'
};

describe('PersonaForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders create form correctly', () => {
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Knowledge Domains *')).toBeInTheDocument();
      expect(screen.getByText('Personality Traits')).toBeInTheDocument();
      expect(screen.getByText('Create Persona')).toBeInTheDocument();
    });

    it('renders edit form with existing persona data', () => {
      render(
        <PersonaForm 
          persona={mockPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByDisplayValue('Creative Writer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A passionate writer with expertise in storytelling.')).toBeInTheDocument();
      expect(screen.getByText('Update Persona')).toBeInTheDocument();
    });

    it('shows AI configuration section for AI personas', async () => {
      render(
        <PersonaForm 
          persona={mockAiPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      // Verify the AI persona data is loaded
      await waitFor(() => {
        expect(screen.getByDisplayValue('Data Scientist AI')).toBeInTheDocument();
      });

      // Check that persona type is set to ai_agent
      await waitFor(() => {
        const typeSelect = screen.getByLabelText('Persona Type *');
        expect(typeSelect).toHaveValue('ai_agent');
      });

      // AI Configuration section should be visible
      await waitFor(() => {
        expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      });

      // Check that Model Provider and Model Name fields exist
      expect(screen.getByText('Model Provider')).toBeInTheDocument();
      expect(screen.getByText('Model Name')).toBeInTheDocument();
    });

    it('hides AI configuration for human personas', () => {
      render(
        <PersonaForm 
          persona={mockPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.queryByText('AI Configuration')).not.toBeInTheDocument();
    });
  });

  describe('Basic Information Fields', () => {
    it('allows editing persona name', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      await user.type(nameInput, 'Test Persona');

      expect(nameInput).toHaveValue('Test Persona');
    });

    it('allows selecting persona type', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const typeSelect = screen.getByLabelText(/persona type/i);
      await user.selectOptions(typeSelect, 'ai_agent');

      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
    });

    it('allows editing description', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const descTextarea = screen.getByLabelText(/description/i);
      await user.type(descTextarea, 'Test description for the persona.');

      expect(descTextarea).toHaveValue('Test description for the persona.');
    });

    it('allows selecting communication style', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const styleSelect = screen.getByLabelText(/communication style/i);
      await user.selectOptions(styleSelect, 'academic');

      expect(styleSelect).toHaveValue('academic');
    });
  });

  describe('Knowledge Domains', () => {
    it('allows selecting multiple knowledge domains', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const technologyCheckbox = screen.getByLabelText('Technology');
      const artsCheckbox = screen.getByLabelText('Arts');

      await user.click(technologyCheckbox);
      await user.click(artsCheckbox);

      expect(technologyCheckbox).toBeChecked();
      expect(artsCheckbox).toBeChecked();
    });

    it('preselects knowledge domains for existing persona', () => {
      render(
        <PersonaForm 
          persona={mockPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByLabelText('Arts')).toBeChecked();
      expect(screen.getByLabelText('Entertainment')).toBeChecked();
      expect(screen.getByLabelText('Technology')).not.toBeChecked();
    });
  });

  describe('Interaction Types', () => {
    it('allows selecting multiple interaction types', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const debateCheckbox = screen.getByLabelText('Debate');
      const interviewCheckbox = screen.getByLabelText('Interview');

      await user.click(debateCheckbox);
      await user.click(interviewCheckbox);

      expect(debateCheckbox).toBeChecked();
      expect(interviewCheckbox).toBeChecked();
    });

    it('preselects interaction types for existing persona', () => {
      render(
        <PersonaForm 
          persona={mockPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByLabelText('Casual Chat')).toBeChecked();
      expect(screen.getByLabelText('Storytelling')).toBeChecked();
      expect(screen.getByLabelText('Debate')).not.toBeChecked();
    });
  });

  describe('Personality Traits', () => {
    it('renders all personality trait sliders', () => {
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Openness to Experience')).toBeInTheDocument();
      expect(screen.getByText('Conscientiousness')).toBeInTheDocument();
      expect(screen.getByText('Extraversion')).toBeInTheDocument();
      expect(screen.getByText('Agreeableness')).toBeInTheDocument();
      expect(screen.getByText('Neuroticism')).toBeInTheDocument();
      expect(screen.getByText('Creativity')).toBeInTheDocument();
      expect(screen.getByText('Assertiveness')).toBeInTheDocument();
      expect(screen.getByText('Empathy')).toBeInTheDocument();
    });

    it('allows adjusting personality trait values', async () => {
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Find the creativity slider by looking for all sliders and getting the 6th one (creativity)
      const allSliders = screen.getAllByDisplayValue('50');
      expect(allSliders).toHaveLength(8); // Verify we have 8 sliders
      
      // Creativity is the 6th slider (index 5) based on the order in the component
      const creativitySlider = allSliders[5];
      
      // For range sliders, we need to use fireEvent.change instead of userEvent
      fireEvent.change(creativitySlider, { target: { value: '85' } });

      expect(creativitySlider).toHaveValue('85');
    });

    it('displays current trait values', () => {
      render(
        <PersonaForm 
          persona={mockPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('85')).toBeInTheDocument(); // Openness
      expect(screen.getByText('95')).toBeInTheDocument(); // Creativity
    });
  });

  describe('AI Configuration', () => {
    it('shows AI configuration when AI type is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const typeSelect = screen.getByLabelText(/persona type/i);
      await user.selectOptions(typeSelect, 'ai_agent');

      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/model provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
    });

    it('allows configuring AI model settings', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm 
          persona={mockAiPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      const modelNameInput = screen.getByLabelText(/model name/i);
      await user.clear(modelNameInput);
      await user.type(modelNameInput, 'gpt-3.5-turbo');

      expect(modelNameInput).toHaveValue('gpt-3.5-turbo');
    });

    it('allows editing system prompt', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm 
          persona={mockAiPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      const systemPromptTextarea = screen.getByLabelText(/system prompt/i);
      await user.clear(systemPromptTextarea);
      await user.type(systemPromptTextarea, 'You are a helpful assistant...');

      expect(systemPromptTextarea).toHaveValue('You are a helpful assistant...');
    });
  });

  describe('Visibility Settings', () => {
    it('allows toggling public visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const publicCheckbox = screen.getByLabelText(/make this persona public/i);
      await user.click(publicCheckbox);

      expect(publicCheckbox).toBeChecked();
    });

    it('preselects public visibility for existing persona', () => {
      render(
        <PersonaForm 
          persona={mockPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      const publicCheckbox = screen.getByLabelText(/make this persona public/i);
      expect(publicCheckbox).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('shows error for empty name', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for short name', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      await user.type(nameInput, 'X');

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });

    it('shows error for empty description', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      await user.type(nameInput, 'Valid Name');

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('shows error for short description', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      const descTextarea = screen.getByLabelText(/description/i);
      
      await user.type(nameInput, 'Valid Name');
      await user.type(descTextarea, 'Short');

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
    });

    it('shows error for no knowledge domains', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      const descTextarea = screen.getByLabelText(/description/i);
      
      await user.type(nameInput, 'Valid Name');
      await user.type(descTextarea, 'Valid description that is long enough');

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('At least one knowledge domain is required')).toBeInTheDocument();
    });

    it('shows error for no interaction types', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      const descTextarea = screen.getByLabelText(/description/i);
      const technologyCheckbox = screen.getByLabelText('Technology');
      
      await user.type(nameInput, 'Valid Name');
      await user.type(descTextarea, 'Valid description that is long enough');
      await user.click(technologyCheckbox);

      // Uncheck the default casual chat
      const casualChatCheckbox = screen.getByLabelText('Casual Chat');
      await user.click(casualChatCheckbox);

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('At least one interaction type is required')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits valid form data', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/persona name/i), 'Test Persona');
      await user.type(screen.getByLabelText(/description/i), 'This is a valid description for testing');
      await user.click(screen.getByLabelText('Technology'));

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Persona',
            description: 'This is a valid description for testing',
            knowledge: ['technology'],
            type: 'human_persona',
            communicationStyle: 'casual',
            isPublic: false,
            allowedInteractions: ['casual_chat']
          })
        );
      });
    });

    it('submits AI persona with model config', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill required fields and select AI type
      await user.type(screen.getByLabelText(/persona name/i), 'AI Persona');
      await user.type(screen.getByLabelText(/description/i), 'This is an AI persona for testing');
      await user.selectOptions(screen.getByLabelText(/persona type/i), 'ai_agent');
      await user.click(screen.getByLabelText('Technology'));

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'AI Persona',
            type: 'ai_agent',
            modelConfig: expect.objectContaining({
              modelProvider: 'openai',
              modelName: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000
            })
          })
        );
      });
    });

    it('disables submit button during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a slow submission
      const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <PersonaForm onSubmit={slowSubmit} onCancel={mockOnCancel} />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/persona name/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Valid description');
      await user.click(screen.getByLabelText('Technology'));

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Actions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('provides proper labels for all form fields', () => {
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/persona name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/persona type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/communication style/i)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByText('Create Persona');
      await user.click(submitButton);

      const nameInput = screen.getByLabelText(/persona name/i);
      expect(nameInput).toHaveClass('border-red-300');
    });

    it('provides clear section headings', () => {
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /personality traits/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /visibility settings/i })).toBeInTheDocument();
    });
  });

  describe('Dynamic Content', () => {
    it('shows AI configuration when switching to AI type', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.queryByText('AI Configuration')).not.toBeInTheDocument();

      const typeSelect = screen.getByLabelText(/persona type/i);
      await user.selectOptions(typeSelect, 'ai_agent');

      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
    });

    it('hides AI configuration when switching to human type', async () => {
      const user = userEvent.setup();
      
      render(
        <PersonaForm 
          persona={mockAiPersona} 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('AI Configuration')).toBeInTheDocument();

      const typeSelect = screen.getByLabelText(/persona type/i);
      await user.selectOptions(typeSelect, 'human_persona');

      expect(screen.queryByText('AI Configuration')).not.toBeInTheDocument();
    });
  });
});