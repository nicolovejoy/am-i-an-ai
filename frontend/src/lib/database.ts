import { Pool, PoolClient, QueryResult } from 'pg';
import { DatabaseConnection, DatabaseTransaction } from '../types/database';

class PostgreSQLConnection implements DatabaseConnection {
  private pool: Pool;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  }) {
    this.pool = new Pool({
      ...config,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result: QueryResult = await client.query(sql, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId?: string }> {
    const client = await this.pool.connect();
    try {
      const result: QueryResult = await client.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id,
      };
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const transaction = new PostgreSQLTransaction(client);
      const result = await callback(transaction);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PostgreSQLTransaction implements DatabaseTransaction {
  constructor(private client: PoolClient) {}

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const result: QueryResult = await this.client.query(sql, params);
    return result.rows as T[];
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId?: string }> {
    const result: QueryResult = await this.client.query(sql, params);
    return {
      affectedRows: result.rowCount || 0,
      insertId: result.rows[0]?.id,
    };
  }

  async commit(): Promise<void> {
    await this.client.query('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.client.query('ROLLBACK');
  }
}

// Database configuration
export const createDatabaseConnection = (): DatabaseConnection => {
  // eslint-disable-next-line no-undef -- process is available in Node.js environment
  const config = {
    // eslint-disable-next-line no-undef -- process is available in Node.js environment
    host: process.env.DB_HOST || 'localhost',
    // eslint-disable-next-line no-undef -- process is available in Node.js environment
    port: parseInt(process.env.DB_PORT || '5432'),
    // eslint-disable-next-line no-undef -- process is available in Node.js environment
    database: process.env.DB_NAME || 'amianai_dev',
    // eslint-disable-next-line no-undef -- process is available in Node.js environment
    user: process.env.DB_USER || 'postgres',
    // eslint-disable-next-line no-undef -- process is available in Node.js environment
    password: process.env.DB_PASSWORD || '',
    // eslint-disable-next-line no-undef -- process is available in Node.js environment
    ssl: process.env.NODE_ENV === 'production',
  };

  return new PostgreSQLConnection(config);
};

// Singleton instance
let dbInstance: DatabaseConnection | null = null;

export const getDatabase = (): DatabaseConnection => {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection();
  }
  return dbInstance;
};

// Query builder utility
export class QueryBuilder<T> {
  private tableName: string;
  private selectColumns: string[] = ['*'];
  private whereConditions: string[] = [];
  private whereParams: unknown[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';
  private joinClauses: string[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string[] = ['*']): QueryBuilder<T> {
    this.selectColumns = columns;
    return this;
  }

  where(condition: string, value?: unknown): QueryBuilder<T> {
    this.whereConditions.push(condition);
    if (value !== undefined) {
      this.whereParams.push(value);
    }
    return this;
  }

  whereIn(column: string, values: unknown[]): QueryBuilder<T> {
    const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  whereNotNull(column: string): QueryBuilder<T> {
    this.whereConditions.push(`${column} IS NOT NULL`);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<T> {
    this.orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  offset(count: number): QueryBuilder<T> {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  join(table: string, condition: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): QueryBuilder<T> {
    this.joinClauses.push(`${type} JOIN ${table} ON ${condition}`);
    return this;
  }

  private buildQuery(): { sql: string; params: unknown[] } {
    let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.tableName}`;
    
    if (this.joinClauses.length > 0) {
      sql += ` ${this.joinClauses.join(' ')}`;
    }
    
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`;
    }
    
    if (this.limitClause) {
      sql += ` ${this.limitClause}`;
    }
    
    if (this.offsetClause) {
      sql += ` ${this.offsetClause}`;
    }

    return { sql, params: this.whereParams };
  }

  async execute(): Promise<T[]> {
    const { sql, params } = this.buildQuery();
    const db = getDatabase();
    return await db.query<T>(sql, params);
  }

  async first(): Promise<T | null> {
    const { sql, params } = this.buildQuery();
    const db = getDatabase();
    return await db.queryOne<T>(sql, params);
  }

  async count(): Promise<number> {
    const originalSelect = this.selectColumns;
    this.selectColumns = ['COUNT(*) as count'];
    
    const { sql, params } = this.buildQuery();
    const db = getDatabase();
    const result = await db.queryOne<{ count: string }>(sql, params);
    
    this.selectColumns = originalSelect;
    return result ? parseInt(result.count) : 0;
  }
}

// Helper function to create query builders
export const table = <T>(tableName: string): QueryBuilder<T> => {
  return new QueryBuilder<T>(tableName);
};