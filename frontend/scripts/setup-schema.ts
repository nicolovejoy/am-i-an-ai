#!/usr/bin/env ts-node

async function schemaMain() {
  try {
    const { createSchema } = await import('../src/lib/schema');
    await createSchema();
    process.exit(0);
  } catch (error) {
    console.error('Schema setup failed:', error);
    process.exit(1);
  }
}

schemaMain();