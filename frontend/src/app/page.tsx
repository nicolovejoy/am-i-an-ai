import React from "react";
import ChatContainer from "@/components/ChatContainer";

export default function Home() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-semibold text-[#2D3748] text-center mb-8">
          Am I an AI?
        </h1>

        {/* Chat Interface */}
        <ChatContainer />
      </div>
    </div>
  );
}
