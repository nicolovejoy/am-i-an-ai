// Database schema types for type-safe database operations

export interface DatabaseUser {
  id: string;
  email: string;
  display_name?: string;
  avatar?: string;
  role: string;
  subscription: string;
  subscription_expires_at?: Date;
  preferences: object; // JSON
  current_usage: object; // JSON
  limits: object; // JSON
  is_email_verified: boolean;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DatabasePersona {
  id: string;
  name: string;
  type: string;
  owner_id?: string;
  description: string;
  personality: object; // JSON
  knowledge: string[]; // Array
  communication_style: string;
  model_config?: object; // JSON
  system_prompt?: string;
  response_time_range?: object; // JSON
  typing_speed?: number;
  is_public: boolean;
  allowed_interactions: string[]; // Array
  conversation_count: number;
  total_messages: number;
  average_rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseConversation {
  id: string;
  title: string;
  topic: string;
  description?: string;
  constraints: object; // JSON
  goal?: object; // JSON
  status: string;
  current_turn: number;
  message_count: number;
  created_at: Date;
  started_at?: Date;
  ended_at?: Date;
  paused_at?: Date;
  resumed_at?: Date;
  created_by: string;
  total_characters: number;
  average_response_time: number;
  topic_tags: string[]; // Array
  quality_score?: number;
}

export interface DatabaseConversationParticipant {
  conversation_id: string;
  persona_id: string;
  role: string;
  is_revealed: boolean;
  joined_at: Date;
  last_active_at: Date;
}

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  author_persona_id: string;
  content: string;
  type: string;
  timestamp: Date;
  sequence_number: number;
  is_edited: boolean;
  edited_at?: Date;
  original_content?: string;
  reply_to_message_id?: string;
  thread_id?: string;
  metadata: object; // JSON
  moderation_status: string;
  moderation_flags?: object[]; // JSON Array
  is_visible: boolean;
  is_archived: boolean;
  reactions?: object; // JSON
  quality_rating?: number;
}

export interface DatabasePersonaReveal {
  id: string;
  conversation_id: string;
  persona_id: string;
  revealed_at: Date;
  revealed_by: string;
  reveal_type: string;
  reveal_context?: string;
}

export interface DatabasePersonaInteraction {
  id: string;
  persona1_id: string;
  persona2_id: string;
  conversation_count: number;
  last_interaction_at: Date;
  compatibility_score?: number;
  created_at: Date;
}

export interface DatabaseConversationAnalytics {
  id: string;
  conversation_id: string;
  total_messages: number;
  total_characters: number;
  average_message_length: number;
  longest_message: number;
  shortest_message: number;
  response_time_stats: object; // JSON
  participant_stats: object; // JSON
  topic_progression: string[]; // Array
  sentiment_over_time: object[]; // JSON Array
  engagement_score: number;
  quality_score: number;
  analyzed_at: Date;
}

export interface DatabaseUserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: object; // JSON
  is_read: boolean;
  created_at: Date;
  expires_at?: Date;
}

export interface DatabaseUserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: Date;
}

export interface DatabaseAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  rarity: string;
  created_at: Date;
}

export interface DatabaseUserActivity {
  id: string;
  user_id: string;
  type: string;
  details: object; // JSON
  timestamp: Date;
}

export interface DatabaseMessageDraft {
  id: string;
  conversation_id: string;
  author_persona_id: string;
  content: string;
  last_updated: Date;
  version: number;
}

export interface DatabaseUserSession {
  id: string;
  user_id: string;
  active_persona_id?: string;
  active_conversation_id?: string;
  last_activity_at: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Query builder types for type-safe database queries
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, any>;
}

export interface JoinOptions {
  table: string;
  on: string;
  type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

export interface DatabaseQuery<T> {
  select(columns?: (keyof T)[]): DatabaseQuery<T>;
  where(conditions: Partial<T>): DatabaseQuery<T>;
  whereIn<K extends keyof T>(column: K, values: T[K][]): DatabaseQuery<T>;
  whereNotNull<K extends keyof T>(column: K): DatabaseQuery<T>;
  orderBy<K extends keyof T>(column: K, direction?: 'ASC' | 'DESC'): DatabaseQuery<T>;
  limit(count: number): DatabaseQuery<T>;
  offset(count: number): DatabaseQuery<T>;
  join(options: JoinOptions): DatabaseQuery<T>;
  execute(): Promise<T[]>;
  first(): Promise<T | null>;
  count(): Promise<number>;
}

// Database repository interfaces
export interface UserRepository {
  findById(id: string): Promise<DatabaseUser | null>;
  findByEmail(email: string): Promise<DatabaseUser | null>;
  create(user: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser>;
  update(id: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser>;
  delete(id: string): Promise<boolean>;
  findMany(options?: QueryOptions): Promise<DatabaseUser[]>;
}

export interface PersonaRepository {
  findById(id: string): Promise<DatabasePersona | null>;
  findByOwner(ownerId: string): Promise<DatabasePersona[]>;
  findPublic(options?: QueryOptions): Promise<DatabasePersona[]>;
  create(persona: Omit<DatabasePersona, 'id' | 'created_at' | 'updated_at'>): Promise<DatabasePersona>;
  update(id: string, updates: Partial<DatabasePersona>): Promise<DatabasePersona>;
  delete(id: string): Promise<boolean>;
  search(query: string, filters?: Record<string, any>): Promise<DatabasePersona[]>;
}

export interface ConversationRepository {
  findById(id: string): Promise<DatabaseConversation | null>;
  findByUser(userId: string, status?: string): Promise<DatabaseConversation[]>;
  findByPersona(personaId: string): Promise<DatabaseConversation[]>;
  create(conversation: Omit<DatabaseConversation, 'id' | 'created_at'>): Promise<DatabaseConversation>;
  update(id: string, updates: Partial<DatabaseConversation>): Promise<DatabaseConversation>;
  delete(id: string): Promise<boolean>;
  getParticipants(conversationId: string): Promise<DatabaseConversationParticipant[]>;
  addParticipant(participant: DatabaseConversationParticipant): Promise<DatabaseConversationParticipant>;
  updateParticipant(conversationId: string, personaId: string, updates: Partial<DatabaseConversationParticipant>): Promise<DatabaseConversationParticipant>;
}

export interface MessageRepository {
  findById(id: string): Promise<DatabaseMessage | null>;
  findByConversation(conversationId: string, options?: QueryOptions): Promise<DatabaseMessage[]>;
  create(message: Omit<DatabaseMessage, 'id' | 'timestamp'>): Promise<DatabaseMessage>;
  update(id: string, updates: Partial<DatabaseMessage>): Promise<DatabaseMessage>;
  delete(id: string): Promise<boolean>;
  search(criteria: Record<string, any>): Promise<DatabaseMessage[]>;
  getLatest(conversationId: string, count: number): Promise<DatabaseMessage[]>;
}

// Database connection and transaction types
export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }>;
  transaction<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DatabaseTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string }>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Migration types
export interface DatabaseMigration {
  version: string;
  description: string;
  up: (connection: DatabaseConnection) => Promise<void>;
  down: (connection: DatabaseConnection) => Promise<void>;
}

export interface MigrationRunner {
  run(): Promise<void>;
  rollback(version?: string): Promise<void>;
  status(): Promise<{ version: string; appliedAt: Date }[]>;
}