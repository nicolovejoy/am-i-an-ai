#!/usr/bin/env node

/**
 * AmIAnAI Admin CLI Tool
 * Fast access to admin functions with automatic Cognito authentication
 */

const https = require('https');
const readline = require('readline');
const crypto = require('crypto');

// Configuration
const API_URL = 'https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod';
const COGNITO_REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_ipC2hJAsT';
const CLIENT_ID = '6mvdodv3vud2pi5sv0oig920ne';

// Admin credentials (you'll need to set these)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'nlovejoy@me.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

let authToken = null;

// Utility function for HTTPS requests
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Cognito authentication
async function authenticate() {
  console.log('🔐 Authenticating with Cognito...');
  
  if (!ADMIN_PASSWORD) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable not set');
    console.log('   Set it with: export ADMIN_PASSWORD="your-password"');
    process.exit(1);
  }

  const authOptions = {
    hostname: `cognito-idp.${COGNITO_REGION}.amazonaws.com`,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    }
  };

  const authData = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: ADMIN_USERNAME,
      PASSWORD: ADMIN_PASSWORD
    }
  };

  try {
    const response = await httpsRequest(authOptions, authData);
    
    if (response.statusCode === 200 && response.body.AuthenticationResult) {
      authToken = response.body.AuthenticationResult.IdToken;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.error('❌ Authentication failed:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

// API request helper
async function apiRequest(path, method = 'GET', data = null) {
  const url = new URL(API_URL + path);
  
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await httpsRequest(options, data);
    return response;
  } catch (error) {
    console.error('❌ API request failed:', error.message);
    return null;
  }
}

// CLI Commands
const commands = {
  // Check API health
  async health() {
    console.log('🏥 Checking API health...');
    const response = await apiRequest('/api/health');
    
    if (response && response.statusCode === 200) {
      console.log('✅ API is healthy:', response.body);
    } else {
      console.log('❌ API health check failed');
    }
  },

  // Check database status
  async status() {
    console.log('🗄️  Checking database status...');
    const response = await apiRequest('/api/admin/database-status');
    
    if (response && response.statusCode === 200) {
      console.log('✅ Database status:', JSON.stringify(response.body, null, 2));
    } else {
      console.log('❌ Database status check failed:', response?.body || 'No response');
    }
  },

  // Setup database schema
  async setup() {
    console.log('🔧 Setting up database schema...');
    const response = await apiRequest('/api/admin/setup-database', 'POST');
    
    if (response && response.statusCode === 200) {
      console.log('✅ Database setup complete:', response.body);
    } else {
      console.log('❌ Database setup failed:', response?.body || 'No response');
    }
  },

  // Seed database with sample data
  async seed() {
    console.log('🌱 Seeding database...');
    const response = await apiRequest('/api/admin/seed-database', 'POST');
    
    if (response && response.statusCode === 200) {
      console.log('✅ Database seeded:', response.body);
    } else {
      console.log('❌ Database seeding failed:', response?.body || 'No response');
    }
  },

  // Reset database (setup + seed)
  async reset() {
    console.log('♻️  Resetting database...');
    await commands.setup();
    await commands.seed();
  },

  // List personas
  async personas() {
    console.log('👥 Fetching personas...');
    const response = await apiRequest('/api/personas');
    
    if (response && response.statusCode === 200) {
      console.log('✅ Personas:', JSON.stringify(response.body, null, 2));
    } else {
      console.log('❌ Failed to fetch personas:', response?.body || 'No response');
    }
  },

  // List conversations
  async conversations() {
    console.log('💬 Fetching conversations...');
    const response = await apiRequest('/api/conversations');
    
    if (response && response.statusCode === 200) {
      console.log('✅ Conversations:', JSON.stringify(response.body, null, 2));
    } else {
      console.log('❌ Failed to fetch conversations:', response?.body || 'No response');
    }
  },

  // Interactive mode
  async interactive() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n📟 AmIAnAI Admin CLI - Interactive Mode');
    console.log('Commands: health, status, setup, seed, reset, personas, conversations, exit\n');

    const prompt = () => {
      rl.question('admin> ', async (command) => {
        if (command === 'exit') {
          rl.close();
          process.exit(0);
        }

        if (commands[command]) {
          await commands[command]();
        } else {
          console.log('Unknown command:', command);
        }
        
        prompt();
      });
    };

    prompt();
  },

  // Help
  help() {
    console.log(`
AmIAnAI Admin CLI

Usage: admin-cli.js [command]

Commands:
  health         - Check API health
  status         - Check database status
  setup          - Initialize database schema
  seed           - Seed database with sample data
  reset          - Reset database (setup + seed)
  personas       - List all personas
  conversations  - List all conversations
  interactive    - Interactive mode
  help           - Show this help

Environment Variables:
  ADMIN_USERNAME - Admin username (default: nlovejoy@me.com)
  ADMIN_PASSWORD - Admin password (required)

Example:
  export ADMIN_PASSWORD="your-password"
  ./admin-cli.js status
    `);
  }
};

// Main execution
async function main() {
  const command = process.argv[2] || 'help';

  if (command === 'help') {
    commands.help();
    return;
  }

  // Authenticate first
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('❌ Authentication failed. Cannot proceed.');
    process.exit(1);
  }

  // Execute command
  if (commands[command]) {
    await commands[command]();
  } else {
    console.log('Unknown command:', command);
    commands.help();
  }
}

// Run the CLI
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});