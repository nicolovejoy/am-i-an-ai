"use client";

import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  ISignUpResult,
  ICognitoUserData,
  ICognitoUserAttributeData,
  NodeCallback,
} from "amazon-cognito-identity-js";
import { SignUpFormData, SignInFormData, AuthError } from "../types/auth";

const userPool = new CognitoUserPool({
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
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

      const callback: NodeCallback<Error, ISignUpResult> = (err, result) => {
        if (err) {
          reject({
            code: (err as any).code || "UnknownError",
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

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject({
            code: (err as any).code || "UnknownError",
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

      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          reject({
            code: (err as any).code || "UnknownError",
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
          reject({
            code: (err as any).code || "UnknownError",
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

  getCurrentUser: (): Promise<{ email: string; sub: string } | null> => {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        resolve(null);
        return;
      }

      currentUser.getSession((err: Error | null, session?: any) => {
        if (err || !session) {
          resolve(null);
          return;
        }

        const callback: NodeCallback<Error, CognitoUserAttribute[]> = (
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

          resolve({ email, sub });
        };

        currentUser.getUserAttributes(callback);
      });
    });
  },
};
