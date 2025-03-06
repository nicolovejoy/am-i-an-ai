import React, { useState, useRef } from 'react';

interface TextInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MIN_LENGTH = 100;
  const MAX_LENGTH = 5000;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    if (newText.length < MIN_LENGTH && newText.length > 0) {
      setError(`Please enter at least ${MIN_LENGTH} characters (currently ${newText.length})`);
    } else if (newText.length > MAX_LENGTH) {
      setError(`Please enter no more than ${MAX_LENGTH} characters`);
    } else {
      setError(null);
    }
  };

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((clipText) => {
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart || 0;
          const end = textareaRef.current.selectionEnd || 0;
          const currentText = text;
          const newText = currentText.substring(0, start) + clipText + currentText.substring(end);
          setText(newText);

          // Update validation after paste
          if (newText.length < MIN_LENGTH && newText.length > 0) {
            setError(
              `Please enter at least ${MIN_LENGTH} characters (currently ${newText.length})`
            );
          } else if (newText.length > MAX_LENGTH) {
            setError(`Please enter no more than ${MAX_LENGTH} characters`);
          } else {
            setError(null);
          }
        }
      })
      .catch(() => {
        setError('Failed to paste from clipboard. Please ensure you have permission.');
      });
  };

  const handleClear = () => {
    setText('');
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = () => {
    if (text.length < MIN_LENGTH) {
      setError(`Please enter at least ${MIN_LENGTH} characters (currently ${text.length})`);
      return;
    }

    if (text.length > MAX_LENGTH) {
      setError(`Please enter no more than ${MAX_LENGTH} characters`);
      return;
    }

    onAnalyze(text);
  };

  return (
    <div className="w-full terminal typing-cursor">
      <div className="mb-2 flex justify-between items-center">
        <label
          htmlFor="text-input"
          className="text-sm font-medium text-neon-blue font-mono uppercase tracking-wide"
        >
          <span className="mr-2">&gt;</span>Enter text for analysis
        </label>
        <span
          className={`text-sm ${
            text.length > MAX_LENGTH || (text.length < MIN_LENGTH && text.length > 0)
              ? 'text-neon-pink'
              : 'text-neon-blue'
          }`}
        >
          {text.length} / {MAX_LENGTH}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        id="text-input"
        rows={8}
        className={`sci-fi-input w-full px-3 py-2 text-white font-mono rounded-md ${
          error ? 'border-neon-pink' : 'border-neon-blue'
        }`}
        placeholder="Paste or type text here to check if it was written by AI or a human..."
        value={text}
        onChange={handleTextChange}
      ></textarea>

      {error && <p className="mt-2 text-sm text-neon-pink">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={handlePaste} className="sci-fi-button">
          Paste
        </button>

        <button type="button" onClick={handleClear} className="sci-fi-button">
          Clear
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isAnalyzing || text.length < MIN_LENGTH || text.length > MAX_LENGTH}
          className={`ml-auto sci-fi-button ${isAnalyzing ? 'opacity-50' : ''} ${
            text.length >= MIN_LENGTH && text.length <= MAX_LENGTH && !isAnalyzing
              ? 'border-terminal-green text-terminal-green'
              : ''
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
        </button>
      </div>
    </div>
  );
};

export default TextInput;
