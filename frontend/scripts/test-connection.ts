async function testMain() {
  try {
    console.log('🔌 Testing database connection...');
    
    const { getDatabase } = await import('../src/lib/database');
    const db = await getDatabase();
    
    // Simple connectivity test
    const result = await db.queryOne('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    const timeResult = result as any;
    console.log('⏰ Current time:', timeResult?.current_time);
    
    // Check if tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    for (const table of tables) {
      const tableObj = table as any;
      console.log(`  - ${tableObj.table_name}`);
    }
    
    // Quick row counts
    console.log('\n📊 Row counts:');
    const userCount = await db.queryOne('SELECT COUNT(*) as count FROM users');
    const personaCount = await db.queryOne('SELECT COUNT(*) as count FROM personas');
    const convCount = await db.queryOne('SELECT COUNT(*) as count FROM conversations');
    const msgCount = await db.queryOne('SELECT COUNT(*) as count FROM messages');
    
    const userResult = userCount as any;
    const personaResult = personaCount as any;
    const convResult = convCount as any;
    const msgResult = msgCount as any;
    
    console.log(`  Users: ${userResult?.count || 0}`);
    console.log(`  Personas: ${personaResult?.count || 0}`);
    console.log(`  Conversations: ${convResult?.count || 0}`);
    console.log(`  Messages: ${msgResult?.count || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testMain();