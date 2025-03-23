"use client";

import React from "react";
import dynamic from "next/dynamic";

// Import the ChatInterface with dynamic loading (no SSR) to avoid hydration issues
const ChatInterface = dynamic(() => import("@/components/ChatInterface"), {
  ssr: false,
});

export default function ChatContainer() {
  return <ChatInterface />;
}
