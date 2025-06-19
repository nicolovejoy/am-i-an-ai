import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationView } from '../ConversationView';
import { api } from '@/services/apiClient';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    conversations: {
      get: jest.fn(),
      close: jest.fn(),
    },
    personas: {
      get: jest.fn(),
    },
    messages: {
      list: jest.fn(),
      create: jest.fn(),
    },
    ai: {
      generateResponse: jest.fn(),
    },
  },
}));

// Mock the MessageList component
jest.mock('../MessageList', () => ({
  MessageList: ({ messages, typingPersonas }: { messages: unknown[]; participants: unknown[]; typingPersonas: Set<string> }) => (
    <div data-testid="message-list">
      <div data-testid="message-count">{messages.length}</div>
      {typingPersonas.size > 0 && <div data-testid="typing-indicator">Someone is typing...</div>}
    </div>
  ),
}));

// Mock the MessageInput component
jest.mock('../MessageInput', () => ({
  MessageInput: ({ onSendMessage, conversationStatus, disabled }: { onSendMessage: (message: string) => void; conversationStatus: string; disabled?: boolean }) => (
    <div data-testid="message-input">
      <button 
        data-testid="send-button"
        onClick={() => onSendMessage('Test message')}
        disabled={disabled || conversationStatus !== 'active'}
      >
        Send Message
      </button>
      <span data-testid="input-status">
        Status: {conversationStatus}, Disabled: {disabled ? 'true' : 'false'}
      </span>
    </div>
  ),
}));

// Mock the CloseConversationModal component
jest.mock('../CloseConversationModal', () => ({
  CloseConversationModal: ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isLoading 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: (reason: string, status: 'completed' | 'terminated') => void; 
    isLoading: boolean;
    conversationTitle: string;
  }) => (
    isOpen ? (
      <div data-testid="close-conversation-modal">
        <button data-testid="modal-close" onClick={onClose}>Cancel</button>
        <button 
          data-testid="modal-confirm-completed" 
          onClick={() => onConfirm('Test reason', 'completed')}
          disabled={isLoading}
        >
          Close as Completed
        </button>
        <button 
          data-testid="modal-confirm-terminated" 
          onClick={() => onConfirm('Test reason', 'terminated')}
          disabled={isLoading}
        >
          Close as Terminated
        </button>
        {isLoading && <div data-testid="modal-loading">Loading...</div>}
      </div>
    ) : null
  ),
}));

// Mock AI orchestrator
jest.mock('@/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    analyzeResponseTriggers: jest.fn().mockResolvedValue([]),
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockActiveConversation = {
  id: 'conv-1',
  title: 'Active Conversation',
  topic: 'Testing',
  description: 'An active conversation',
  status: 'active',
  canAddMessages: true,
  participants: [
    {
      personaId: 'persona-1',
      personaName: 'Human User',
      personaType: 'human',
      isRevealed: true,
      role: 'initiator',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    },
  ],
  messageCount: 2,
  currentTurn: 2,
  createdAt: new Date(),
  topicTags: ['testing'],
  totalCharacters: 100,
  averageResponseTime: 2000,
  createdBy: 'user-1',
};

const mockClosedConversation = {
  ...mockActiveConversation,
  status: 'completed',
  canAddMessages: false,
  closeReason: 'Conversation completed naturally',
  closedBy: 'user-1',
  closedAt: new Date('2024-01-15T15:30:00Z'),
};

describe('ConversationView - State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows close conversation button for active conversations', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockActiveConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Close Conversation')).toBeInTheDocument();
    });
  });

  it('does not show close conversation button for closed conversations', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockClosedConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close Conversation')).not.toBeInTheDocument();
  });

  it('displays conversation closed state information', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockClosedConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Conversation Closed')).toBeInTheDocument();
      expect(screen.getByText('Reason: Conversation completed naturally')).toBeInTheDocument();
      expect(screen.getByText(/Closed on: 1\/15\/2024/)).toBeInTheDocument();
    });
  });

  it('disables message input for closed conversations', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockClosedConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('input-status')).toHaveTextContent('Disabled: true');
      expect(screen.getByTestId('send-button')).toBeDisabled();
    });
  });

  it('enables message input for active conversations', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockActiveConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('input-status')).toHaveTextContent('Disabled: false');
      expect(screen.getByTestId('send-button')).not.toBeDisabled();
    });
  });

  it('opens close conversation modal when close button is clicked', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockActiveConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    render(<ConversationView conversationId="conv-1" />);

    await waitFor(() => {
      expect(screen.getByText('Close Conversation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Conversation'));

    await waitFor(() => {
      expect(screen.getByTestId('close-conversation-modal')).toBeInTheDocument();
    });
  });

  it('closes conversation successfully when confirmed', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockActiveConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    (api.conversations.close as jest.Mock).mockResolvedValue({
      success: true,
      conversation: {
        id: 'conv-1',
        status: 'completed',
        canAddMessages: false,
        closeReason: 'Test reason',
        closedBy: 'user-1',
        closedAt: new Date().toISOString(),
      },
    });

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load and open modal
    await waitFor(() => {
      expect(screen.getByText('Close Conversation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Conversation'));

    await waitFor(() => {
      expect(screen.getByTestId('close-conversation-modal')).toBeInTheDocument();
    });

    // Confirm closing
    fireEvent.click(screen.getByTestId('modal-confirm-completed'));

    await waitFor(() => {
      expect(api.conversations.close).toHaveBeenCalledWith('conv-1', {
        reason: 'Test reason',
        status: 'completed',
      });
    });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('close-conversation-modal')).not.toBeInTheDocument();
    });
  });

  it('handles close conversation API errors gracefully', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockActiveConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    (api.conversations.close as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load and open modal
    await waitFor(() => {
      expect(screen.getByText('Close Conversation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Conversation'));

    await waitFor(() => {
      expect(screen.getByTestId('close-conversation-modal')).toBeInTheDocument();
    });

    // Confirm closing (this will fail)
    fireEvent.click(screen.getByTestId('modal-confirm-completed'));

    await waitFor(() => {
      expect(api.conversations.close).toHaveBeenCalled();
    });

    // Modal should remain open since the API call failed
    expect(screen.getByTestId('close-conversation-modal')).toBeInTheDocument();
  });

  it('shows loading state while closing conversation', async () => {
    (api.conversations.get as jest.Mock).mockResolvedValue({
      success: true,
      conversation: mockActiveConversation,
    });

    (api.personas.get as jest.Mock).mockResolvedValue({
      success: true,
      persona: { name: 'Test Persona', type: 'human_persona' },
    });

    (api.messages.list as jest.Mock).mockResolvedValue({
      success: true,
      messages: [],
    });

    // Mock a slow API response
    (api.conversations.close as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        conversation: {
          id: 'conv-1',
          status: 'completed',
          canAddMessages: false,
          closeReason: 'Test reason',
          closedBy: 'user-1',
          closedAt: new Date().toISOString(),
        },
      }), 1000))
    );

    render(<ConversationView conversationId="conv-1" />);

    // Wait for initial load and open modal
    await waitFor(() => {
      expect(screen.getByText('Close Conversation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Conversation'));

    await waitFor(() => {
      expect(screen.getByTestId('close-conversation-modal')).toBeInTheDocument();
    });

    // Confirm closing
    fireEvent.click(screen.getByTestId('modal-confirm-completed'));

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId('modal-loading')).toBeInTheDocument();
    });
  });
});