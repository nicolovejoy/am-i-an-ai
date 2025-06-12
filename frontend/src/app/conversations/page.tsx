"use client";

import React from "react";
import ConversationList from "@/components/ConversationList";
import { useAuth } from "../../contexts/AuthContext";
import { FullPageLoader } from "@/components/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ConversationsPageContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader text="Loading your conversations..." />;
  }

  if (!isAuthenticated) {
    return null; // ProtectedRoute will handle redirect
  }

  return (
    <ErrorBoundary>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversationList />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function ConversationsPage() {
  return (
    <ProtectedRoute>
      <ConversationsPageContent />
    </ProtectedRoute>
  );
}