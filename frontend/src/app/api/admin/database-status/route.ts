import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';

export async function GET() {
  try {
    const db = await getDatabase();

    // Check if tables exist and get counts
    const results = await Promise.allSettled([
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM personas'),
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM conversations'),
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM messages'),
    ]);

    const [usersResult, personasResult, conversationsResult, messagesResult] = results;

    const status = {
      connected: true,
      tables: {
        users: usersResult.status === 'fulfilled' ? parseInt(usersResult.value?.count || '0') : 0,
        personas: personasResult.status === 'fulfilled' ? parseInt(personasResult.value?.count || '0') : 0,
        conversations: conversationsResult.status === 'fulfilled' ? parseInt(conversationsResult.value?.count || '0') : 0,
        messages: messagesResult.status === 'fulfilled' ? parseInt(messagesResult.value?.count || '0') : 0,
      },
      tablesExist: results.every(r => r.status === 'fulfilled'),
      hasData: results.some(r => r.status === 'fulfilled' && parseInt(r.value?.count || '0') > 0),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('❌ Database status check failed:', error);
    return NextResponse.json(
      { 
        connected: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}