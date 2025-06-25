#!/usr/bin/env node

/**
 * Run database migrations for AmIAnAI
 * Uses the Lambda's database connection module
 */

const fs = require('fs');
const path = require('path');

// Add Lambda's node_modules to the require path
const lambdaModulesPath = path.join(__dirname, '..', 'backend', 'lambda', 'node_modules');
require('module').Module._nodeModulePaths = function(from) {
  const paths = require('module').Module._nodeModulePaths.call(this, from);
  paths.push(lambdaModulesPath);
  return paths;
};

const { Pool } = require('pg');
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const secretsManager = new AWS.SecretsManager();

async function getDbCredentials() {
  try {
    const secret = await secretsManager.getSecretValue({ 
      SecretId: 'eeyore-db-password' 
    }).promise();
    
    return JSON.parse(secret.SecretString);
  } catch (error) {
    console.error('❌ Failed to get database credentials:', error.message);
    console.log('   Make sure your AWS credentials are configured');
    process.exit(1);
  }
}

async function runMigration(migrationFile) {
  console.log('🔑 Getting database credentials...');
  const credentials = await getDbCredentials();
  
  // Create connection pool
  const pool = new Pool({
    host: 'eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'amianai',
    user: 'amianai_admin',
    password: credentials.password,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📁 Reading migration file:', migrationFile);
    const migrationPath = path.join(__dirname, '..', 'frontend', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running migration...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Show what was added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' 
      AND column_name IN ('participants', 'state', 'metadata', 'settings', 'history', 'deleted_at')
    `);
    
    console.log('\n📊 New columns added:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main execution
const migrationFile = process.argv[2] || '002-flexible-schema-simple.sql';

if (migrationFile === '--help' || migrationFile === '-h') {
  console.log('Usage: ./run-migration.js [migration-file]');
  console.log('Default: 002-flexible-schema-simple.sql');
  process.exit(0);
}

console.log('🗄️  AmIAnAI Database Migration Tool');
console.log('================================');

runMigration(migrationFile).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});