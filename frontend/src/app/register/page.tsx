"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import useAuthStore from "@/store/useAuthStore";

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [redirecting, setRedirecting] = useState(false);

  // Add delay to prevent immediate redirect that can cause issues
  useEffect(() => {
    if (isAuthenticated) {
      setRedirecting(true);
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
        <RegisterForm />

        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-neon-blue hover:underline">
              Login instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
