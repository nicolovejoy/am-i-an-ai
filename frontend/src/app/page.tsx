"use client";

import React from "react";
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              About Am I an AI?
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                Am I an AI? is an interactive portal for exploring AI identity
                and communication.
              </p>
              <p className="text-gray-600 mb-6">
                This project aims to create a space where users can interact
                with AI systems and explore the boundaries between human and
                artificial intelligence.
              </p>
              <div className="text-center">
                <Link
                  href="/auth/signup"
                  className="inline-block px-6 py-3 text-base font-medium text-white bg-[#8B6B4A] rounded-lg hover:bg-[#7A5A3A] transition-colors shadow-sm"
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

  // For authenticated users, show a proper home/dashboard page
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Am I an AI?
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore AI identity through meaningful conversations
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Conversations Card */}
            <Link
              href="/conversations"
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
                <svg className="w-6 h-6 text-[#8B6B4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm">
                View your conversation history and continue existing discussions.
              </p>
            </Link>

            {/* New Conversation Card */}
            <Link
              href="/conversations/new"
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Start New Chat</h3>
                <svg className="w-6 h-6 text-[#8B6B4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm">
                Begin a new conversation with an AI persona.
              </p>
            </Link>

            {/* Personas Card */}
            <Link
              href="/personas"
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Personas</h3>
                <svg className="w-6 h-6 text-[#8B6B4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm">
                Create and manage conversation personas.
              </p>
            </Link>
          </div>

          {/* Quick Actions - More prominent */}
          <div className="mt-8 text-center">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/conversations/new"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#8B6B4A] text-white font-medium rounded-lg hover:bg-[#7A5A3A] transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start Your First Conversation
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
