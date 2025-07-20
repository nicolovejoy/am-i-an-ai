import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { User, CreateHumanUser, CreateAIUser } from '../../shared/schemas/user.schema';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'robot-orchestra-users';

export class UserService {
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

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: user,
    }).promise();

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

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: user,
    }).promise();

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId },
    }).promise();

    return result.Item as User | null;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await dynamodb.query({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }).promise();

    return result.Items?.[0] as User | null;
  }

  /**
   * Get all active AI users
   */
  static async getActiveAIUsers(): Promise<User[]> {
    const result = await dynamodb.query({
      TableName: USERS_TABLE,
      IndexName: 'userType-index',
      KeyConditionExpression: 'userType = :userType',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userType': 'ai',
        ':isActive': true,
      },
    }).promise();

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

    const result = await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }).promise();

    return result.Attributes as User;
  }
}