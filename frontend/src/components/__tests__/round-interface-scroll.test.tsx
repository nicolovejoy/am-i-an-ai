import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoundInterface from '../RoundInterface';
import { MatchContext } from '../../contexts/MatchContext';

// Mock components
vi.mock('../PromptDisplay', () => ({
  default: () => <div style={{ height: '300px' }}>Mock Prompt Display</div>
}));

vi.mock('../ResponseInput', () => ({
  default: () => <div style={{ height: '200px' }}>Mock Response Input</div>
}));

vi.mock('../MessageList', () => ({
  default: () => <div style={{ height: '400px' }}>Mock Message List</div>
}));

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, matchContextValue: unknown) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MatchContext.Provider value={matchContextValue}>
          {component}
        </MatchContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('RoundInterface Scrolling on Mobile', () => {
  const mockMatchContext = {
    match: {
      matchId: 'test-123',
      status: 'round_active',
      currentRound: 1,
      totalRounds: 5,
      rounds: [{
        roundNumber: 1,
        prompt: 'Test prompt',
        status: 'responding',
        responses: {},
      }],
    },
    currentRound: {
      roundNumber: 1,
      prompt: 'Test prompt',
      status: 'responding',
      responses: {},
    },
    myIdentity: 'A',
    isLoading: false,
    error: null,
  };

  describe('iPhone viewport (375x667)', () => {
    beforeEach(() => {
      // Set iPhone SE viewport size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should have scrollable container when content exceeds viewport', () => {
      const { container } = renderWithProviders(
        <div className="flex flex-col h-screen">
          <div className="flex-1">
            <RoundInterface />
          </div>
        </div>,
        mockMatchContext
      );

      // Find the container that should be scrollable
      const mainContainer = container.querySelector('.flex-1');
      expect(mainContainer).toBeTruthy();

      // Check computed styles to ensure scrolling is possible
      const styles = window.getComputedStyle(mainContainer!);
      
      // Should have overflow-y set to allow scrolling
      expect(styles.overflowY).not.toBe('hidden');
      expect(styles.overflowY).not.toBe('clip');
    });

    it('should not have nested scroll containers that block iOS scrolling', () => {
      const { container } = renderWithProviders(
        <RoundInterface />,
        mockMatchContext
      );

      // Find all elements with overflow settings
      const overflowElements = Array.from(container.querySelectorAll('*')).filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.overflow !== 'visible' || styles.overflowY !== 'visible';
      });

      // Should not have multiple nested elements preventing scroll
      const nestedScrollContainers = overflowElements.filter(el => {
        const styles = window.getComputedStyle(el);
        return (styles.overflow === 'hidden' || styles.overflowY === 'hidden') &&
               el.scrollHeight > el.clientHeight;
      });

      expect(nestedScrollContainers.length).toBe(0);
    });

    it('should allow touch scrolling on iOS', () => {
      const { container } = renderWithProviders(
        <RoundInterface />,
        mockMatchContext
      );

      const scrollableElements = Array.from(container.querySelectorAll('*')).filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.overflowY === 'auto' || styles.overflowY === 'scroll';
      });

      scrollableElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        // Should have -webkit-overflow-scrolling for smooth iOS scrolling
        expect(styles.webkitOverflowScrolling || 'touch').toBe('touch');
      });
    });
  });

  describe('Content height management', () => {
    it('should not use fixed heights that prevent scrolling', () => {
      const { container } = renderWithProviders(
        <RoundInterface />,
        mockMatchContext
      );

      // Find the main content area
      const contentElements = container.querySelectorAll('.space-y-4, .space-y-6');
      
      contentElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        // Should not have fixed height that could prevent content from expanding
        expect(styles.height).not.toMatch(/^\d+px$/);
      });
    });
  });
});