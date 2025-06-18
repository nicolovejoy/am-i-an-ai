import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import NewConversationPage from '../page';
import { api } from '@/services/apiClient';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/services/apiClient', () => ({
  api: {
    personas: {
      list: jest.fn(),
    },
    conversations: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/components/LoadingSpinner', () => ({
  FullPageLoader: () => <div data-testid="loading-spinner">Loading...</div>,
}));

describe('NewConversationPage', () => {
  const mockPush = jest.fn();
  const mockAddToast = jest.fn();

  const mockPersonas = [
    {
      id: 'persona-1',
      name: 'AI Assistant',
      type: 'ai_agent',
      description: 'A helpful AI assistant',
      knowledge: ['General Knowledge', 'Problem Solving'],
      personality: {
        creativity: 60,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 20,
      },
      aiConfig: {
        provider: 'openai',
        model: 'gpt-4',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
    {
      id: 'persona-2',
      name: 'Creative Writer',
      type: 'ai_ambiguous',
      description: 'A creative writing AI',
      knowledge: ['Creative Writing', 'Storytelling', 'Poetry'],
      personality: {
        creativity: 90,
        conscientiousness: 60,
        extraversion: 75,
        agreeableness: 70,
        neuroticism: 30,
      },
      aiConfig: {
        provider: 'openai',
        model: 'gpt-4',
        systemPrompt: 'You are a creative writer.',
        temperature: 0.9,
        maxTokens: 2000,
      },
    },
    {
      id: 'persona-3',
      name: 'Human User',
      type: 'human_persona',
      description: 'A human user persona',
      knowledge: ['Human Experience', 'Real World Knowledge'],
      personality: {
        creativity: 70,
        conscientiousness: 70,
        extraversion: 60,
        agreeableness: 75,
        neuroticism: 40,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useToast as jest.Mock).mockReturnValue({
      addToast: mockAddToast,
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect to signin when not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<NewConversationPage />);

      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });

    it('should show loading spinner while checking auth', () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      render(<NewConversationPage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should load personas when authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      (api.personas.list as jest.Mock).mockResolvedValue({
        success: true,
        personas: mockPersonas,
      });

      render(<NewConversationPage />);

      await waitFor(() => {
        expect(api.personas.list).toHaveBeenCalled();
      });
    });
  });

  describe('Conversation Creation with Authentication', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      (api.personas.list as jest.Mock).mockResolvedValue({
        success: true,
        personas: mockPersonas,
      });
    });

    it('should create conversation with authenticated API call', async () => {
      const user = userEvent.setup();
      const mockConversationResponse = {
        success: true,
        conversation: {
          id: 'new-conv-123',
          title: 'Test Conversation',
        },
      };

      (api.conversations.create as jest.Mock).mockResolvedValue(mockConversationResponse);

      render(<NewConversationPage />);

      // Wait for personas to load
      await waitFor(() => {
        expect(screen.getByLabelText(/conversation title/i)).toBeInTheDocument();
      });

      // Fill in form fields
      await user.type(screen.getByLabelText(/conversation title/i), 'Test Conversation');
      await user.type(screen.getByPlaceholderText(/main focus of this conversation/i), 'Testing');
      await user.type(screen.getByLabelText(/description/i), 'A test conversation description');
      await user.type(screen.getByLabelText(/goals/i), 'Test the conversation creation');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /start conversation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.conversations.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Conversation',
            topic: 'Testing',
            description: 'A test conversation description',
            goals: 'Test the conversation creation',
            selectedPersonas: expect.arrayContaining([
              expect.any(String), // Human persona
              expect.any(String), // Selected AI persona
            ]),
            createdBy: 'demo-user',
          })
        );
      });

      expect(mockAddToast).toHaveBeenCalledWith('success', 'Conversation created successfully!');
      expect(mockPush).toHaveBeenCalledWith('/conversations/new-conv-123');
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();

      (api.conversations.create as jest.Mock).mockRejectedValue(
        new Error('Authentication failed')
      );

      render(<NewConversationPage />);

      // Wait for personas to load
      await waitFor(() => {
        expect(screen.getByLabelText(/conversation title/i)).toBeInTheDocument();
      });

      // Fill in minimal required fields
      await user.type(screen.getByLabelText(/conversation title/i), 'Test');
      await user.type(screen.getByPlaceholderText(/main focus of this conversation/i), 'Testing');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /start conversation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          'info',
          'Using demo mode. Redirecting to sample conversation...'
        );
      });

      expect(mockPush).toHaveBeenCalledWith('/conversations/01234567-1111-1111-1111-012345678901');
    });

    it('should handle personas API failure with fallback', async () => {
      (api.personas.list as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch personas')
      );

      render(<NewConversationPage />);

      await waitFor(() => {
        // Should show form with fallback personas
        expect(screen.getByLabelText(/conversation title/i)).toBeInTheDocument();
      });

      // Check that fallback personas are loaded
      const deepThinkerElements = screen.getAllByText(/Deep Thinker/i);
      expect(deepThinkerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      (api.personas.list as jest.Mock).mockResolvedValue({
        success: true,
        personas: mockPersonas,
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();

      render(<NewConversationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/conversation title/i)).toBeInTheDocument();
      });

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create conversation/i });
      await user.click(submitButton);

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Please enter a conversation title');
      expect(api.conversations.create).not.toHaveBeenCalled();
    });

    it('should validate topic field', async () => {
      const user = userEvent.setup();

      render(<NewConversationPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/conversation title/i)).toBeInTheDocument();
      });

      // Fill only title
      await user.type(screen.getByLabelText(/conversation title/i), 'Test');

      const submitButton = screen.getByRole('button', { name: /create conversation/i });
      await user.click(submitButton);

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Please enter a conversation topic');
      expect(api.conversations.create).not.toHaveBeenCalled();
    });
  });

  describe('Persona Selection', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      (api.personas.list as jest.Mock).mockResolvedValue({
        success: true,
        personas: mockPersonas,
      });
    });

    it('should auto-select first AI persona', async () => {
      render(<NewConversationPage />);

      await waitFor(() => {
        const aiPersonaRadio = screen.getByRole('radio', { name: /AI Assistant/i });
        expect(aiPersonaRadio).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should allow changing persona selection', async () => {
      const user = userEvent.setup();

      render(<NewConversationPage />);

      await waitFor(() => {
        expect(screen.getByText('Creative Writer')).toBeInTheDocument();
      });

      const creativeWriterRadio = screen.getByRole('radio', { name: /Creative Writer/i });
      await user.click(creativeWriterRadio);

      expect(creativeWriterRadio).toHaveAttribute('aria-checked', 'true');
    });
  });
});