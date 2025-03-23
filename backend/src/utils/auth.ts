import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../models/User";
import { v4 as uuidv4 } from "uuid";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const options: SignOptions = {};

  // Handle expires in
  if (process.env.JWT_EXPIRES_IN) {
    // Type assertion to tell TypeScript this string has the right format
    options.expiresIn = process.env
      .JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];
  } else {
    options.expiresIn = "7d"; // Default
  }

  // Fix type issue by using Buffer.from
  const secretBuffer = Buffer.from(secret, "utf-8");

  return jwt.sign(payload, secretBuffer, options);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Fix type issue by using Buffer.from
  const secretBuffer = Buffer.from(secret, "utf-8");

  return jwt.verify(token, secretBuffer) as TokenPayload;
};

/**
 * Generate a random token for email verification or password reset
 */
export const generateRandomToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
