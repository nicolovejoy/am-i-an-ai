#!/usr/bin/env node
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ROCKET_LEAGUE_BOT_NAMES } from '../src/utils/rocketLeagueBots';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'robot-orchestra-users';

// Mapping of old names to new Rocket League bot names
const NAME_MAPPING: Record<string, string> = {
  'Little Sister': 'Sundown',
  'Wise Grandpa': 'Bandit',
  'Practical Mom': 'Maverick',
  'Philosopher': 'Beast',
  'Scientist': 'Boomer',
  'Comedian': 'Buzz',
  'Artist': 'Casper',
  'Engineer': 'Heater'
};

// Personality mapping
const PERSONALITY_MAPPING: Record<string, string> = {
  'littleSister': 'sundown',
  'wiseGrandpa': 'bandit',
  'practicalMom': 'maverick',
  'philosopher': 'sundown',
  'scientist': 'bandit',
  'comedian': 'maverick',
  'artist': 'sundown',
  'engineer': 'bandit'
};

async function updateAIBotNames() {
  console.log('Scanning for AI users...');
  
  try {
    // Scan for all AI users
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'userType = :userType',
      ExpressionAttributeValues: {
        ':userType': 'ai'
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      console.log('No AI users found in the database.');
      return;
    }

    console.log(`Found ${result.Items.length} AI users to update.`);

    // Update each AI user
    for (const user of result.Items) {
      const oldName = user.displayName;
      const oldPersonality = user.personality;
      
      // Determine new name
      let newName = NAME_MAPPING[oldName];
      if (!newName) {
        // If not in mapping, assign a random Rocket League bot name
        const index = Math.floor(Math.random() * ROCKET_LEAGUE_BOT_NAMES.length);
        newName = ROCKET_LEAGUE_BOT_NAMES[index];
      }
      
      // Determine new personality
      const newPersonality = PERSONALITY_MAPPING[oldPersonality] || 'sundown';
      
      console.log(`Updating ${oldName} (${oldPersonality}) -> ${newName} (${newPersonality})`);
      
      // Update the user
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId: user.userId },
        UpdateExpression: 'SET displayName = :displayName, personality = :personality, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':displayName': newName,
          ':personality': newPersonality,
          ':updatedAt': new Date().toISOString()
        }
      }));
    }
    
    console.log('Successfully updated all AI bot names!');
  } catch (error) {
    console.error('Error updating AI bot names:', error);
    process.exit(1);
  }
}

// Run the update
updateAIBotNames().catch(console.error);