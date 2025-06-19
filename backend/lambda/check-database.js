#!/usr/bin/env node

// Simple database status checker that bypasses API authentication
// Uses the same database connection library as the Lambda function

const { Pool } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Environment configuration from .env.local
const DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:218141621131:secret:eeyore-db-password-IzXuki';
const DB_HOST = 'eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com';
const DB_PORT = '5432';
const DB_NAME = 'amianai';

async function getSecret(secretArn) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretArn });
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret string is empty');
    }
    
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw new Error(`Failed to retrieve database credentials: ${error}`);
  }
}

async function checkDatabase() {
  console.log('🔍 Checking database status...');
  
  try {
    // Get credentials from AWS Secrets Manager
    console.log('📡 Retrieving database credentials...');
    const credentials = await getSecret(DB_SECRET_ARN);
    
    // Create database connection
    const pool = new Pool({
      host: credentials.host || DB_HOST,
      port: credentials.port || parseInt(DB_PORT),
      database: credentials.dbname || DB_NAME,
      user: credentials.username,
      password: credentials.password,
      ssl: {
        rejectUnauthorized: false // For RDS SSL
      }
    });

    // Test connection
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    
    // Basic connection test
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log(`⏰ Current time: ${timeResult.rows[0].current_time}`);
    
    // Check if tables exist
    console.log('\n📋 Checking database schema...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found - database needs schema initialization');
    } else {
      console.log('✅ Tables found:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Check data counts
    if (tablesResult.rows.length > 0) {
      console.log('\n📊 Data counts:');
      
      const tables = ['users', 'personas', 'conversations', 'messages'];
      for (const table of tables) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   - ${table}: ${countResult.rows[0].count} records`);
        } catch (error) {
          console.log(`   - ${table}: Table not found or error`);
        }
      }
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Database check completed successfully');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkDatabase();