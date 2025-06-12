import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationList from '../ConversationList';
import { cognitoService } from '@/services/cognito';

// Mock the cognito service
jest.mock('@/services/cognito', () => ({
  cognitoService: {
    getIdToken: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('ConversationList Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should include authorization header with bearer token when fetching conversations', async () => {
    const mockToken = 'mock-jwt-token';
    const mockConversations = {
      success: true,
      conversations: [
        {
          id: '1',
          title: 'Test Conversation',
          topic: 'Testing',
          status: 'active',
          createdAt: new Date().toISOString(),
          messageCount: 5,
        },
      ],
    };

    // Mock successful auth token retrieval
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue(mockToken);
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConversations,
    });

    render(<ConversationList />);

    // Wait for the API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod/api/conversations',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  it('should show error when user is not authenticated', async () => {
    // Mock no auth token (user not authenticated)
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<ConversationList />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversations')).toBeInTheDocument();
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    // Ensure no API call was made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle token retrieval errors gracefully', async () => {
    // Mock auth token error
    (cognitoService.getIdToken as jest.Mock).mockRejectedValue(new Error('Token error'));

    render(<ConversationList />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversations')).toBeInTheDocument();
      expect(screen.getByText('Token error')).toBeInTheDocument();
    });

    // Ensure no API call was made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should show unauthorized error when API returns 401', async () => {
    const mockToken = 'mock-jwt-token';
    
    // Mock successful auth token retrieval
    (cognitoService.getIdToken as jest.Mock).mockResolvedValue(mockToken);
    
    // Mock 401 response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    render(<ConversationList />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error Loading Conversations')).toBeInTheDocument();
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });
});