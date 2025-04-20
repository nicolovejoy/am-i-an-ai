export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  user: {
    email: string;
    sub: string;
  } | null;
}
