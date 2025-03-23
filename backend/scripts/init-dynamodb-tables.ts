import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  ScalarAttributeType,
  KeyType,
  ProjectionType,
} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Create a DynamoDB client for local development
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  credentials: {
    accessKeyId: "localkey",
    secretAccessKey: "localsecret",
  },
});

// Table names from environment variables or defaults
const USER_TABLE = process.env.DYNAMODB_USER_TABLE || "amianai-users";
const CONVERSATION_TABLE =
  process.env.DYNAMODB_CONVERSATION_TABLE || "amianai-conversations";
const ANALYSIS_TABLE =
  process.env.DYNAMODB_ANALYSIS_TABLE || "amianai-analyses";

// Define the User table
const createUserTable = () => {
  const params = {
    TableName: USER_TABLE,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" as KeyType }, // Partition key
      { AttributeName: "sk", KeyType: "RANGE" as KeyType }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" as ScalarAttributeType },
      { AttributeName: "sk", AttributeType: "S" as ScalarAttributeType },
      { AttributeName: "email", AttributeType: "S" as ScalarAttributeType },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" as KeyType }],
        Projection: { ProjectionType: "ALL" as ProjectionType },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  return client.send(new CreateTableCommand(params));
};

// Define the Conversation table
const createConversationTable = () => {
  const params = {
    TableName: CONVERSATION_TABLE,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" as KeyType }, // Partition key (USER#userId)
      { AttributeName: "sk", KeyType: "RANGE" as KeyType }, // Sort key (CONVERSATION#conversationId)
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" as ScalarAttributeType },
      { AttributeName: "sk", AttributeType: "S" as ScalarAttributeType },
      {
        AttributeName: "lastMessageAt",
        AttributeType: "S" as ScalarAttributeType,
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "LastMessageIndex",
        KeySchema: [
          { AttributeName: "pk", KeyType: "HASH" as KeyType },
          { AttributeName: "lastMessageAt", KeyType: "RANGE" as KeyType },
        ],
        Projection: { ProjectionType: "ALL" as ProjectionType },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  return client.send(new CreateTableCommand(params));
};

// Define the Analysis table
const createAnalysisTable = () => {
  const params = {
    TableName: ANALYSIS_TABLE,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" as KeyType }, // Partition key (USER#userId)
      { AttributeName: "sk", KeyType: "RANGE" as KeyType }, // Sort key (ANALYSIS#analysisId)
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" as ScalarAttributeType },
      { AttributeName: "sk", AttributeType: "S" as ScalarAttributeType },
      { AttributeName: "createdAt", AttributeType: "S" as ScalarAttributeType },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "CreatedAtIndex",
        KeySchema: [
          { AttributeName: "pk", KeyType: "HASH" as KeyType },
          { AttributeName: "createdAt", KeyType: "RANGE" as KeyType },
        ],
        Projection: { ProjectionType: "ALL" as ProjectionType },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  return client.send(new CreateTableCommand(params));
};

// Main function to initialize tables
const initTables = async () => {
  try {
    console.log("Checking existing tables...");
    const { TableNames } = await client.send(new ListTablesCommand({}));

    // Create User table if it doesn't exist
    if (!TableNames?.includes(USER_TABLE)) {
      console.log(`Creating table: ${USER_TABLE}`);
      await createUserTable();
      console.log(`Table ${USER_TABLE} created successfully`);
    } else {
      console.log(`Table ${USER_TABLE} already exists`);
    }

    // Create Conversation table if it doesn't exist
    if (!TableNames?.includes(CONVERSATION_TABLE)) {
      console.log(`Creating table: ${CONVERSATION_TABLE}`);
      await createConversationTable();
      console.log(`Table ${CONVERSATION_TABLE} created successfully`);
    } else {
      console.log(`Table ${CONVERSATION_TABLE} already exists`);
    }

    // Create Analysis table if it doesn't exist
    if (!TableNames?.includes(ANALYSIS_TABLE)) {
      console.log(`Creating table: ${ANALYSIS_TABLE}`);
      await createAnalysisTable();
      console.log(`Table ${ANALYSIS_TABLE} created successfully`);
    } else {
      console.log(`Table ${ANALYSIS_TABLE} already exists`);
    }

    console.log("All tables initialized successfully!");
  } catch (error) {
    console.error("Error initializing tables:", error);
    process.exit(1);
  }
};

// Run the initialization
initTables();
