#!/usr/bin/env ts-node
/* eslint-disable no-console, no-undef */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function schemaMain() {
  try {
    console.log('🔧 Creating fresh database schema...');
    console.log('Using database:', process.env.DB_HOST);
    
    const { createSchema } = await import('../src/lib/schema');
    await createSchema();
    
    console.log('✅ Database schema created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    process.exit(1);
  }
}

schemaMain();