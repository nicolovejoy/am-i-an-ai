import { Entity } from "dynamodb-toolbox";
import { AnalysisTable } from "../config/dynamodb";
import { v4 as uuidv4 } from "uuid";

export interface IInteraction {
  id: string;
  userId: string;
  agentId: string;
  agentType: "human" | "ai";
  title: string;
  messages: Array<{
    sender: "user" | "agent";
    content: string;
    timestamp: Date;
  }>;
  status: "active" | "completed" | "archived";
  trustScore?: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  metadata?: Record<string, any>;
}

// Create an Interaction entity for DynamoDB
export const Interaction = new Entity({
  name: "Interaction",
  table: AnalysisTable,
  // Type assertion to handle attribute typing
  attributes: {
    pk: {
      partitionKey: true,
      hidden: true,
      default: (data: any) => `USER#${data.userId}`,
    },
    sk: {
      sortKey: true,
      hidden: true,
      default: (data: any) => `INTERACTION#${data.id}`,
    },
    gsi1pk: {
      hidden: true,
      default: (data: any) => `AGENT#${data.agentId}`,
    },
    gsi1sk: {
      hidden: true,
      default: (data: any) => `INTERACTION#${data.id}`,
    },
    gsi2pk: {
      hidden: true,
      default: (data: any) => `USER#${data.userId}`,
    },
    gsi2sk: {
      hidden: true,
      default: (data: any) =>
        `LAST_MESSAGE#${data.lastMessageAt.toISOString()}`,
    },

    id: { type: "string", required: true, default: () => uuidv4() },
    userId: { type: "string", required: true },
    agentId: { type: "string", required: true },
    agentType: {
      type: "string",
      required: true,
      validate: (value: string) => ["human", "ai"].includes(value),
    },
    title: { type: "string", required: true },
    messages: { type: "list", required: true },
    status: {
      type: "string",
      required: true,
      validate: (value: string) =>
        ["active", "completed", "archived"].includes(value),
      default: "active",
    },
    trustScore: { type: "number" },
    createdAt: { type: "date", required: true, default: () => new Date() },
    updatedAt: { type: "date", required: true, default: () => new Date() },
    lastMessageAt: { type: "date", required: true, default: () => new Date() },
    metadata: { type: "map" },
  },
} as any);
