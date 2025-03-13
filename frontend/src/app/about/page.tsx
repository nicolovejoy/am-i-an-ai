import React from "react";

export default function About() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="terminal">
        <div className="border-b border-neon-blue pb-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold neon-text font-mono tracking-wide">
            SYSTEM INFORMATION
          </h1>
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-neon-pink"></div>
            <div className="w-3 h-3 rounded-full bg-neon-purple"></div>
            <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
          </div>
        </div>

        <div className="text-gray-300">
          <p className="text-xl mb-6 font-mono">
            <span className="text-neon-blue">&gt;</span> Submit text to
            determine origin: <span className="text-terminal-green">human</span>{" "}
            or <span className="text-neon-purple">artificial intelligence</span>
          </p>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              Mission Parameters
            </h2>
            <p className="mb-4">
              As artificial intelligence rapidly evolves, distinguishing between
              AI and human-generated content becomes increasingly challenging.
              Our mission is to provide a reliable identification system that
              helps individuals, educators, and professionals detect
              AI-generated text.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              System Protocols
            </h2>
            <p className="mb-4">
              Our detection engine analyzes multiple linguistic patterns that
              differentiate human writing from AI-generated content, including:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li className="text-neon-blue">
                Neural pattern recognition algorithms
              </li>
              <li className="text-neon-purple">
                Statistical anomaly detection
              </li>
              <li className="text-neon-blue">Semantic coherence assessment</li>
              <li className="text-neon-purple">
                Linguistic structure analysis
              </li>
            </ul>
            <p>
              While no detection system achieves 100% accuracy, our algorithms
              continuously improve through machine learning techniques.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              Security Protocols
            </h2>
            <p className="mb-4">
              Text submitted for analysis remains confidential. Our security
              measures include:
            </p>
            <div className="bg-dark-blue bg-opacity-70 border border-gray-700 rounded p-3 mb-4 font-mono text-sm">
              <p className="text-terminal-green">✓ Transient data processing</p>
              <p className="text-terminal-green">
                ✓ No permanent storage of submitted text
              </p>
              <p className="text-terminal-green">
                ✓ Encrypted analysis pipeline
              </p>
              <p className="text-terminal-green">
                ✓ No third-party data sharing
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              Communication Channel
            </h2>
            <p className="mb-4">
              For inquiries, system feedback, or technical support:
            </p>
            <div className="font-mono text-neon-blue">
              &gt; contact@amianai.com
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
