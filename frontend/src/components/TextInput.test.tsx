import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextInput from './TextInput';

describe('TextInput Component', () => {
  const mockAnalyze = jest.fn();

  beforeEach(() => {
    mockAnalyze.mockClear();
  });

  it('renders correctly with default props', () => {
    render(<TextInput onAnalyze={mockAnalyze} isAnalyzing={false} />);

    // Check for main elements
    expect(screen.getByLabelText(/enter text for analysis/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('disables analyze button when text is too short', () => {
    render(<TextInput onAnalyze={mockAnalyze} isAnalyzing={false} />);

    const textarea = screen.getByRole('textbox');
    const analyzeButton = screen.getByRole('button', { name: /analyze text/i });

    // Button should be disabled initially (empty text)
    expect(analyzeButton).toBeDisabled();

    // Type short text
    fireEvent.change(textarea, { target: { value: 'Short text' } });
    expect(analyzeButton).toBeDisabled();
  });

  it('enables analyze button when text meets length requirements', () => {
    render(<TextInput onAnalyze={mockAnalyze} isAnalyzing={false} />);

    const textarea = screen.getByRole('textbox');
    const analyzeButton = screen.getByRole('button', { name: /analyze text/i });

    // Generate text with valid length (>= 100 characters)
    const validText = 'A'.repeat(100);
    fireEvent.change(textarea, { target: { value: validText } });

    // Button should be enabled
    expect(analyzeButton).not.toBeDisabled();
  });

  it('calls onAnalyze when analyze button is clicked with valid text', () => {
    render(<TextInput onAnalyze={mockAnalyze} isAnalyzing={false} />);

    const textarea = screen.getByRole('textbox');
    const analyzeButton = screen.getByRole('button', { name: /analyze text/i });

    // Enter valid text
    const validText = 'A'.repeat(100);
    fireEvent.change(textarea, { target: { value: validText } });

    // Click analyze button
    fireEvent.click(analyzeButton);

    // Check if onAnalyze was called with correct text
    expect(mockAnalyze).toHaveBeenCalledWith(validText);
  });

  it('shows loading state when isAnalyzing is true', () => {
    render(<TextInput onAnalyze={mockAnalyze} isAnalyzing={true} />);

    // Check for "Analyzing..." text on button
    expect(screen.getByRole('button', { name: /analyzing.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyzing.../i })).toBeDisabled();
  });

  it('clears the text when clear button is clicked', () => {
    render(<TextInput onAnalyze={mockAnalyze} isAnalyzing={false} />);

    const textarea = screen.getByRole('textbox');
    const clearButton = screen.getByRole('button', { name: /clear/i });

    // Enter some text
    fireEvent.change(textarea, { target: { value: 'Some text to clear' } });
    expect(textarea).toHaveValue('Some text to clear');

    // Click clear button
    fireEvent.click(clearButton);

    // Text should be cleared
    expect(textarea).toHaveValue('');
  });
});
