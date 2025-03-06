import React, { useState } from "react";
import TextInput from "../components/TextInput";
import Results from "../components/Results";
import { analyzeText, AnalysisResult } from "../services/api";

const Home: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysisResult = await analyzeText(text);
      setResult(analysisResult);
    } catch (error) {
      console.error("Error analyzing text:", error);
      // Handle error state
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="terminal">
          <div className="border-b border-neon-blue pb-4 mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold neon-text font-mono tracking-wide">
              TEXT ANALYSIS SYSTEM v2.5
            </h2>
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

          <TextInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {(isAnalyzing || result) && (
          <Results
            result={result?.result || null}
            confidence={result?.confidence}
            isLoading={isAnalyzing}
          />
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 font-mono">
            <span className="text-neon-blue">i</span> This system uses advanced
            pattern recognition to analyze text. Results are for educational
            purposes only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
