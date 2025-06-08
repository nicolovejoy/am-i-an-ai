import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface DatabaseCredentials {
  username: string;
  password: string;
  host?: string;
  port?: number;
  dbname?: string;
}

let cachedCredentials: DatabaseCredentials | null = null;

export async function getDatabaseCredentials(): Promise<DatabaseCredentials> {
  // Return cached credentials if available
  if (cachedCredentials) {
    return cachedCredentials;
  }

  // Check if we're using AWS Secrets Manager
  const secretArn = process.env.DB_SECRET_ARN; // eslint-disable-line no-undef
  
  if (secretArn) {
    try {
      const client = new SecretsManagerClient({ 
        region: process.env.AWS_REGION || 'us-east-1'  // eslint-disable-line no-undef
      });
      
      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });
      
      const response = await client.send(command);
      
      if (response.SecretString) {
        const credentials = JSON.parse(response.SecretString) as DatabaseCredentials;
        cachedCredentials = credentials;
        return credentials;
      }
    } catch (error) {
      console.error('Failed to retrieve database credentials from AWS Secrets Manager:', error);
      throw error;
    }
  }

  // Fall back to environment variables for local development
  const credentials: DatabaseCredentials = {
    username: process.env.DB_USER || 'postgres', // eslint-disable-line no-undef
    password: process.env.DB_PASSWORD || '', // eslint-disable-line no-undef
    host: process.env.DB_HOST || 'localhost', // eslint-disable-line no-undef
    port: parseInt(process.env.DB_PORT || '5432'), // eslint-disable-line no-undef
    dbname: process.env.DB_NAME || 'amianai_dev', // eslint-disable-line no-undef
  };

  cachedCredentials = credentials;
  return credentials;
}

export function clearCredentialsCache(): void {
  cachedCredentials = null;
}