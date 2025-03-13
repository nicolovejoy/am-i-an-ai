import React from "react";

export default function Donate() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="terminal">
        <div className="border-b border-neon-blue pb-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold neon-text font-mono tracking-wide">
            SYSTEM RESOURCE ALLOCATION
          </h1>
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-neon-pink"></div>
            <div className="w-3 h-3 rounded-full bg-neon-purple"></div>
            <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
          </div>
        </div>

        <div className="text-gray-300">
          <p className="text-xl mb-6 font-mono">
            <span className="text-neon-blue">&gt;</span> Your resource
            contributions enable continued operation and enhancement of this
            detection network.
          </p>

          <div className="bg-dark-blue bg-opacity-70 border border-neon-blue p-4 mb-8">
            <p className="text-neon-blue font-mono">
              <span className="text-terminal-green">NOTE:</span> This is a
              simulation. In production, secure payment processing would be
              integrated.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              Resource Allocation Objectives
            </h2>
            <p className="mb-4">
              As AI systems evolve rapidly, maintaining effective detection
              algorithms requires continuous development. Your contributions
              directly support:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li className="text-neon-blue">
                Algorithm enhancement and accuracy optimization
              </li>
              <li className="text-neon-purple">
                Advanced feature development and deployment
              </li>
              <li className="text-neon-blue">
                Network integrity and accessibility preservation
              </li>
              <li className="text-neon-purple">
                Infrastructure capacity and computation resources
              </li>
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              Contribution Protocols
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="neon-border rounded-md p-4 text-center bg-opacity-30 bg-medium-blue hover:bg-opacity-50 transition-all">
                <h3 className="text-xl font-semibold font-mono mb-2 text-neon-blue">
                  SINGLE
                </h3>
                <p className="text-gray-400 mb-4">
                  One-time system resource allocation
                </p>
                <button className="sci-fi-button w-full">
                  Contribute Once
                </button>
              </div>

              <div className="neon-border rounded-md p-4 text-center bg-opacity-30 bg-medium-blue hover:bg-opacity-50 transition-all relative">
                <div className="absolute -top-3 -right-3 bg-neon-purple text-white text-xs px-2 py-1 rounded-full font-mono">
                  OPTIMAL
                </div>
                <h3 className="text-xl font-semibold font-mono mb-2 text-neon-purple">
                  RECURSIVE
                </h3>
                <p className="text-gray-400 mb-4">
                  Monthly recurring resource allocation
                </p>
                <button className="sci-fi-button border-neon-purple text-neon-purple w-full">
                  Contribute Monthly
                </button>
              </div>

              <div className="neon-border rounded-md p-4 text-center bg-opacity-30 bg-medium-blue hover:bg-opacity-50 transition-all">
                <h3 className="text-xl font-semibold font-mono mb-2 text-neon-pink">
                  ANNUAL
                </h3>
                <p className="text-gray-400 mb-4">
                  Yearly resource allocation commitment
                </p>
                <button className="sci-fi-button border-neon-pink text-neon-pink w-full">
                  Contribute Yearly
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-terminal-green mb-4 font-mono uppercase tracking-wide">
              Alternative Support Vectors
            </h2>
            <p className="mb-4">
              If resource allocation is not possible, consider these alternative
              support methods:
            </p>
            <div className="bg-dark-blue bg-opacity-70 border border-gray-700 rounded p-3 mb-4 font-mono text-sm">
              <p className="text-terminal-green">
                ✓ Network propagation: Share our system with potential users
              </p>
              <p className="text-terminal-green">
                ✓ System feedback: Provide operational insights for improvement
              </p>
              <p className="text-terminal-green">
                ✓ Code contribution: Participate in our open-source framework
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
