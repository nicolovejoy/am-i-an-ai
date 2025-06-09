import { Pool, PoolClient } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let pool: Pool | null = null;
let secretsCache: { [key: string]: any } = {};

interface DatabaseCredentials {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: number;
  dbname: string;
}

async function getSecret(secretArn: string): Promise<DatabaseCredentials> {
  // Check cache first
  if (secretsCache[secretArn]) {
    return secretsCache[secretArn];
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretArn });
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret string is empty');
    }
    
    const secret = JSON.parse(response.SecretString);
    
    // Cache the secret (Lambda execution context reuse)
    secretsCache[secretArn] = secret;
    
    return secret;
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw new Error(`Failed to retrieve database credentials: ${error}`);
  }
}

export async function getDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DB_SECRET_ARN environment variable is required');
  }

  try {
    const credentials = await getSecret(secretArn);
    
    // Create connection pool
    pool = new Pool({
      host: credentials.host || process.env.DB_HOST,
      port: credentials.port || parseInt(process.env.DB_PORT || '5432'),
      database: credentials.dbname || process.env.DB_NAME,
      user: credentials.username,
      password: credentials.password,
      max: 5, // Maximum number of connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
      ssl: {
        rejectUnauthorized: false // For RDS SSL
      }
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connection established successfully');
    return pool;

  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error(`Database connection failed: ${error}`);
  }
}

export async function queryDatabase(text: string, params?: any[]): Promise<any> {
  const db = await getDatabase();
  try {
    const result = await db.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  const db = await getDatabase();
  return await db.connect();
}

// Graceful shutdown (Lambda doesn't usually need this, but good practice)
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}