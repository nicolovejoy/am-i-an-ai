async function main() {
  try {
    console.log('🔌 Testing database connection...');
    
    const { getDatabase } = await import('../src/lib/database');
    const db = await getDatabase();
    
    // Simple connectivity test
    const result = await db.queryOne('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Current time:', result?.current_time);
    
    // Check if tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    for (const table of tables) {
      console.log(`  - ${table.table_name}`);
    }
    
    // Quick row counts
    console.log('\n📊 Row counts:');
    const userCount = await db.queryOne('SELECT COUNT(*) as count FROM users');
    const personaCount = await db.queryOne('SELECT COUNT(*) as count FROM personas');
    const convCount = await db.queryOne('SELECT COUNT(*) as count FROM conversations');
    const msgCount = await db.queryOne('SELECT COUNT(*) as count FROM messages');
    
    console.log(`  Users: ${userCount?.count || 0}`);
    console.log(`  Personas: ${personaCount?.count || 0}`);
    console.log(`  Conversations: ${convCount?.count || 0}`);
    console.log(`  Messages: ${msgCount?.count || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

main();