import { IUser, User, hashPassword, comparePassword } from "../models/User";
import { ApplicationError } from "../middleware/errorHandler";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new user in DynamoDB
 */
export async function createUser(
  userData: Omit<IUser, "id" | "createdAt" | "updatedAt">
): Promise<IUser> {
  try {
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create a new user with auto-generated ID
    const newUser = {
      id: uuidv4(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save user to DynamoDB using the Entity
    await (User as any).put(newUser);

    return newUser;
  } catch (error: any) {
    if (error.code === "ConditionalCheckFailedException") {
      throw new ApplicationError("User with this email already exists", 400);
    }
    throw error;
  }
}

/**
 * Find a user by email
 */
export async function findByEmail(email: string): Promise<IUser | null> {
  try {
    // Use GSI1 to query by email
    const result = await (User as any).query(`EMAIL#${email}`, {
      index: "gsi1",
      limit: 1,
    });

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as unknown as IUser;
    }

    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Find a user by ID
 */
export async function findById(id: string): Promise<IUser | null> {
  try {
    // Get by primary key
    const result = await (User as any).get({ id });

    if (result.Item) {
      return result.Item as unknown as IUser;
    }

    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  updates: Partial<IUser>
): Promise<IUser> {
  try {
    // First find the user to make sure it exists
    const existingUser = await findById(id);
    if (!existingUser) {
      throw new ApplicationError("User not found", 404);
    }

    // Include updatedAt in updates
    const updatedFields = {
      ...updates,
      updatedAt: new Date(),
      id: id, // Ensure ID is included for the key
    };

    // Hash password if it's being updated
    if (updates.password) {
      updatedFields.password = await hashPassword(updates.password);
    }

    // Update using the Entity
    const result = await (User as any).update(updatedFields);

    return result.Attributes as unknown as IUser;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    // Delete the user by ID
    await (User as any).delete({ id });
  } catch (error) {
    throw error;
  }
}

/**
 * Find a user by verification token
 */
export async function findByVerificationToken(
  token: string
): Promise<IUser | null> {
  try {
    // Since token is not a key, we need to scan
    const result = await (User as any).scan({
      filters: [{ attr: "verificationToken", eq: token }],
      limit: 1,
    });

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as unknown as IUser;
    }

    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Find a user by reset password token
 */
export async function findByResetToken(token: string): Promise<IUser | null> {
  try {
    // Since token is not a key, we need to scan
    const result = await (User as any).scan({
      filters: [{ attr: "resetPasswordToken", eq: token }],
      limit: 1,
    });

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as unknown as IUser;
    }

    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate user credentials
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<IUser | null> {
  try {
    const user = await findByEmail(email);
    if (!user) {
      return null;
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return null;
    }

    return user;
  } catch (error) {
    throw error;
  }
}
