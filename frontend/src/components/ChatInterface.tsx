"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FiSend } from "react-icons/fi";

// Define types for our chat data
type MessageType = "system" | "user";

interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to generate a unique ID for messages
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Add a system message with typing animation
  const addSystemMessage = useCallback((content: string, delay = 1000) => {
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          content,
          type: "system",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, delay);
  }, []);

  // Add a user message
  const addUserMessage = (content: string) => {
    if (!content.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        content,
        type: "user",
        timestamp: new Date(),
      },
    ]);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    setInputValue("");

    // Simple response logic - can be expanded later
    handleResponse();
  };

  // Simple response handler - this can be replaced with API calls later
  const handleResponse = () => {
    // Wait a moment before showing the typing indicator
    setTimeout(() => {
      // For now, just respond with a follow-up question
      addSystemMessage(
        "Thanks for sharing. What brings you to our site today?",
        1500
      );
    }, 500);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting when the component mounts
  useEffect(() => {
    // Focus the input
    inputRef.current?.focus();

    // Only add the initial greeting if it hasn't been sent yet
    if (!hasInitialized) {
      const timer = setTimeout(() => {
        addSystemMessage("Hello, how are you?", 800);
        setHasInitialized(true);
      }, 500);

      // Cleanup function to clear timer if component unmounts
      return () => clearTimeout(timer);
    }
  }, [addSystemMessage, hasInitialized]);

  return (
    <div className="flex flex-col h-[80vh] max-w-3xl mx-auto rounded-lg border border-neon-blue bg-dark-blue">
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`my-2 ${
              message.type === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs md:max-w-md ${
                message.type === "user"
                  ? "bg-neon-purple text-white rounded-tr-none"
                  : "bg-medium-blue text-neon-green rounded-tl-none"
              }`}
            >
              <p className="break-words">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="my-2 mr-auto">
            <div className="p-3 rounded-lg rounded-tl-none bg-medium-blue text-neon-green flex space-x-1">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse animation-delay-200">.</span>
              <span className="animate-pulse animation-delay-400">.</span>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-neon-blue flex"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 bg-medium-blue text-white border border-neon-blue rounded-l-md focus:outline-none focus:ring-1 focus:ring-neon-pink"
          aria-label="Type your message"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-neon-purple text-white rounded-r-md hover:bg-neon-pink transition-colors"
          aria-label="Send message"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
