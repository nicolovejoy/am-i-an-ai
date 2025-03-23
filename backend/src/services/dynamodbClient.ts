import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Create a DynamoDB client based on environment
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "localkey",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "localsecret",
        },
      }
    : {}),
});

// Create a DynamoDB Document client
export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

// Table names from environment variables or defaults
export const USER_TABLE = process.env.DYNAMODB_USER_TABLE || "amianai-users";
export const CONVERSATION_TABLE =
  process.env.DYNAMODB_CONVERSATION_TABLE || "amianai-conversations";
export const ANALYSIS_TABLE =
  process.env.DYNAMODB_ANALYSIS_TABLE || "amianai-analyses";
