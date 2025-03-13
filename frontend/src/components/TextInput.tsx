"use client";

import React, { useState } from "react";

interface TextInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isAnalyzing) {
      onAnalyze(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <textarea
          className="sci-fi-input w-full rounded-md h-40 resize-none"
          placeholder="Enter text to analyze..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isAnalyzing}
        ></textarea>
      </div>
      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="sci-fi-button"
          disabled={isAnalyzing || !text.trim()}
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Text"}
        </button>
        <div className="text-sm text-gray-400 font-mono">
          {text.trim().length > 0 ? `${text.trim().length} characters` : ""}
        </div>
      </div>
    </form>
  );
};

export default TextInput;
