import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { AnalysisTable } from "../../src/config/dynamodb";
import { IInteraction, Interaction } from "../../src/models/Interaction";

// Create a mock DynamoDB client
const mockDynamoClient = {
  send: jest.fn(),
} as unknown as DynamoDBClient;

const mockDocumentClient = DynamoDBDocumentClient.from(mockDynamoClient);

// Mock the DynamoDB client
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => mockDynamoClient),
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

// Mock the Entity method calls
jest.mock("../../src/models/Interaction", () => ({
  IInteraction: jest.requireActual("../../src/models/Interaction").IInteraction,
  Interaction: {
    put: jest.fn(),
    get: jest.fn(),
    query: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
}));

// Import the repository after mocks are set up
import { InteractionRepository } from "../../src/repositories/interactionRepository";

describe("InteractionRepository", () => {
  let repository: InteractionRepository;
  let mockInteraction: IInteraction;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new InteractionRepository();

    // Create a mock interaction for testing
    mockInteraction = {
      id: uuidv4(),
      userId: uuidv4(),
      agentId: uuidv4(),
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
      (Interaction.put as jest.Mock).mockResolvedValueOnce({
        Item: mockInteraction,
      });

      // Execute
      const result = await repository.createInteraction(interactionData);

      // Verify
      expect(Interaction.put).toHaveBeenCalled();
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
      (Interaction.put as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      // Execute & Verify
      await expect(
        repository.createInteraction(interactionData)
      ).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("should retrieve an interaction by id and userId", async () => {
      // Setup
      (Interaction.get as jest.Mock).mockResolvedValueOnce({
        Item: mockInteraction,
      });

      // Execute
      const result = await repository.findById(
        mockInteraction.id,
        mockInteraction.userId
      );

      // Verify
      expect(Interaction.get).toHaveBeenCalledWith({
        pk: `USER#${mockInteraction.userId}`,
        sk: `INTERACTION#${mockInteraction.id}`,
      });
      expect(result).toEqual(mockInteraction);
    });

    it("should return null if interaction is not found", async () => {
      // Setup
      (Interaction.get as jest.Mock).mockResolvedValueOnce({ Item: null });

      // Execute
      const result = await repository.findById(
        "non-existent-id",
        mockInteraction.userId
      );

      // Verify
      expect(result).toBeNull();
    });
  });

  // Add more tests for other repository methods here
});
