import { Request, Response, NextFunction } from "express";
import * as userRepository from "../repositories/userRepository";
import { generateToken, generateRandomToken } from "../utils/auth";
import { ApplicationError } from "../middleware/errorHandler";

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApplicationError("User with this email already exists", 400);
    }

    // Generate verification token
    const verificationToken = generateRandomToken();

    // Create new user
    const user = await userRepository.createUser({
      name,
      email,
      password,
      verificationToken,
      isVerified: false,
      role: "user",
      usageCount: 0,
    });

    // TODO: Send verification email

    // Return success response (without sending the token yet since email is not verified)
    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please verify your email.",
      data: {
        userId: user.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    const user = await userRepository.validateCredentials(email, password);

    if (!user) {
      throw new ApplicationError("Invalid email or password", 401);
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new ApplicationError(
        "Please verify your email before logging in",
        401
      );
    }

    // Update last login timestamp
    await userRepository.updateUser(user.id, {
      lastLogin: new Date(),
    });

    // Generate JWT token
    const token = generateToken(user);

    // Send response with token
    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    // Find user with this verification token
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new ApplicationError("Invalid or expired verification token", 400);
    }

    // Mark user as verified and remove verification token
    await userRepository.updateUser(user.id, {
      isVerified: true,
      verificationToken: "",
    });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // User is already attached to request by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      throw new ApplicationError("User ID not found in request", 401);
    }

    // Get user from database
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApplicationError("User not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          usageCount: user.usageCount,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
