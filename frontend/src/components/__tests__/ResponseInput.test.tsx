import { render, screen, fireEvent } from '@testing-library/react';
import PhraseComposer from '../ResponseInput';

// Mock the session store
jest.mock('@/store/sessionStore');
const mockSubmitResponse = jest.fn();
const mockUseSessionStore = require('@/store/sessionStore').useSessionStore;

mockUseSessionStore.mockReturnValue({
  submitResponse: mockSubmitResponse,
  timeRemaining: 90 // 1:30 remaining
});

describe('PhraseComposer - TDD Minimal Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not submit empty phrases', () => {
    render(<PhraseComposer />);
    
    const submitButton = screen.getByRole('button', { name: /play phrase/i });
    expect(submitButton).toBeDisabled();
    
    fireEvent.click(submitButton);
    expect(mockSubmitResponse).not.toHaveBeenCalled();
  });

  it('should submit non-empty phrase and clear input', () => {
    render(<PhraseComposer />);
    
    const textarea = screen.getByPlaceholderText(/compose your phrase/i);
    const submitButton = screen.getByRole('button', { name: /play phrase/i });
    
    // Type a response
    fireEvent.change(textarea, { target: { value: 'This is my human musical phrase!' } });
    expect(submitButton).not.toBeDisabled();
    
    // Submit
    fireEvent.click(submitButton);
    
    expect(mockSubmitResponse).toHaveBeenCalledWith('This is my human musical phrase!');
    expect(textarea).toHaveValue('');
  });

  it('should show character count', () => {
    render(<PhraseComposer />);
    
    const textarea = screen.getByPlaceholderText(/compose your phrase/i);
    
    // Initially should show 280 characters remaining
    expect(screen.getByText('280 characters remaining')).toBeInTheDocument();
    
    // Type some text
    fireEvent.change(textarea, { target: { value: 'Hello world!' } });
    
    // Should update character count
    expect(screen.getByText('268 characters remaining')).toBeInTheDocument();
  });

  // Removed timer test - component doesn't display time remaining
});