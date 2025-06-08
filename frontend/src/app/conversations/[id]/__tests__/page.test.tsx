import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationPage, { generateStaticParams } from '../page';

// Mock the ConversationView component
jest.mock('@/components/ConversationView', () => ({
  ConversationView: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="conversation-view">
      <span data-testid="conversation-id">{conversationId}</span>
    </div>
  ),
}));

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

    it('returns correct static params for pre-rendering', async () => {
      const params = await generateStaticParams();
      
      expect(params).toEqual([
        { id: '01234567-1111-1111-1111-012345678901' },
        { id: '01234567-4444-4444-4444-012345678901' },
        { id: '01234567-7777-7777-7777-012345678901' },
      ]);
    });

    it('returns array of objects with id property', async () => {
      const params = await generateStaticParams();
      
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBe(3);
      
      params.forEach(param => {
        expect(param).toHaveProperty('id');
        expect(typeof param.id).toBe('string');
        expect(param.id).toMatch(/^[0-9a-f-]+$/); // UUID pattern
      });
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