import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatInterface from '../ChatInterface';
import MatchComplete from '../MatchComplete';
import ResponseInput from '../ResponseInput';

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper to set viewport size
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Mobile Responsiveness', () => {
  describe('Small Screen (iPhone SE)', () => {
    beforeEach(() => {
      setViewport(375, 667);
    });

    it('should have proper padding on mobile', () => {
      const { container } = renderWithProviders(<ChatInterface />);
      
      // Check for responsive padding classes
      expect(container.querySelector('.px-2')).toBeTruthy();
      expect(container.querySelector('.sm\\:px-4')).toBeTruthy();
    });

    it('should stack elements vertically on mobile', () => {
      const { container } = renderWithProviders(<ChatInterface />);
      
      // Check for flex column layout
      expect(container.querySelector('.flex-col')).toBeTruthy();
    });

    it('should have readable text sizes', () => {
      const { container } = renderWithProviders(<ChatInterface />);
      
      // Check for responsive text size classes
      expect(container.querySelector('.text-xs')).toBeTruthy();
      expect(container.querySelector('.sm\\:text-sm')).toBeTruthy();
    });
  });

  describe('Tablet Screen (iPad)', () => {
    beforeEach(() => {
      setViewport(768, 1024);
    });

    it('should use medium breakpoint styles', () => {
      const { container } = renderWithProviders(<ChatInterface />);
      
      // Check for sm: prefixed classes being active
      const elements = container.querySelectorAll('[class*="sm:"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Touch Interactions', () => {
    it('should have touch-friendly button sizes', () => {
      const { container } = renderWithProviders(<ResponseInput onSubmit={() => {}} />);
      
      // Buttons should have minimum 44px touch target
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Scrolling Behavior', () => {
    it('should allow vertical scrolling on small screens', () => {
      setViewport(375, 667);
      const { container } = renderWithProviders(<ChatInterface />);
      
      // Check that overflow-hidden is not blocking scrolling
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeTruthy();
      
      // Should not have overflow-hidden on the main container
      const overflowHidden = container.querySelector('.min-h-screen.overflow-hidden');
      expect(overflowHidden).toBeFalsy();
    });
  });

  describe('Match Complete Responsiveness', () => {
    const mockMatch = {
      matchId: 'test-123',
      status: 'completed',
      participants: [
        { identity: 'A', isAI: false, displayName: 'Player 1', isConnected: true },
        { identity: 'B', isAI: true, displayName: 'Little Sister AI', personality: 'littleSister', isConnected: true },
        { identity: 'C', isAI: true, displayName: 'Wise Grandpa AI', personality: 'wiseGrandpa', isConnected: true },
        { identity: 'D', isAI: true, displayName: 'Practical Mom AI', personality: 'practicalMom', isConnected: true },
      ],
      rounds: [
        { roundNumber: 1, responses: {}, votes: {}, scores: {} },
      ],
    };

    it('should use responsive grid on mobile', () => {
      setViewport(375, 667);
      const { container } = renderWithProviders(
        <MatchComplete match={mockMatch} myIdentity="A" />
      );
      
      // Should have grid-cols-2 for player cards
      expect(container.querySelector('.grid-cols-2')).toBeTruthy();
    });

    it('should have proper spacing on mobile', () => {
      setViewport(375, 667);
      const { container } = renderWithProviders(
        <MatchComplete match={mockMatch} myIdentity="A" />
      );
      
      // Check for responsive gap classes
      expect(container.querySelector('.gap-4')).toBeTruthy();
      expect(container.querySelector('.p-4')).toBeTruthy();
    });
  });
});