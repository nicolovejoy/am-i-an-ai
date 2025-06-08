#!/usr/bin/env ts-node
/* eslint-disable no-console, no-undef */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function seedMain() {
  try {
    console.log('🌱 Seeding database with sample data...');
    console.log('Using database:', process.env.DB_HOST);
    
    const { seedDatabase } = await import('../src/lib/seedData');
    await seedDatabase();
    
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seedMain();