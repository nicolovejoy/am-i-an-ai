"use client";

import React from "react";
import TextInput from "../../components/TextInput";
import Results from "../../components/Results";
import { useAnalyzeText } from "@/hooks/useQueries";

export default function TextAnalysis() {
  // Use React Query mutation for analyzing text
  const analyzeMutation = useAnalyzeText();

  const handleAnalyze = async (text: string) => {
    // Reset any previous results
    analyzeMutation.reset();
    // Trigger the mutation
    analyzeMutation.mutate(text);
  };

  return (
    <main className="flex flex-col min-h-[80vh] items-center py-6 px-4 md:px-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="terminal">
          <div className="border-b border-neon-blue pb-4 mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold neon-text font-mono tracking-wide">
              TEXT ANALYSIS SYSTEM v3.0
            </h1>
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-neon-pink"></div>
              <div className="w-3 h-3 rounded-full bg-neon-purple"></div>
              <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
            </div>
          </div>

          <p className="text-gray-300 mb-6 font-mono">
            <span className="text-neon-blue">&gt;</span> Submit text to
            determine origin: <span className="text-terminal-green">human</span>{" "}
            or <span className="text-neon-purple">artificial intelligence</span>
          </p>

          <TextInput
            onAnalyze={handleAnalyze}
            isAnalyzing={analyzeMutation.isPending}
          />
        </div>

        {(analyzeMutation.isPending || analyzeMutation.data) && (
          <Results
            result={analyzeMutation.data?.result || null}
            confidence={analyzeMutation.data?.confidence || 0}
            isLoading={analyzeMutation.isPending}
          />
        )}

        {analyzeMutation.isError && (
          <div className="mt-4 p-4 border border-red-500 text-red-500 rounded">
            An error occurred while analyzing the text. Please try again.
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 font-mono">
            <span className="text-neon-blue">i</span> This system uses advanced
            pattern recognition to analyze text. Results are for educational
            purposes only.
          </p>
        </div>
      </div>
    </main>
  );
}
