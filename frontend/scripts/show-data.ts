async function showMain() {
  try {
    const { getDatabase } = await import('../src/lib/database');
    const db = await getDatabase();
    
    console.log('🔍 Checking seeded data...\n');
    
    // Check users
    const users = await db.query('SELECT id, email, display_name, subscription FROM users ORDER BY created_at');
    console.log('👥 USERS:');
    for (let i = 0; i < users.length; i++) {
      const user = users[i] as any;
      console.log(`  ${i + 1}. ${user.display_name} (${user.email}) - ${user.subscription}`);
    }
    
    // Check personas
    const personas = await db.query('SELECT id, name, type, description FROM personas ORDER BY created_at');
    console.log('\n🎭 PERSONAS:');
    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i] as any;
      console.log(`  ${i + 1}. ${persona.name} (${persona.type})`);
      console.log(`     ${persona.description.substring(0, 80)}...`);
    }
    
    // Check conversations
    const conversations = await db.query('SELECT id, title, topic, status FROM conversations ORDER BY created_at');
    console.log('\n💬 CONVERSATIONS:');
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i] as any;
      console.log(`  ${i + 1}. ${conv.title} (${conv.status})`);
      console.log(`     Topic: ${conv.topic}`);
    }
    
    // Check messages count
    const messageCount = await db.queryOne('SELECT COUNT(*) as count FROM messages');
    console.log(`\n📨 MESSAGES: ${(messageCount as any)?.count || 0} total messages created`);
    
    // Show a sample message
    const sampleMessage = await db.queryOne(`
      SELECT m.content, p.name as author 
      FROM messages m 
      JOIN personas p ON m.author_persona_id = p.id 
      ORDER BY m.timestamp 
      LIMIT 1
    `);
    
    if (sampleMessage) {
      const msg = sampleMessage as any;
      console.log('\n📝 SAMPLE MESSAGE:');
      console.log(`   From: ${msg.author}`);
      console.log(`   "${msg.content.substring(0, 100)}..."`);
    }
    
    console.log('\n✅ Database seeding verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking data:', error);
    process.exit(1);
  }
}

showMain();