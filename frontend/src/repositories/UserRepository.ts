import { 
  DatabaseUser, 
  UserRepository as IUserRepository, 
  QueryOptions 
} from '../types/database';
import { User, UserCreate, UserUpdate } from '../types/users';
import { getDatabase, table } from '../lib/database';

export class UserRepository implements IUserRepository {
  private tableName = 'users';

  async findById(id: string): Promise<DatabaseUser | null> {
    return await table<DatabaseUser>(this.tableName)
      .where('id = $1', id)
      .first();
  }

  async findByEmail(email: string): Promise<DatabaseUser | null> {
    return await table<DatabaseUser>(this.tableName)
      .where('email = $1', email)
      .first();
  }

  async create(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser> {
    const db = await getDatabase();
    
    const result = await db.queryOne<DatabaseUser>(`
      INSERT INTO ${this.tableName} (
        email, display_name, avatar, role, subscription, subscription_expires_at,
        preferences, current_usage, limits, is_email_verified, is_active, last_login_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      userData.email,
      userData.display_name,
      userData.avatar,
      userData.role,
      userData.subscription,
      userData.subscription_expires_at,
      userData.preferences,
      userData.current_usage,
      userData.limits,
      userData.is_email_verified,
      userData.is_active,
      userData.last_login_at,
    ]);

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }

  async update(id: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser> {
    const db = await getDatabase();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    values.push(id); // Add ID as the last parameter

    const sql = `
      UPDATE ${this.tableName} 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.queryOne<DatabaseUser>(sql, values);
    
    if (!result) {
      throw new Error('User not found or update failed');
    }

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    
    const result = await db.execute(`
      DELETE FROM ${this.tableName} WHERE id = $1
    `, [id]);

    return result.affectedRows > 0;
  }

  async findMany(options: QueryOptions = {}): Promise<DatabaseUser[]> {
    let query = table<DatabaseUser>(this.tableName);

    // Apply where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.where(`${key} = $${query['whereParams'].length + 1}`, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'ASC');
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query.execute();
  }

  // Additional utility methods
  async findActiveUsers(): Promise<DatabaseUser[]> {
    return await table<DatabaseUser>(this.tableName)
      .where('is_active = $1', true)
      .orderBy('last_login_at', 'DESC')
      .execute();
  }

  async findBySubscription(subscription: string): Promise<DatabaseUser[]> {
    return await table<DatabaseUser>(this.tableName)
      .where('subscription = $1', subscription)
      .where('is_active = $2', true)
      .orderBy('created_at', 'DESC')
      .execute();
  }

  async updateLastLogin(id: string): Promise<void> {
    const db = await getDatabase();
    await db.execute(`
      UPDATE ${this.tableName} 
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);
  }

  async incrementUsage(id: string, usageType: 'messages' | 'conversations' | 'personas'): Promise<void> {
    const db = await getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET 
        current_usage = jsonb_set(
          current_usage, 
          '{${usageType}Count}', 
          (COALESCE(current_usage->>'${usageType}Count', '0')::int + 1)::text::jsonb
        ),
        updated_at = NOW()
      WHERE id = $1
    `, [id]);
  }

  async resetMonthlyUsage(): Promise<void> {
    const db = await getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET 
        current_usage = jsonb_set(
          jsonb_set(
            current_usage, 
            '{monthlyMessageCount}', 
            '0'::jsonb
          ),
          '{activeConversationCount}', 
          '0'::jsonb
        ),
        updated_at = NOW()
      WHERE subscription != 'enterprise'
    `);
  }
}

// Domain model conversion utilities
export class UserMapper {
  static toDomain(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.display_name || undefined,
      avatar: dbUser.avatar || undefined,
      role: dbUser.role as User['role'],
      subscription: dbUser.subscription as User['subscription'],
      subscriptionExpiresAt: dbUser.subscription_expires_at || undefined,
      preferences: dbUser.preferences as User['preferences'],
      currentUsage: dbUser.current_usage as User['currentUsage'],
      limits: dbUser.limits as User['limits'],
      isEmailVerified: dbUser.is_email_verified,
      isActive: dbUser.is_active,
      lastLoginAt: dbUser.last_login_at || undefined,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  static toDatabase(user: UserCreate): Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'> {
    return {
      email: user.email,
      display_name: user.displayName || undefined,
      avatar: undefined,
      role: 'user',
      subscription: user.subscription || 'free',
      subscription_expires_at: undefined,
      preferences: user.preferences || {},
      current_usage: {
        personaCount: 0,
        activeConversationCount: 0,
        monthlyMessageCount: 0,
        aiAgentCount: 0,
      },
      limits: {
        maxPersonas: 3,
        maxActiveConversations: 2,
        maxMonthlyMessages: 100,
        maxAIAgents: 0,
        canCreateAmbiguousPersonas: false,
        canAccessAnalytics: false,
        prioritySupport: false,
      },
      is_email_verified: false,
      is_active: true,
      last_login_at: undefined,
    };
  }

  static updateToDatabase(updates: UserUpdate): Partial<DatabaseUser> {
    const dbUpdates: Partial<DatabaseUser> = {};
    
    if (updates.displayName !== undefined) {
      dbUpdates.display_name = updates.displayName;
    }
    
    if (updates.avatar !== undefined) {
      dbUpdates.avatar = updates.avatar;
    }
    
    if (updates.preferences !== undefined) {
      dbUpdates.preferences = updates.preferences;
    }

    return dbUpdates;
  }
}

// Service class that combines repository with domain logic
export class UserService {
  constructor(private userRepo: UserRepository = new UserRepository()) {}

  async createUser(userData: UserCreate): Promise<User> {
    const dbUser = UserMapper.toDatabase(userData);
    const createdUser = await this.userRepo.create(dbUser);
    return UserMapper.toDomain(createdUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const dbUser = await this.userRepo.findById(id);
    return dbUser ? UserMapper.toDomain(dbUser) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const dbUser = await this.userRepo.findByEmail(email);
    return dbUser ? UserMapper.toDomain(dbUser) : null;
  }

  async updateUser(id: string, updates: UserUpdate): Promise<User> {
    const dbUpdates = UserMapper.updateToDatabase(updates);
    const updatedUser = await this.userRepo.update(id, dbUpdates);
    return UserMapper.toDomain(updatedUser);
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.userRepo.delete(id);
  }

  async checkUserLimits(id: string): Promise<{ canCreatePersona: boolean; canStartConversation: boolean; canSendMessage: boolean }> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      canCreatePersona: user.currentUsage.personaCount < user.limits.maxPersonas,
      canStartConversation: user.currentUsage.activeConversationCount < user.limits.maxActiveConversations,
      canSendMessage: user.currentUsage.monthlyMessageCount < user.limits.maxMonthlyMessages,
    };
  }

  async trackUserActivity(userId: string, activityType: string, details: Record<string, unknown>): Promise<void> {
    // This would integrate with the UserActivity repository when created
    // eslint-disable-next-line no-console -- Debug logging is acceptable
    console.log(`User ${userId} performed ${activityType}:`, details);
  }
}