import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { api } from '@/services/apiClient';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    conversations: {
      join: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
    },
    personas: {
      list: jest.fn(),
    },
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Components to be implemented
import JoinConversationButton from '../JoinConversationButton';
import ConversationParticipants from '../ConversationParticipants';
import JoinSuccessMessage from '../JoinSuccessMessage';

const mockConversationJoinable = {
  id: 'conv-public-1',
  title: 'Philosophy Discussion',
  topic: 'Consciousness and AI',
  description: 'Open public discussion',
  status: 'active' as const,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  messageCount: 5,
  topicTags: ['philosophy', 'consciousness'],
  participantCount: 2,
  permissions: {
    canView: true,
    canAddMessage: false,
    canJoin: true,
    canClose: false,
    canAddParticipant: false,
    canRemoveParticipant: false,
    canDelete: false,
  },
};

const mockConversationNonJoinable = {
  id: 'conv-private-1',
  title: 'Private Chat',
  topic: 'Personal matters',
  status: 'active' as const,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  messageCount: 3,
  topicTags: ['personal'],
  participantCount: 2,
  permissions: {
    canView: true,
    canAddMessage: true,
    canJoin: false,
    canClose: false,
    canAddParticipant: false,
    canRemoveParticipant: false,
    canDelete: false,
  },
};

const mockUserPersonas = [
  {
    id: 'persona-user-1',
    name: 'My Persona',
    description: 'My main discussion persona',
    personaType: 'human',
  },
  {
    id: 'persona-user-2',
    name: 'My Alt Persona',
    description: 'Alternative perspective',
    personaType: 'human',
  },
];

const mockConversationParticipants = [
  {
    persona_id: 'persona-1',
    role: 'host' as const,
    joined_at: new Date('2024-01-15T10:00:00Z'),
    is_revealed: true,
    left_at: null,
    permissions: ['read', 'write', 'moderate'] as ('read' | 'write' | 'moderate' | 'close')[],
    metadata: {},
  },
  {
    persona_id: 'persona-2',
    role: 'guest' as const,
    joined_at: new Date('2024-01-15T10:05:00Z'),
    is_revealed: true,
    left_at: null,
    permissions: ['read', 'write'] as ('read' | 'write' | 'moderate' | 'close')[],
    metadata: {},
  },
];

describe('JoinConversationButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.personas.list as jest.Mock).mockResolvedValue({
      personas: mockUserPersonas,
    });
  });

  it('renders join button for joinable conversations', () => {
    render(<JoinConversationButton conversation={mockConversationJoinable} />);
    
    expect(screen.getByRole('button', { name: /join conversation/i })).toBeInTheDocument();
    expect(screen.getByText('Join Conversation')).toBeInTheDocument();
  });

  it('does not render join button for non-joinable conversations', () => {
    render(<JoinConversationButton conversation={mockConversationNonJoinable} />);
    
    expect(screen.queryByRole('button', { name: /join conversation/i })).not.toBeInTheDocument();
  });

  it('shows persona selection modal when join button is clicked', async () => {
    render(<JoinConversationButton conversation={mockConversationJoinable} />);
    
    const joinButton = screen.getByRole('button', { name: /join conversation/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Select Persona to Join')).toBeInTheDocument();
      expect(screen.getByText('My Persona')).toBeInTheDocument();
      expect(screen.getByText('My Alt Persona')).toBeInTheDocument();
    });
  });

  it('disables join button when already in conversation (edge case)', () => {
    const conversationAlreadyJoined = {
      ...mockConversationJoinable,
      permissions: {
        ...mockConversationJoinable.permissions,
        canJoin: false,
        canAddMessage: true, // Already participant
      },
    };

    render(<JoinConversationButton conversation={conversationAlreadyJoined} />);
    
    expect(screen.queryByRole('button', { name: /join conversation/i })).not.toBeInTheDocument();
  });

  it('calls join API when persona is selected', async () => {
    (api.conversations.join as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Successfully joined conversation',
      conversation: {
        ...mockConversationJoinable,
        participantCount: 3,
      },
      permissions: {
        canView: true,
        canAddMessage: true,
        canJoin: false,
      },
    });

    render(<JoinConversationButton conversation={mockConversationJoinable} />);
    
    // Open modal
    const joinButton = screen.getByRole('button', { name: /join conversation/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Select Persona to Join')).toBeInTheDocument();
    });

    // Select persona
    const personaOption = screen.getByText('My Persona');
    fireEvent.click(personaOption);

    // Confirm join
    const confirmButton = screen.getByRole('button', { name: /confirm join/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.conversations.join).toHaveBeenCalledWith('conv-public-1', {
        personaId: 'persona-user-1',
      });
    });
  });

  it('shows loading state during join process', async () => {
    (api.conversations.join as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<JoinConversationButton conversation={mockConversationJoinable} />);
    
    // Open modal and select persona
    fireEvent.click(screen.getByRole('button', { name: /join conversation/i }));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('My Persona'));
      fireEvent.click(screen.getByRole('button', { name: /confirm join/i }));
    });

    expect(screen.getByText('Joining...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /joining/i })).toBeDisabled();
  });

  it('handles join API errors gracefully', async () => {
    (api.conversations.join as jest.Mock).mockRejectedValue(
      new Error('Maximum participants reached')
    );

    render(<JoinConversationButton conversation={mockConversationJoinable} />);
    
    // Complete join flow
    fireEvent.click(screen.getByRole('button', { name: /join conversation/i }));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('My Persona'));
      fireEvent.click(screen.getByRole('button', { name: /confirm join/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to join conversation')).toBeInTheDocument();
      expect(screen.getByText('Maximum participants reached')).toBeInTheDocument();
    });
  });

  it('refreshes conversation list after successful join', async () => {
    const mockOnJoinSuccess = jest.fn();
    
    (api.conversations.join as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Successfully joined conversation',
    });

    render(
      <JoinConversationButton 
        conversation={mockConversationJoinable}
        onJoinSuccess={mockOnJoinSuccess}
      />
    );
    
    // Complete join flow
    fireEvent.click(screen.getByRole('button', { name: /join conversation/i }));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('My Persona'));
      fireEvent.click(screen.getByRole('button', { name: /confirm join/i }));
    });

    await waitFor(() => {
      expect(mockOnJoinSuccess).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully joined conversation',
      });
    });
  });
});

describe('ConversationParticipants', () => {
  it('displays participant count and list', () => {
    render(<ConversationParticipants participants={mockConversationParticipants} />);
    
    expect(screen.getByText('2 participants')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  it('shows participant roles with proper styling', () => {
    render(<ConversationParticipants participants={mockConversationParticipants} />);
    
    const hostBadge = screen.getByText('Host');
    const guestBadge = screen.getByText('Guest');
    
    expect(hostBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(guestBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('handles empty participant list', () => {
    render(<ConversationParticipants participants={[]} />);
    
    expect(screen.getByText('0 participants')).toBeInTheDocument();
  });

  it('formats join timestamps correctly', () => {
    const recentParticipant = {
      ...mockConversationParticipants[0],
      joined_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    };

    render(<ConversationParticipants participants={[recentParticipant]} />);
    
    expect(screen.getByText(/joined 30m ago/i)).toBeInTheDocument();
  });
});

describe('JoinSuccessMessage', () => {
  const mockJoinResult = {
    success: true,
    message: 'Successfully joined conversation',
    conversation: {
      ...mockConversationJoinable,
      participantCount: 3,
    },
  };

  it('displays success message with conversation details', () => {
    render(<JoinSuccessMessage joinResult={mockJoinResult} />);
    
    expect(screen.getByText('Successfully Joined!')).toBeInTheDocument();
    expect(screen.getByText('Successfully joined conversation')).toBeInTheDocument();
    expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
  });

  it('shows updated participant count', () => {
    render(<JoinSuccessMessage joinResult={mockJoinResult} />);
    
    expect(screen.getByText('3 participants')).toBeInTheDocument();
  });

  it('provides navigation to conversation', () => {
    render(<JoinSuccessMessage joinResult={mockJoinResult} />);
    
    const viewButton = screen.getByRole('link', { name: /view conversation/i });
    expect(viewButton).toHaveAttribute('href', '/conversations/conv-public-1');
  });

  it('can be dismissed', () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <JoinSuccessMessage 
        joinResult={mockJoinResult}
        onDismiss={mockOnDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalled();
  });
});