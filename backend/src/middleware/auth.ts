import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { ApplicationError } from "./errorHandler";
import * as userRepository from "../repositories/userRepository";

// Extend the Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware that verifies JWT token in the request header
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApplicationError("Unauthorized - No token provided", 401);
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = verifyToken(token);

    // Check if user exists in database
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new ApplicationError("Unauthorized - User not found", 401);
    }

    // Add user information to request
    req.user = decoded;

    next();
  } catch (error) {
    next(new ApplicationError("Unauthorized - Invalid token", 401));
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApplicationError("Unauthorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApplicationError("Forbidden - Insufficient permissions", 403)
      );
    }

    next();
  };
};
