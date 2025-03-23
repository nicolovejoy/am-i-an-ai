import { Request, Response, NextFunction } from "express";
import { comparePassword } from "../models/User";
import { ApplicationError } from "../middleware/errorHandler";
import * as userRepository from "../repositories/userRepository";

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApplicationError("User ID is required", 400);
    }

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
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          usageCount: user.usageCount,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApplicationError("User ID is required", 400);
    }

    const { name, password, currentPassword } = req.body;

    // Get the user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApplicationError("User not found", 404);
    }

    // If password is being updated, verify current password
    if (password && currentPassword) {
      const isPasswordValid = await comparePassword(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        throw new ApplicationError("Current password is incorrect", 400);
      }
    }

    // Update user fields
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (password) updates.password = password;

    // Save changes
    const updatedUser = await userRepository.updateUser(userId, updates);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 * DELETE /api/users/account
 */
export const deleteUserAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApplicationError("User ID is required", 400);
    }

    const { password } = req.body;

    // Get the user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApplicationError("User not found", 404);
    }

    // Verify password before deletion
    if (!password) {
      throw new ApplicationError("Password is required to delete account", 400);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApplicationError("Password is incorrect", 400);
    }

    // Delete the user
    await userRepository.deleteUser(userId);

    // TODO: Also delete all user data (conversations, analysis, etc.)

    res.status(200).json({
      status: "success",
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
