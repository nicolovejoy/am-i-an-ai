#!/usr/bin/env ts-node
/* eslint-disable no-console, no-undef */

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