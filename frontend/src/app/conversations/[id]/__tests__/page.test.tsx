import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationPage, { generateStaticParams } from '../page';

// Mock the ConversationViewWithZustand component
jest.mock('@/components/ConversationViewWithZustand', () => ({
  ConversationViewWithZustand: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="conversation-view">
      <span data-testid="conversation-id">{conversationId}</span>
    </div>
  ),
}));

// Mock fetch for generateStaticParams
global.fetch = jest.fn();

describe('ConversationPage', () => {
  describe('Component Rendering', () => {
    it('renders ConversationView with correct conversationId', () => {
      const params = { id: 'test-conversation-id' };
      
      render(<ConversationPage params={params} />);
      
      expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-id')).toHaveTextContent('test-conversation-id');
    });

    it('passes through different conversation IDs correctly', () => {
      const params = { id: '01234567-1111-1111-1111-012345678901' };
      
      render(<ConversationPage params={params} />);
      
      expect(screen.getByTestId('conversation-id')).toHaveTextContent('01234567-1111-1111-1111-012345678901');
    });

    it('handles dynamic conversation IDs from creation flow', () => {
      const params = { id: 'conversation-1749419330975' };
      
      render(<ConversationPage params={params} />);
      
      expect(screen.getByTestId('conversation-id')).toHaveTextContent('conversation-1749419330975');
    });
  });

  describe('Static Generation', () => {
    it('exports generateStaticParams function', () => {
      expect(typeof generateStaticParams).toBe('function');
    });

    it('returns real conversation IDs from seeded database', async () => {
      const params = await generateStaticParams();
      
      expect(params).toEqual([
        { id: '770e8400-e29b-41d4-a716-446655440001' }, // Creative Writing Discussion
        { id: '770e8400-e29b-41d4-a716-446655440002' }, // Philosophy of AI Consciousness
        { id: '770e8400-e29b-41d4-a716-446655440003' }, // Technology Trends 2024
      ]);
    });
  });

  describe('Dynamic Params Support', () => {
    it('supports dynamic params through dynamicParams export', () => {
      // Import the module to check exports
      const module = require('../page');
      
      expect(module.dynamicParams).toBe(true);
    });

    it('allows non-static conversation IDs', () => {
      // Test with a conversation ID that's not in generateStaticParams
      const params = { id: 'new-conversation-12345' };
      
      render(<ConversationPage params={params} />);
      
      expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-id')).toHaveTextContent('new-conversation-12345');
    });
  });

  describe('Props Interface', () => {
    it('accepts params with required id property', () => {
      const params = { id: 'test-id' };
      
      expect(() => {
        render(<ConversationPage params={params} />);
      }).not.toThrow();
    });

    it('handles different ID formats', () => {
      const testIds = [
        'uuid-format-1111-1111-1111-111111111111',
        'conversation-1234567890',
        'simple-id',
        '123',
        'mixed-ID_123-test'
      ];

      testIds.forEach(id => {
        const { unmount } = render(<ConversationPage params={{ id }} />);
        
        expect(screen.getByTestId('conversation-id')).toHaveTextContent(id);
        
        unmount();
      });
    });
  });

  describe('Integration with ConversationView', () => {
    it('passes conversationId prop correctly to ConversationView', () => {
      const params = { id: 'integration-test-id' };
      
      render(<ConversationPage params={params} />);
      
      // The mocked ConversationView should receive and display the ID
      expect(screen.getByTestId('conversation-id')).toHaveTextContent('integration-test-id');
    });

    it('maintains component structure', () => {
      const params = { id: 'structure-test' };
      
      render(<ConversationPage params={params} />);
      
      // Should render the ConversationView component
      expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
    });
  });
});