import { Entity } from "dynamodb-toolbox";
import { UserTable } from "../config/dynamodb";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  usageCount: number;
}

// Create a User entity for DynamoDB
export const User = new Entity({
  name: "User",
  table: UserTable,
  // Type assertion to handle attribute typing
  attributes: {
    pk: {
      partitionKey: true,
      hidden: true,
      default: (data: any) => `USER#${data.id}`,
    },
    sk: {
      sortKey: true,
      hidden: true,
      default: (data: any) => `PROFILE#${data.id}`,
    },
    gsi1pk: {
      hidden: true,
      default: (data: any) => `EMAIL#${data.email}`,
    },
    gsi1sk: {
      hidden: true,
      default: (data: any) => `USER#${data.id}`,
    },

    id: { type: "string", required: true, default: () => uuidv4() },
    name: { type: "string", required: true },
    email: { type: "string", required: true },
    password: { type: "string", required: true },
    isVerified: { type: "boolean", required: true, default: false },
    verificationToken: { type: "string" },
    resetPasswordToken: { type: "string" },
    resetPasswordExpires: { type: "date" },
    role: {
      type: "string",
      required: true,
      validate: (value: string) => ["user", "admin"].includes(value),
      default: "user",
    },
    createdAt: { type: "date", required: true, default: () => new Date() },
    updatedAt: { type: "date", required: true, default: () => new Date() },
    lastLogin: { type: "date" },
    usageCount: { type: "number", required: true, default: 0 },
  },
} as any);

// Utility function to hash a password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Utility function to compare password with hashed version
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
