"use client";

import React, { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if there's auth data in localStorage
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    // Only attempt to restore session if both exist
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);

        if (user && token) {
          // Restore the session
          const { login } = useAuthStore.getState();
          login({ user, token, skipApi: true });
        }
      } catch (error) {
        // Handle invalid JSON in localStorage
        // Clear the invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  return <>{children}</>;
}
