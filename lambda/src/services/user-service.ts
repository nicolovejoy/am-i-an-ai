import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { User, CreateHumanUser, CreateAIUser } from '../../shared/schemas/user.schema';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export class UserService {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }
  /**
   * Create a new human user
   */
  static async createHumanUser(data: CreateHumanUser): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      userId: uuidv4(),
      userType: 'human',
      displayName: data.displayName,
      isActive: true,
      isAdmin: data.isAdmin || false,
      cognitoId: data.cognitoId,
      email: data.email,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    }));

    return user;
  }

  /**
   * Create a new AI user
   */
  static async createAIUser(data: CreateAIUser): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      userId: uuidv4(),
      userType: 'ai',
      displayName: data.displayName,
      isActive: true,
      isAdmin: false,
      personality: data.personality,
      modelConfig: data.modelConfig,
      createdAt: now,
      updatedAt: now,
    };

    await dynamodb.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    }));

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    return result.Item as User | null;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }));

    return result.Items?.[0] as User | null;
  }

  /**
   * Get all active AI users
   */
  static async getActiveAIUsers(): Promise<User[]> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'userType-index',
      KeyConditionExpression: 'userType = :userType',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userType': 'ai',
        ':isActive': true,
      },
    }));

    return result.Items as User[];
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build update expression
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'userId' && value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Always update updatedAt
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamodb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as User;
  }

  /**
   * Get random AI users for a match
   */
  async getRandomAIUsers(count: number): Promise<User[]> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'userType-index',
      KeyConditionExpression: 'userType = :userType',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userType': 'ai',
        ':isActive': true,
      },
    }));

    const aiUsers = result.Items as User[];
    
    // Shuffle and take requested count
    const shuffled = aiUsers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

// Keep static reference to USERS_TABLE for backward compatibility
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'robot-orchestra-users';