#!/usr/bin/env ts-node

async function seedMain() {
  try {
    const { seedDatabase } = await import('../src/lib/seedData');
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
}

seedMain();