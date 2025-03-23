import React from "react";
import ChatContainer from "@/components/ChatContainer";

export default function Home() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-mono text-neon-blue text-center mb-8">
          <span className="text-neon-pink">Am I</span> an{" "}
          <span className="text-neon-green">AI</span>?
        </h1>

        {/* Chat Interface */}
        <ChatContainer />
      </div>
    </div>
  );
}
