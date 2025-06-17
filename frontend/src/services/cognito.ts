"use client";

import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  ISignUpResult,
  NodeCallback,
} from "amazon-cognito-identity-js";
import { SignUpFormData, SignInFormData, AuthError } from "../types/auth";

declare const process: {
  env: {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: string;
    NEXT_PUBLIC_COGNITO_CLIENT_ID: string;
  };
};

interface CognitoError extends Error {
  code?: string;
}

const userPool = new CognitoUserPool({
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
});

export const cognitoService = {
  signUp: async ({ email, password }: SignUpFormData): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: "email",
          Value: email,
        }),
      ];

      const callback: NodeCallback<Error, ISignUpResult> = (err) => {
        if (err) {
          const cognitoErr = err as CognitoError;
          reject({
            code: cognitoErr.code || "UnknownError",
            message: err.message || "An unknown error occurred",
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
            code: cognitoErr.code || "UnknownError",
            message: err.message || "An unknown error occurred",
          } as AuthError);
          return;
        }
        resolve();
      });
    });
  },

  resendConfirmationCode: async (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.resendConfirmationCode((err: Error | undefined) => {
        if (err) {
          const cognitoErr = err as CognitoError;
          reject({
            code: cognitoErr.code || "UnknownError",
            message: err.message || "An unknown error occurred",
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
        onSuccess: () => resolve(),
        onFailure: (err: Error) => {
          const cognitoErr = err as CognitoError;
          reject({
            code: cognitoErr.code || "UnknownError",
            message: err.message || "An unknown error occurred",
          } as AuthError);
        },
      });
    });
  },

  signOut: () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
  },

  getCurrentUser: async (): Promise<{ email: string; sub: string; role?: 'user' | 'moderator' | 'admin' } | null> => {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        resolve(null);
        return;
      }

      currentUser.getSession(
        async (err: Error | null, session: { isValid: () => boolean } | null) => {
          if (err || !session || !session.isValid()) {
            resolve(null);
            return;
          }

          const callback: NodeCallback<Error, CognitoUserAttribute[]> = async (
            err,
            attributes
          ) => {
            if (err || !attributes) {
              resolve(null);
              return;
            }

            const email =
              attributes.find((attr) => attr.Name === "email")?.Value || "";
            const sub =
              attributes.find((attr) => attr.Name === "sub")?.Value || "";

            // TODO: Get user role from database once schema is set up
            // For now, give admin access to specific users
            const role: 'user' | 'moderator' | 'admin' = email === 'nlovejoy@me.com' ? 'admin' : 'user';

            resolve({ email, sub, role });
          };

          currentUser.getUserAttributes(callback);
        }
      );
    });
  },

  getIdToken: (): Promise<string | null> => {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        resolve(null);
        return;
      }

      currentUser.getSession(
        (err: Error | null, session: any) => {
          if (err || !session || !session.isValid()) {
            resolve(null);
            return;
          }

          const idToken = session.getIdToken().getJwtToken();
          resolve(idToken);
        }
      );
    });
  },

  updateUserAttributes: async (attributes: { [key: string]: string }): Promise<void> => {
    return new Promise((resolve, reject) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        reject(new Error("No user is currently signed in"));
        return;
      }

      currentUser.getSession((err: Error | null, session: { isValid: () => boolean } | null) => {
        if (err || !session) {
          reject(err || new Error("No valid session"));
          return;
        }

        const attributeList = Object.entries(attributes).map(
          ([name, value]) => new CognitoUserAttribute({ Name: name, Value: value })
        );

        currentUser.updateAttributes(attributeList, (err: Error | undefined) => {
          if (err) {
            const cognitoErr = err as CognitoError;
            reject({
              code: cognitoErr.code || "UnknownError",
              message: err.message || "An unknown error occurred",
            } as AuthError);
            return;
          }
          resolve();
        });
      });
    });
  },
};
