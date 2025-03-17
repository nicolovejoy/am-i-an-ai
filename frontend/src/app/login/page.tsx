"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import useAuthStore from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [redirecting, setRedirecting] = useState(false);

  // Use useEffect with proper dependencies
  useEffect(() => {
    if (isAuthenticated) {
      setRedirecting(true);
      // Slight delay to avoid immediate redirect which can cause issues
      const redirectTimer = setTimeout(() => {
        router.push("/account");
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, router]);

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="terminal p-6">
          <p className="text-neon-green font-mono">
            Authenticated. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-lg mx-auto px-4">
        <LoginForm />

        <div className="text-center mt-6">
          <p className="text-gray-400">
            No account?{" "}
            <Link href="/register" className="text-neon-purple hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
