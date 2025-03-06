import React from "react";

const Account: React.FC = () => {
  // This would come from your authentication system in a real app
  const user = {
    name: "Operator.347",
    email: "user@example.com",
    joined: "Cycle 27.3.1",
    usageCount: 42,
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="terminal">
        <div className="border-b border-neon-blue pb-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold neon-text font-mono tracking-wide">
            USER TERMINAL ACCESS
          </h1>
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-neon-pink"></div>
            <div className="w-3 h-3 rounded-full bg-neon-purple"></div>
            <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
          </div>
        </div>

        <div className="mb-8 neon-border rounded-md p-6 bg-opacity-30 bg-medium-blue">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-terminal-green font-mono uppercase tracking-wide">
              Operator Profile
            </h2>
            <div className="px-2 py-1 bg-dark-blue bg-opacity-70 rounded text-xs text-neon-blue font-mono">
              STATUS: ACTIVE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">
                IDENTIFIER
              </label>
              <p className="text-base text-neon-blue font-mono">{user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">
                COMM CHANNEL
              </label>
              <p className="text-base text-neon-blue font-mono">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">
                SYSTEM ACCESS SINCE
              </label>
              <p className="text-base text-neon-blue font-mono">
                {user.joined}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 font-mono">
                ANALYSIS OPERATIONS
              </label>
              <p className="text-base text-neon-blue font-mono">
                {user.usageCount} completed
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button className="sci-fi-button">
              Modify Profile Configuration
            </button>
          </div>
        </div>

        <div className="mb-8 neon-border rounded-md p-6 bg-opacity-30 bg-medium-blue">
          <h2 className="text-xl font-semibold text-terminal-green font-mono uppercase tracking-wide mb-4">
            Operation Log
          </h2>

          <div className="space-y-4">
            <div className="border-b border-gray-700 pb-3">
              <div className="flex justify-between">
                <p className="text-sm text-gray-400 font-mono">
                  TIMESTAMP: 2025.03.05.1422
                </p>
                <p className="text-sm text-neon-purple font-mono">
                  AI DETECTED [89%]
                </p>
              </div>
              <p className="text-base text-gray-300 font-mono">
                Analysis: "Project Proposal" - 1247 tokens
              </p>
            </div>

            <div className="border-b border-gray-700 pb-3">
              <div className="flex justify-between">
                <p className="text-sm text-gray-400 font-mono">
                  TIMESTAMP: 2025.03.03.0917
                </p>
                <p className="text-sm text-terminal-green font-mono">
                  HUMAN DETECTED [92%]
                </p>
              </div>
              <p className="text-base text-gray-300 font-mono">
                Analysis: "Research Paper" - 3842 tokens
              </p>
            </div>

            <div className="border-b border-gray-700 pb-3">
              <div className="flex justify-between">
                <p className="text-sm text-gray-400 font-mono">
                  TIMESTAMP: 2025.02.28.1655
                </p>
                <p className="text-sm text-neon-purple font-mono">
                  AI DETECTED [76%]
                </p>
              </div>
              <p className="text-base text-gray-300 font-mono">
                Analysis: "Marketing Email" - 651 tokens
              </p>
            </div>
          </div>

          <div className="mt-4 text-right">
            <a
              href="#"
              className="text-neon-blue hover:text-white transition-colors font-mono"
            >
              VIEW COMPLETE OPERATION LOG
            </a>
          </div>
        </div>

        <div className="neon-border rounded-md p-6 bg-opacity-30 bg-medium-blue">
          <h2 className="text-xl font-semibold text-terminal-green font-mono uppercase tracking-wide mb-4">
            System Configuration
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-dark-blue bg-opacity-50">
              <div>
                <h3 className="text-base font-medium text-neon-blue font-mono">
                  NOTIFICATIONS
                </h3>
                <p className="text-sm text-gray-400">
                  Receive system updates and operational alerts
                </p>
              </div>
              <div className="flex items-center">
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-700 rounded-full">
                  <div className="absolute top-0.5 left-0.5 bg-neon-blue w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-dark-blue bg-opacity-50">
              <div>
                <h3 className="text-base font-medium text-neon-blue font-mono">
                  ENHANCED SECURITY PROTOCOL
                </h3>
                <p className="text-sm text-gray-400">
                  Add quantum encryption layer to your account
                </p>
              </div>
              <div className="flex items-center">
                <button className="text-neon-blue text-sm hover:text-white transition-colors font-mono">
                  ACTIVATE
                </button>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 text-center">
              <button className="text-neon-pink hover:text-white transition-colors font-mono">
                TERMINATE SYSTEM ACCESS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
