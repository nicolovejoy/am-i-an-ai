"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRoleAccess } from "../../hooks/useRoleAccess";
import { FullPageLoader } from "../LoadingSpinner";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  showAccessDenied?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  showAccessDenied = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { canAccessAdmin } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const redirectPath = requireAdmin ? '?redirect=/admin' : '';
        router.replace(`/auth/signin${redirectPath}`);
      } else if (requireAdmin && !canAccessAdmin()) {
        router.replace('/?error=insufficient_privileges');
      }
    }
  }, [isAuthenticated, isLoading, requireAdmin, canAccessAdmin, router]);

  if (isLoading) {
    return <FullPageLoader text="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    if (showAccessDenied) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You must be signed in to access this page.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 py-3 bg-[#8B6B4A] text-white rounded-md hover:bg-[#6B4A2A] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  if (requireAdmin && !canAccessAdmin()) {
    if (showAccessDenied) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              Administrator privileges required to access this page.
            </p>
            <div className="text-sm text-gray-500">
              Current role: {user?.role || 'No role assigned'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
};
