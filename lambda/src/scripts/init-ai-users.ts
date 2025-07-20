#!/usr/bin/env node
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../shared/schemas/user.schema';

// Configure AWS
const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'robot-orchestra-users';

// AI user configurations
const AI_USERS: Omit<User, 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    userType: 'ai',
    displayName: 'Thoughtful Philosopher',
    isActive: true,
    isAdmin: false,
    personality: 'philosopher',
    modelConfig: {
      provider: 'bedrock',
      model: 'claude-3-haiku',
    },
  },
  {
    userType: 'ai',
    displayName: 'Analytical Scientist',
    isActive: true,
    isAdmin: false,
    personality: 'scientist',
    modelConfig: {
      provider: 'bedrock',
      model: 'claude-3-haiku',
    },
  },
  {
    userType: 'ai',
    displayName: 'Witty Comedian',
    isActive: true,
    isAdmin: false,
    personality: 'comedian',
    modelConfig: {
      provider: 'bedrock',
      model: 'claude-3-haiku',
    },
  },
  {
    userType: 'ai',
    displayName: 'Creative Artist',
    isActive: true,
    isAdmin: false,
    personality: 'artist',
    modelConfig: {
      provider: 'bedrock',
      model: 'claude-3-sonnet',
    },
  },
  {
    userType: 'ai',
    displayName: 'Pragmatic Engineer',
    isActive: true,
    isAdmin: false,
    personality: 'engineer',
    modelConfig: {
      provider: 'bedrock',
      model: 'claude-3-haiku',
    },
  },
];

async function initializeAIUsers() {
  console.log('Initializing AI users...');
  
  try {
    // Check if any AI users already exist
    const existingUsers = await dynamodb.query({
      TableName: USERS_TABLE,
      IndexName: 'userType-index',
      KeyConditionExpression: 'userType = :userType',
      ExpressionAttributeValues: {
        ':userType': 'ai',
      },
    }).promise();

    if (existingUsers.Items && existingUsers.Items.length > 0) {
      console.log(`Found ${existingUsers.Items.length} existing AI users. Skipping initialization.`);
      return;
    }

    // Create AI users
    const now = new Date().toISOString();
    const promises = AI_USERS.map(async (aiUser) => {
      const user: User = {
        ...aiUser,
        userId: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };

      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: user,
      }).promise();

      console.log(`Created AI user: ${user.displayName} (${user.userId})`);
      return user;
    });

    const createdUsers = await Promise.all(promises);
    console.log(`\nSuccessfully created ${createdUsers.length} AI users.`);
    
    // Log the user IDs for reference
    console.log('\nAI User IDs for reference:');
    createdUsers.forEach((user: User) => {
      console.log(`- ${user.displayName}: ${user.userId}`);
    });
    
  } catch (error) {
    console.error('Error initializing AI users:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeAIUsers().then(() => {
    console.log('\nAI user initialization complete.');
    process.exit(0);
  });
}

export { initializeAIUsers };