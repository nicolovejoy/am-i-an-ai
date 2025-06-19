#!/usr/bin/env node

// Debug script to check message visibility issues
const { Pool } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:218141621131:secret:eeyore-db-password-IzXuki';

async function getSecret(secretArn) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

async function debugMessages() {
  console.log('🔍 Debugging message visibility issues...\n');
  
  try {
    const credentials = await getSecret(DB_SECRET_ARN);
    const pool = new Pool({
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      user: credentials.username,
      password: credentials.password,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    // Check all messages and their visibility status
    console.log('📋 All messages in database:');
    const allMessages = await client.query(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sequence_number,
        m.is_visible,
        m.is_archived,
        m.moderation_status,
        m.metadata IS NOT NULL as has_metadata,
        SUBSTRING(m.content, 1, 50) as content_preview
      FROM messages m 
      ORDER BY m.conversation_id, m.sequence_number
    `);
    
    allMessages.rows.forEach(row => {
      console.log(`  Message ${row.sequence_number}: visible=${row.is_visible}, archived=${row.is_archived}, moderated=${row.moderation_status}, metadata=${row.has_metadata}`);
      console.log(`    Preview: "${row.content_preview}..."`);
    });
    
    console.log('\n📊 Message counts per conversation:');
    const conversationCounts = await client.query(`
      SELECT 
        c.title,
        c.message_count as stored_count,
        COUNT(m.id) as actual_total,
        COUNT(CASE WHEN m.is_visible = true AND m.is_archived = false AND m.moderation_status = 'approved' THEN 1 END) as visible_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      GROUP BY c.id, c.title, c.message_count
      ORDER BY c.title
    `);
    
    conversationCounts.rows.forEach(row => {
      console.log(`  "${row.title}": stored=${row.stored_count}, total=${row.actual_total}, visible=${row.visible_count}`);
    });
    
    console.log('\n🔗 Message-participant matching:');
    const participantCheck = await client.query(`
      SELECT 
        m.id,
        m.sequence_number,
        m.author_persona_id,
        p.name as persona_name,
        cp.persona_id as participant_persona_id
      FROM messages m
      LEFT JOIN personas p ON m.author_persona_id = p.id
      LEFT JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id AND m.author_persona_id = cp.persona_id
      ORDER BY m.conversation_id, m.sequence_number
    `);
    
    participantCheck.rows.forEach(row => {
      const isParticipant = row.participant_persona_id ? '✅' : '❌';
      console.log(`  Message ${row.sequence_number}: "${row.persona_name}" ${isParticipant}`);
    });
    
    client.release();
    await pool.end();
    console.log('\n✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMessages();