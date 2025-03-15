"use client";

import React from "react";

interface ResultsProps {
  result: "human" | "ai" | "unknown" | null;
  confidence?: number;
  isLoading: boolean;
}

const Results: React.FC<ResultsProps> = ({
  result,
  confidence = 0,
  isLoading,
}) => {
  const getResultClass = () => {
    switch (result) {
      case "human":
        return "result-human";
      case "ai":
        return "result-ai";
      case "unknown":
        return "result-unknown";
      default:
        return "";
    }
  };

  const getResultIcon = () => {
    switch (result) {
      case "human":
        return "🧠";
      case "ai":
        return "🤖";
      case "unknown":
        return "❓";
      default:
        return "";
    }
  };

  const getResultTitle = () => {
    switch (result) {
      case "human":
        return "Human-generated text detected";
      case "ai":
        return "AI-generated text detected";
      case "unknown":
        return "Analysis inconclusive";
      default:
        return "";
    }
  };

  const getConfidenceText = () => {
    if (!result) return "";
    return `Confidence: ${confidence}%`;
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="sci-fi-loading mx-auto"></div>
        <p className="mt-4 text-gray-300 font-mono">
          Analyzing text patterns...
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={`terminal ${getResultClass()} p-6 mt-6`}>
      <div className="flex items-center mb-4">
        <span className="text-3xl mr-3">{getResultIcon()}</span>
        <h3 className="text-xl font-semibold font-mono">{getResultTitle()}</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="w-full bg-opacity-30 bg-gray-700 rounded-full h-4">
          <div
            className="h-4 rounded-full"
            style={{
              width: `${confidence}%`,
              backgroundColor:
                result === "human"
                  ? "var(--terminal-green)"
                  : result === "ai"
                  ? "var(--neon-purple)"
                  : "var(--neon-pink)",
            }}
          ></div>
        </div>
        <span className="ml-4 font-mono text-sm">{getConfidenceText()}</span>
      </div>

      <div className="mt-4 text-sm text-gray-300 font-mono">
        <p>
          {result === "human" &&
            "The text appears to have linguistic patterns associated with human writing."}
          {result === "ai" &&
            "The text contains patterns and structures frequently found in AI-generated content."}
          {result === "unknown" &&
            "Unable to determine with confidence whether this text was written by a human or AI."}
        </p>
      </div>
    </div>
  );
};

export default Results;
