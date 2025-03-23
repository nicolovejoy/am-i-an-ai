import { Entity } from "dynamodb-toolbox";
import { ConversationTable } from "../config/dynamodb";
import { v4 as uuidv4 } from "uuid";

export interface IMessage {
  content: string;
  sender: "user" | "ai" | "system";
  timestamp: Date;
}

export interface IConversation {
  id: string;
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  isArchived: boolean;
}

// Create a Conversation entity for DynamoDB
export const Conversation = new Entity({
  name: "Conversation",
  table: ConversationTable,
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
      default: (data: any) => `CONV#${data.id}`,
    },
    gsi1pk: {
      hidden: true,
      default: (data: any) => `USER#${data.userId}`,
    },
    gsi1sk: {
      hidden: true,
      default: (data: any) =>
        `ARCHIVED#${data.isArchived ? "1" : "0"}#CONV#${data.id}`,
    },

    id: { type: "string", required: true, default: () => uuidv4() },
    userId: { type: "string", required: true },
    title: { type: "string", required: true },
    messages: { type: "list", required: true, default: [] },
    lastMessageAt: { type: "date", required: true, default: () => new Date() },
    isArchived: { type: "boolean", required: true, default: false },
    createdAt: { type: "date", required: true, default: () => new Date() },
    updatedAt: { type: "date", required: true, default: () => new Date() },
  },
} as any);
