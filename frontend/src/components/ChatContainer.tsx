"use client";

import dynamic from "next/dynamic";
import { memo } from "react";

// Import the ChatInterface with dynamic loading (no SSR) to avoid hydration issues
const ChatInterface = dynamic(() => import("@/components/ChatInterface"), {
  ssr: false,
});

// Use memo to prevent unnecessary re-renders
const MemoizedChatInterface = memo(ChatInterface);

export default function ChatContainer() {
  return <MemoizedChatInterface />;
}
