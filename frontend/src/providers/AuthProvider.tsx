"use client";

import React from "react";
import { ReactNode, useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Check if user is already logged in (from local storage or cookies)
    // This is a simple example - in a real app, you would validate tokens
    const checkAuthStatus = () => {
      // Only access localStorage on the client
      if (typeof window !== "undefined") {
        const savedAuthStatus = localStorage.getItem("auth_status");
        if (savedAuthStatus) {
          try {
            const { isLoggedIn, user } = JSON.parse(savedAuthStatus);

            if (isLoggedIn && user) {
              initialize(true, user);
            }
          } catch (error) {
            console.error("Error parsing auth status:", error);
            localStorage.removeItem("auth_status");
          }
        }
      }
    };

    checkAuthStatus();
  }, [initialize]);

  return <>{children}</>;
}
