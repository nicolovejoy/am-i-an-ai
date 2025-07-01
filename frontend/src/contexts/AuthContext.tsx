"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cognitoService } from "../services/cognito";
import { AuthUser } from "../types/auth";
import { useConversationStore } from "../store/conversationStore";
import { useConversationsListStore } from "../store/conversationsListStore";
import { usePersonaStore } from "../store/personaStore";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  checkAuth: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const currentUser = await cognitoService.getCurrentUser();
      if (currentUser) {
        setIsAuthenticated(true);
        setUser(currentUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    // Clear authentication state
    cognitoService.signOut();
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear all user data from stores
    const conversationStore = useConversationStore.getState();
    const conversationsListStore = useConversationsListStore.getState();
    const personaStore = usePersonaStore.getState();
    
    conversationStore.clearAllData();
    conversationsListStore.clearAllData();
    personaStore.clearAllData();
    
    // Clear session storage
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
    
    // Redirect to home page
    router.push('/');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, checkAuth, signOut }}
    >
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
