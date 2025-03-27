/*
import React, { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Try to restore session from localStorage
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        login({ user, token, skipApi: true });
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
      }
    }
  }, [login]);

  return <>{children}</>;
};
*/
