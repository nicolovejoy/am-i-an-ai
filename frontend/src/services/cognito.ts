import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import type { ISignUpResult, NodeCallback } from 'amazon-cognito-identity-js';
import type { SignUpFormData, SignInFormData, AuthError, AuthUser } from '../types/auth';


interface CognitoError extends Error {
  code?: string;
}

// Use existing v1 Cognito pool - reuse same user pool
const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_example', // Will be set via env
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'example', // Will be set via env
});

export const cognitoService = {
  signUp: async ({ email, password }: SignUpFormData): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ];

      const callback: NodeCallback<Error, ISignUpResult> = (err) => {
        if (err) {
          const cognitoErr = err as CognitoError;
          reject({
            code: cognitoErr.code || 'UnknownError',
            message: err.message || 'An unknown error occurred',
          } as AuthError);
          return;
        }
        resolve();
      };

      userPool.signUp(email, password, attributeList, [], callback);
    });
  },

  confirmSignUp: async (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err: Error | undefined) => {
        if (err) {
          const cognitoErr = err as CognitoError;
          reject({
            code: cognitoErr.code || 'UnknownError',
            message: err.message || 'An unknown error occurred',
          } as AuthError);
          return;
        }
        resolve();
      });
    });
  },

  signIn: async ({ email, password }: SignInFormData): Promise<void> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err: Error) => {
          const cognitoErr = err as CognitoError;
          reject({
            code: cognitoErr.code || 'UnknownError',
            message: err.message || 'An unknown error occurred',
          } as AuthError);
        },
      });
    });
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | undefined, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
          return;
        }

        cognitoUser.getUserAttributes((err: Error | undefined, attributes: CognitoUserAttribute[] | undefined) => {
          if (err || !attributes) {
            resolve(null);
            return;
          }

          const email = attributes.find((attr) => attr.getName() === 'email')?.getValue();
          const sub = attributes.find((attr) => attr.getName() === 'sub')?.getValue();

          if (!email || !sub) {
            resolve(null);
            return;
          }

          resolve({
            email,
            sub,
            role: 'user', // Simplified for v2
          });
        });
      });
    });
  },

  signOut: (): void => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  },

  getIdToken: async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | undefined, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
          return;
        }

        resolve(session.getIdToken().getJwtToken());
      });
    });
  },
};