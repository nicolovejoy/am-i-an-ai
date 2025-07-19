import {
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cognitoService } from '../services/cognito';
import type { AuthUser } from '../types/auth';
import { useSessionStore } from '../store/sessionStore';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();

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
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await cognitoService.signIn({ email, password });
    await checkAuth(); // Refresh user state after sign in
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Note: name is required by the interface but not used by Cognito in our current setup
    void name; // Explicitly mark as unused
    await cognitoService.signUp({ email, password, confirmPassword: password });
  };

  const confirmSignUp = async (email: string, code: string) => {
    await cognitoService.confirmSignUp(email, code);
  };

  const resendCode = async (email: string) => {
    // TODO: Implement resend confirmation code in cognito service
    void email; // Explicitly mark as unused
    console.warn('Resend confirmation code not implemented');
  };

  const signOut = async () => {
    // Clear authentication state
    cognitoService.signOut();
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear session data
    const sessionStore = useSessionStore.getState();
    sessionStore.reset();
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
    
    // Redirect to sign in
    navigate('/auth/signin');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        checkAuth,
        signIn,
        signUp,
        confirmSignUp,
        resendCode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};