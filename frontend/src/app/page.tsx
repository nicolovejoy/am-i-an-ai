"use client";

import React from "react";
import ChatContainer from "@/components/ChatContainer";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import { FullPageLoader } from "@/components/LoadingSpinner";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader text="Loading your experience..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              About Am I an AI?
            </h1>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                Am I an AI? is an interactive portal for exploring AI identity
                and communication.
              </p>
              <p className="text-gray-600 mb-8">
                This project aims to create a space where users can interact
                with AI systems and explore the boundaries between human and
                artificial intelligence.
              </p>
              <div className="text-center">
                <Link
                  href="/auth/signup"
                  className="inline-block px-6 py-3 text-base font-medium text-white bg-[#8B6B4A] rounded-md hover:bg-[#6B4A2A] transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
