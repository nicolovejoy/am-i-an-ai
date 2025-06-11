import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationView } from '../ConversationView';

// Mock fetch globally
global.fetch = jest.fn();

describe('ConversationView Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          conversation: {
            id: 'test-conversation-id',
            title: 'Test Conversation',
            topic: 'Test Topic',
            description: 'Test Description',
            status: 'active',
            participants: [
              {
                personaId: 'human-1',
                role: 'initiator',
                joinedAt: new Date().toISOString()
              },
              {
                personaId: 'ai-1', 
                role: 'responder',
                joinedAt: new Date().toISOString()
              }
            ],
            messageCount: 0,
            createdAt: new Date().toISOString()
          }
        })
      })
      // Mock persona responses
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          persona: {
            id: 'human-1',
            name: 'Human User',
            type: 'human'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          persona: {
            id: 'ai-1',
            name: 'AI Assistant',
            type: 'ai_agent'
          }
        })
      })
      // Mock empty messages
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: []
        })
      });
  });

  it('should load and display conversation basic info', async () => {
    render(<ConversationView conversationId="test-conversation-id" />);

    // Should show loading initially
    expect(screen.getByText('Loading conversation...')).toBeInTheDocument();

    // Wait for conversation to load
    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Should display conversation details
    expect(screen.getByText('Test Topic')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();

    // Should show participants
    expect(screen.getByText('Human User')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();

    // Should show empty message state
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('should make correct API calls', async () => {
    render(<ConversationView conversationId="test-conversation-id" />);

    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Verify API calls were made
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations/test-conversation-id'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations/test-conversation-id/messages'),
      expect.any(Object)
    );
  });
});