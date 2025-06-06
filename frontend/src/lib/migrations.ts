import { DatabaseConnection, DatabaseMigration } from '../types/database';
import { getDatabase } from './database';

export class MigrationRunner {
  private db: DatabaseConnection;

  constructor(db?: DatabaseConnection) {
    this.db = db || getDatabase();
  }

  async run(): Promise<void> {
    // Ensure migrations table exists
    await this.createMigrationsTable();

    // Get all migrations
    const migrations = this.getMigrations();
    
    // Get applied migrations
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    // Run pending migrations
    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        // eslint-disable-next-line no-console -- Migration logging is acceptable
        console.log(`Running migration: ${migration.version} - ${migration.description}`);
        
        await this.db.transaction(async (trx) => {
          await migration.up(this.db);
          await trx.execute(
            'INSERT INTO migrations (version, description, applied_at) VALUES ($1, $2, NOW())',
            [migration.version, migration.description]
          );
        });
        
        // eslint-disable-next-line no-console -- Migration logging is acceptable
        console.log(`Completed migration: ${migration.version}`);
      }
    }
  }

  async rollback(version?: string): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    const migrations = this.getMigrations();
    
    // If no version specified, rollback the latest
    const targetVersion = version || appliedMigrations[appliedMigrations.length - 1]?.version;
    
    if (!targetVersion) {
      // eslint-disable-next-line no-console -- Migration logging is acceptable
      console.log('No migrations to rollback');
      return;
    }

    // Find migrations to rollback (in reverse order)
    const migrationsToRollback = appliedMigrations
      .reverse()
      .filter(applied => !version || applied.version >= targetVersion);

    for (const appliedMigration of migrationsToRollback) {
      const migration = migrations.find(m => m.version === appliedMigration.version);
      
      if (migration) {
        // eslint-disable-next-line no-console -- Migration logging is acceptable
        console.log(`Rolling back migration: ${migration.version} - ${migration.description}`);
        
        await this.db.transaction(async (trx) => {
          await migration.down(this.db);
          await trx.execute(
            'DELETE FROM migrations WHERE version = $1',
            [migration.version]
          );
        });
        
        // eslint-disable-next-line no-console -- Migration logging is acceptable
        console.log(`Completed rollback: ${migration.version}`);
      }
    }
  }

  async status(): Promise<{ version: string; appliedAt: Date }[]> {
    return await this.getAppliedMigrations();
  }

  private async createMigrationsTable(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  private async getAppliedMigrations(): Promise<{ version: string; appliedAt: Date }[]> {
    const results = await this.db.query<{ version: string; applied_at: Date }>(
      'SELECT version, applied_at FROM migrations ORDER BY applied_at ASC'
    );
    
    return results.map(row => ({
      version: row.version,
      appliedAt: row.applied_at,
    }));
  }

  private getMigrations(): DatabaseMigration[] {
    return [
      // Initial schema migration
      {
        version: '001_initial_schema',
        description: 'Create initial schema for users, personas, conversations, and messages',
        up: async (db: DatabaseConnection) => {
          // Users table
          await db.execute(`
            CREATE TABLE users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              email VARCHAR(255) NOT NULL UNIQUE,
              display_name VARCHAR(255),
              avatar TEXT,
              role VARCHAR(50) NOT NULL DEFAULT 'user',
              subscription VARCHAR(50) NOT NULL DEFAULT 'free',
              subscription_expires_at TIMESTAMP,
              preferences JSONB NOT NULL DEFAULT '{}',
              current_usage JSONB NOT NULL DEFAULT '{}',
              limits JSONB NOT NULL DEFAULT '{}',
              is_email_verified BOOLEAN NOT NULL DEFAULT false,
              is_active BOOLEAN NOT NULL DEFAULT true,
              last_login_at TIMESTAMP,
              created_at TIMESTAMP NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);

          // Personas table
          await db.execute(`
            CREATE TABLE personas (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255) NOT NULL,
              type VARCHAR(50) NOT NULL,
              owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
              description TEXT NOT NULL,
              personality JSONB NOT NULL DEFAULT '{}',
              knowledge TEXT[] NOT NULL DEFAULT '{}',
              communication_style VARCHAR(50) NOT NULL,
              model_config JSONB,
              system_prompt TEXT,
              response_time_range JSONB,
              typing_speed INTEGER,
              is_public BOOLEAN NOT NULL DEFAULT false,
              allowed_interactions TEXT[] NOT NULL DEFAULT '{}',
              conversation_count INTEGER NOT NULL DEFAULT 0,
              total_messages INTEGER NOT NULL DEFAULT 0,
              average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
              created_at TIMESTAMP NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);

          // Conversations table
          await db.execute(`
            CREATE TABLE conversations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              title VARCHAR(255) NOT NULL,
              topic VARCHAR(255) NOT NULL,
              description TEXT,
              constraints JSONB NOT NULL DEFAULT '{}',
              goal JSONB,
              status VARCHAR(50) NOT NULL DEFAULT 'active',
              current_turn INTEGER NOT NULL DEFAULT 0,
              message_count INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT NOW(),
              started_at TIMESTAMP,
              ended_at TIMESTAMP,
              paused_at TIMESTAMP,
              resumed_at TIMESTAMP,
              created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              total_characters INTEGER NOT NULL DEFAULT 0,
              average_response_time INTEGER NOT NULL DEFAULT 0,
              topic_tags TEXT[] NOT NULL DEFAULT '{}',
              quality_score DECIMAL(3,2)
            )
          `);

          // Conversation participants table
          await db.execute(`
            CREATE TABLE conversation_participants (
              conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
              persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
              role VARCHAR(50) NOT NULL,
              is_revealed BOOLEAN NOT NULL DEFAULT false,
              joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
              last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
              PRIMARY KEY (conversation_id, persona_id)
            )
          `);

          // Messages table
          await db.execute(`
            CREATE TABLE messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
              author_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
              content TEXT NOT NULL,
              type VARCHAR(50) NOT NULL DEFAULT 'text',
              timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
              sequence_number INTEGER NOT NULL,
              is_edited BOOLEAN NOT NULL DEFAULT false,
              edited_at TIMESTAMP,
              original_content TEXT,
              reply_to_message_id UUID REFERENCES messages(id),
              thread_id UUID,
              metadata JSONB NOT NULL DEFAULT '{}',
              moderation_status VARCHAR(50) NOT NULL DEFAULT 'approved',
              moderation_flags JSONB[] DEFAULT '{}',
              is_visible BOOLEAN NOT NULL DEFAULT true,
              is_archived BOOLEAN NOT NULL DEFAULT false,
              reactions JSONB DEFAULT '{}',
              quality_rating DECIMAL(3,2)
            )
          `);
        },
        down: async (db: DatabaseConnection) => {
          await db.execute('DROP TABLE IF EXISTS messages CASCADE');
          await db.execute('DROP TABLE IF EXISTS conversation_participants CASCADE');
          await db.execute('DROP TABLE IF EXISTS conversations CASCADE');
          await db.execute('DROP TABLE IF EXISTS personas CASCADE');
          await db.execute('DROP TABLE IF EXISTS users CASCADE');
        },
      },

      // Indexes migration
      {
        version: '002_add_indexes',
        description: 'Add indexes for performance optimization',
        up: async (db: DatabaseConnection) => {
          // User indexes
          await db.execute('CREATE INDEX idx_users_email ON users(email)');
          await db.execute('CREATE INDEX idx_users_subscription ON users(subscription)');
          await db.execute('CREATE INDEX idx_users_active ON users(is_active)');

          // Persona indexes
          await db.execute('CREATE INDEX idx_personas_owner ON personas(owner_id)');
          await db.execute('CREATE INDEX idx_personas_type ON personas(type)');
          await db.execute('CREATE INDEX idx_personas_public ON personas(is_public)');
          await db.execute('CREATE INDEX idx_personas_knowledge ON personas USING GIN(knowledge)');

          // Conversation indexes
          await db.execute('CREATE INDEX idx_conversations_status ON conversations(status)');
          await db.execute('CREATE INDEX idx_conversations_created_by ON conversations(created_by)');
          await db.execute('CREATE INDEX idx_conversations_created_at ON conversations(created_at)');

          // Message indexes
          await db.execute('CREATE INDEX idx_messages_conversation ON messages(conversation_id)');
          await db.execute('CREATE INDEX idx_messages_author ON messages(author_persona_id)');
          await db.execute('CREATE INDEX idx_messages_timestamp ON messages(timestamp)');
          await db.execute('CREATE INDEX idx_messages_sequence ON messages(conversation_id, sequence_number)');
          
          // Full-text search on message content
          await db.execute('CREATE INDEX idx_messages_content_search ON messages USING GIN(to_tsvector(\'english\', content))');
        },
        down: async (db: DatabaseConnection) => {
          await db.execute('DROP INDEX IF EXISTS idx_messages_content_search');
          await db.execute('DROP INDEX IF EXISTS idx_messages_sequence');
          await db.execute('DROP INDEX IF EXISTS idx_messages_timestamp');
          await db.execute('DROP INDEX IF EXISTS idx_messages_author');
          await db.execute('DROP INDEX IF EXISTS idx_messages_conversation');
          await db.execute('DROP INDEX IF EXISTS idx_conversations_created_at');
          await db.execute('DROP INDEX IF EXISTS idx_conversations_created_by');
          await db.execute('DROP INDEX IF EXISTS idx_conversations_status');
          await db.execute('DROP INDEX IF EXISTS idx_personas_knowledge');
          await db.execute('DROP INDEX IF EXISTS idx_personas_public');
          await db.execute('DROP INDEX IF EXISTS idx_personas_type');
          await db.execute('DROP INDEX IF EXISTS idx_personas_owner');
          await db.execute('DROP INDEX IF EXISTS idx_users_active');
          await db.execute('DROP INDEX IF EXISTS idx_users_subscription');
          await db.execute('DROP INDEX IF EXISTS idx_users_email');
        },
      },

      // Analytics tables migration
      {
        version: '003_analytics_tables',
        description: 'Add analytics and tracking tables',
        up: async (db: DatabaseConnection) => {
          // Persona reveals table
          await db.execute(`
            CREATE TABLE persona_reveals (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
              persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
              revealed_at TIMESTAMP NOT NULL DEFAULT NOW(),
              revealed_by VARCHAR(50) NOT NULL,
              reveal_type VARCHAR(50) NOT NULL,
              reveal_context TEXT
            )
          `);

          // Persona interactions table
          await db.execute(`
            CREATE TABLE persona_interactions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              persona1_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
              persona2_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
              conversation_count INTEGER NOT NULL DEFAULT 0,
              last_interaction_at TIMESTAMP NOT NULL DEFAULT NOW(),
              compatibility_score DECIMAL(3,2),
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);

          // Conversation analytics table
          await db.execute(`
            CREATE TABLE conversation_analytics (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
              total_messages INTEGER NOT NULL,
              total_characters INTEGER NOT NULL,
              average_message_length DECIMAL(8,2) NOT NULL,
              longest_message INTEGER NOT NULL,
              shortest_message INTEGER NOT NULL,
              response_time_stats JSONB NOT NULL DEFAULT '{}',
              participant_stats JSONB NOT NULL DEFAULT '{}',
              topic_progression TEXT[] NOT NULL DEFAULT '{}',
              sentiment_over_time JSONB[] NOT NULL DEFAULT '{}',
              engagement_score DECIMAL(3,2) NOT NULL,
              quality_score DECIMAL(3,2) NOT NULL,
              analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);

          // User notifications table
          await db.execute(`
            CREATE TABLE user_notifications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              type VARCHAR(100) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              data JSONB DEFAULT '{}',
              is_read BOOLEAN NOT NULL DEFAULT false,
              created_at TIMESTAMP NOT NULL DEFAULT NOW(),
              expires_at TIMESTAMP
            )
          `);

          // User activities table
          await db.execute(`
            CREATE TABLE user_activities (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              type VARCHAR(100) NOT NULL,
              details JSONB NOT NULL DEFAULT '{}',
              timestamp TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);
        },
        down: async (db: DatabaseConnection) => {
          await db.execute('DROP TABLE IF EXISTS user_activities CASCADE');
          await db.execute('DROP TABLE IF EXISTS user_notifications CASCADE');
          await db.execute('DROP TABLE IF EXISTS conversation_analytics CASCADE');
          await db.execute('DROP TABLE IF EXISTS persona_interactions CASCADE');
          await db.execute('DROP TABLE IF EXISTS persona_reveals CASCADE');
        },
      },
    ];
  }
}

// CLI utility functions for running migrations
export const runMigrations = async (): Promise<void> => {
  const runner = new MigrationRunner();
  await runner.run();
};

export const rollbackMigration = async (version?: string): Promise<void> => {
  const runner = new MigrationRunner();
  await runner.rollback(version);
};

export const getMigrationStatus = async (): Promise<{ version: string; appliedAt: Date }[]> => {
  const runner = new MigrationRunner();
  return await runner.status();
};