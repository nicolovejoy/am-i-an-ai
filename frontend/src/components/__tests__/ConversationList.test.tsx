import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationList from '../ConversationList';
import { api } from '@/services/apiClient';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    conversations: {
      list: jest.fn(),
    },
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockConversations = [
  {
    id: 'conv-1',
    title: 'Philosophy Discussion',
    topic: 'Consciousness and AI',
    description: 'Exploring the nature of consciousness',
    status: 'active',
    messageCount: 15,
    createdAt: '2024-01-15T10:00:00Z',
    qualityScore: 4.2,
    topicTags: ['philosophy', 'consciousness', 'ai'],
  },
  {
    id: 'conv-2',
    title: 'Creative Writing',
    topic: 'Short Story Collaboration',
    status: 'completed',
    messageCount: 8,
    createdAt: '2024-01-14T15:30:00Z',
    qualityScore: 3.8,
    topicTags: ['writing', 'creative'],
  },
  {
    id: 'conv-3',
    title: 'Technical Q&A',
    topic: 'JavaScript Performance',
    status: 'paused',
    messageCount: 22,
    createdAt: '2024-01-13T09:15:00Z',
    topicTags: ['javascript', 'performance'],
  },
];

describe('ConversationList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversations list header', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: [],
    });

    render(<ConversationList />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Conversations')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('link', { name: 'Start New Conversation' })).toHaveLength(2); // Header + empty state
    expect(screen.getByDisplayValue('All Conversations')).toBeInTheDocument();
  });

  it('loads conversations using standardized API call', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    await waitFor(() => {
      expect(api.conversations.list).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
      expect(screen.getByText('Creative Writing')).toBeInTheDocument();
      expect(screen.getByText('Technical Q&A')).toBeInTheDocument();
    });
  });

  it('displays conversation details correctly', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    await waitFor(() => {
      // Check first conversation details
      expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
      expect(screen.getByText('Consciousness and AI')).toBeInTheDocument();
      expect(screen.getByText('Exploring the nature of consciousness')).toBeInTheDocument();
      expect(screen.getByText('15 messages')).toBeInTheDocument();
      expect(screen.getByText('Quality: 4.2/5')).toBeInTheDocument();
      
      // Check topic tags
      expect(screen.getByText('philosophy')).toBeInTheDocument();
      expect(screen.getByText('consciousness')).toBeInTheDocument();
      expect(screen.getByText('ai')).toBeInTheDocument();
    });
  });

  it('shows status badges with correct styling', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    await waitFor(() => {
      const activeStatus = screen.getByText('active');
      const completedStatus = screen.getByText('completed');
      const pausedStatus = screen.getByText('paused');
      
      expect(activeStatus).toBeInTheDocument();
      expect(completedStatus).toBeInTheDocument();
      expect(pausedStatus).toBeInTheDocument();
      
      // Check CSS classes for status colors
      expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');
      expect(completedStatus).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(pausedStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  it('filters conversations by status', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
      expect(screen.getByText('Creative Writing')).toBeInTheDocument();
      expect(screen.getByText('Technical Q&A')).toBeInTheDocument();
    });

    // Filter by active status
    const statusSelect = screen.getByDisplayValue('All Conversations');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
      expect(screen.queryByText('Creative Writing')).not.toBeInTheDocument();
      expect(screen.queryByText('Technical Q&A')).not.toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    (api.conversations.list as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ConversationList />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversations')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });
  });

  it('shows empty state when no conversations', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: [],
    });

    render(<ConversationList />);

    await waitFor(() => {
      expect(screen.getByText('No conversations found')).toBeInTheDocument();
      expect(screen.getByText('Start your first conversation to begin engaging with personas!')).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: 'Start New Conversation' })).toHaveLength(2); // Header button + empty state button
    });
  });

  it('retries API call when try again button is clicked', async () => {
    (api.conversations.list as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (api.conversations.list as jest.Mock).mockResolvedValueOnce({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversations')).toBeInTheDocument();
    });

    // Click try again
    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(api.conversations.list).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.conversations.list as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ConversationList />);

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  it('formats timestamps correctly', async () => {
    const now = new Date();
    const recentConversation = {
      ...mockConversations[0],
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    };

    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: [recentConversation],
    });

    render(<ConversationList />);

    await waitFor(() => {
      expect(screen.getByText('30m ago')).toBeInTheDocument();
    });
  });

  it('truncates topic tags when there are more than 3', async () => {
    const conversationWithManyTags = {
      ...mockConversations[0],
      topicTags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };

    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: [conversationWithManyTags],
    });

    render(<ConversationList />);

    await waitFor(() => {
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
      expect(screen.queryByText('tag5')).not.toBeInTheDocument();
    });
  });

  it('has correct navigation links', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    await waitFor(() => {
      expect(screen.getByText('Philosophy Discussion')).toBeInTheDocument();
    });

    // Check start new conversation link (header button)
    const newConversationLink = screen.getByRole('link', { name: 'Start New Conversation' });
    expect(newConversationLink).toHaveAttribute('href', '/conversations/new');

    // Check conversation title links - Philosophy Discussion is wrapped in a link
    const titleLink = screen.getByRole('link', { name: 'Philosophy Discussion' });
    expect(titleLink).toHaveAttribute('href', '/conversations/conv-1');
  });

  it('refetches data when status filter changes', async () => {
    (api.conversations.list as jest.Mock).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<ConversationList />);

    // Wait for initial load
    await waitFor(() => {
      expect(api.conversations.list).toHaveBeenCalledTimes(1);
    });

    // Change filter
    const statusSelect = screen.getByDisplayValue('All Conversations');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    // Should trigger another API call
    await waitFor(() => {
      expect(api.conversations.list).toHaveBeenCalledTimes(2);
    });
  });
});