"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthState, AuthError } from "../types/auth";
import { cognitoService } from "../services/cognito";

interface AuthContextType extends AuthState {
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await cognitoService.getCurrentUser();
      setState({
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
        user,
      });
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: {
          code: (error as Error).name || "UnknownError",
          message: (error as Error).message || "An unknown error occurred",
        },
        user: null,
      });
    }
  };

  const signOut = () => {
    cognitoService.signOut();
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
