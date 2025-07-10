import { render, screen, fireEvent } from '@testing-library/react';
import HumanOrRobot from '../HumanOrRobot';
import { useSessionStore } from '@/store/sessionStore';
import type { SessionStore } from '@/store/types';

// Mock the store
jest.mock('@/store/sessionStore');
const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;

describe('HumanOrRobot', () => {
  const mockSubmitVote = jest.fn();
  
  const mockResponses = {
    A: 'Human response about loneliness',
    B: 'Like whispers in the twilight',
    C: 'Approximately 42 decibels',
    D: 'Like a disco ball made of butterflies'
  };

  beforeEach(() => {
    mockUseSessionStore.mockReturnValue({
      submitVote: mockSubmitVote,
      myIdentity: 'A',
      timeRemaining: 30,
    } as Partial<SessionStore> as SessionStore);
    
    mockSubmitVote.mockClear();
  });

  it('should not reshuffle responses on re-render', async () => {
    const { rerender } = render(<HumanOrRobot responses={mockResponses} />);
    
    // Get initial order of responses
    const firstRender = screen.getAllByText(/Response [A-D]/);
    const initialOrder = firstRender.map(el => el.textContent);
    
    // Force a re-render by changing a prop (but keeping responses the same)
    rerender(<HumanOrRobot responses={mockResponses} />);
    
    // Get order after re-render
    const secondRender = screen.getAllByText(/Response [A-D]/);
    const afterReRenderOrder = secondRender.map(el => el.textContent);
    
    // Order should be exactly the same
    expect(afterReRenderOrder).toEqual(initialOrder);
  });

  it('should maintain selection when component re-renders', () => {
    const { rerender } = render(<HumanOrRobot responses={mockResponses} />);
    
    // Find and click a clickable response (not the user's response)
    const clickableResponses = screen.getAllByText('Like whispers in the twilight');
    
    if (clickableResponses.length > 0) {
      // Click the parent div containing the response
      const parentDiv = clickableResponses[0].closest('div[class*="cursor-pointer"]');
      if (parentDiv) {
        fireEvent.click(parentDiv);
        
        // Verify selection is shown
        expect(screen.getByText('Selected')).toBeInTheDocument();
        
        // Re-render component
        rerender(<HumanOrRobot responses={mockResponses} />);
        
        // Selection should still be there
        expect(screen.getByText('Selected')).toBeInTheDocument();
      }
    }
  });

  it('should preserve identity mapping across renders', () => {
    const { rerender } = render(<HumanOrRobot responses={mockResponses} />);
    
    // Find the element with "Like whispers in the twilight" (robot B response)
    const robotBElement = screen.getByText('Like whispers in the twilight');
    const initialParent = robotBElement.closest('[data-testid], div');
    const initialLabel = initialParent?.querySelector('[class*="text-sm"]')?.textContent;
    
    // Re-render
    rerender(<HumanOrRobot responses={mockResponses} />);
    
    // Same response should have same label
    const afterRenderRobotB = screen.getByText('Like whispers in the twilight');
    const afterRenderParent = afterRenderRobotB.closest('[data-testid], div');
    const afterRenderLabel = afterRenderParent?.querySelector('[class*="text-sm"]')?.textContent;
    
    expect(afterRenderLabel).toBe(initialLabel);
  });
});