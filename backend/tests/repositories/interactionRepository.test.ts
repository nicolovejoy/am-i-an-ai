import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Mock the dependencies before importing any modules
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  UpdateCommand: jest.fn(),
}));

// Mock dynamodb-toolbox entirely
jest.mock("dynamodb-toolbox", () => ({
  Table: jest.fn().mockImplementation(() => ({})),
  Entity: jest.fn().mockImplementation(() => ({
    put: jest.fn(),
    get: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

// Import the IInteraction interface
import { IInteraction } from "../../src/models/Interaction";

// Mock the Entity object
const mockInteractionEntity = {
  put: jest.fn(),
  get: jest.fn(),
  query: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Mock the specific model
jest.mock("../../src/models/Interaction", () => ({
  IInteraction: jest.requireActual("../../src/models/Interaction").IInteraction,
  Interaction: mockInteractionEntity,
}));

// Import the repository after setting up all mocks
import * as interactionRepository from "../../src/repositories/interactionRepository";

describe("InteractionRepository", () => {
  let mockInteraction: IInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock interaction for testing
    mockInteraction = {
      id: "mocked-uuid",
      userId: "user-123",
      agentId: "agent-456",
      agentType: "ai",
      title: "Test Interaction",
      messages: [
        {
          sender: "user",
          content: "Hello, how can you help me?",
          timestamp: new Date(),
        },
        {
          sender: "agent",
          content:
            "I can help you with various tasks. What would you like to know?",
          timestamp: new Date(),
        },
      ],
      status: "active",
      trustScore: 70,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    };
  });

  describe("createInteraction", () => {
    it("should create a new interaction", async () => {
      // Setup
      const { id, createdAt, updatedAt, ...interactionData } = mockInteraction;
      mockInteractionEntity.put.mockResolvedValueOnce({
        Item: mockInteraction,
      });

      // Execute
      const result = await interactionRepository.createInteraction(
        interactionData
      );

      // Verify
      expect(mockInteractionEntity.put).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result.userId).toBe(interactionData.userId);
      expect(result.agentId).toBe(interactionData.agentId);
      expect(result.title).toBe(interactionData.title);
    });

    it("should throw an error if the interaction cannot be created", async () => {
      // Setup
      const { id, createdAt, updatedAt, ...interactionData } = mockInteraction;
      const errorMessage = "Failed to create interaction";
      mockInteractionEntity.put.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Verify
      await expect(
        interactionRepository.createInteraction(interactionData)
      ).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("should retrieve an interaction by id and userId", async () => {
      // Setup
      mockInteractionEntity.get.mockResolvedValueOnce({
        Item: mockInteraction,
      });

      // Execute
      const result = await interactionRepository.findById(
        mockInteraction.id,
        mockInteraction.userId
      );

      // Verify
      expect(mockInteractionEntity.get).toHaveBeenCalledWith({
        pk: `USER#${mockInteraction.userId}`,
        sk: `INTERACTION#${mockInteraction.id}`,
      });
      expect(result).toEqual(mockInteraction);
    });

    it("should return null if interaction is not found", async () => {
      // Setup
      mockInteractionEntity.get.mockResolvedValueOnce({
        Item: null,
      });

      // Execute
      const result = await interactionRepository.findById(
        "non-existent-id",
        mockInteraction.userId
      );

      // Verify
      expect(result).toBeNull();
    });
  });

  // Add more tests for other repository methods here
});
