import {
  ConversationWithJSONB,
  ConversationParticipant,
  ConversationState,
  ConversationMetadata,
  ConversationSettings,
  ConversationHistoryEntry
} from '../types/conversations';

// Database interface
export interface DatabaseConnection {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
}

// Query interface for flexible conversation searching
export interface ConversationQuery {
  created_by?: string;
  participant_persona_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
  tags?: string[];
  visibility?: 'public' | 'private' | 'unlisted';
}

// Data transfer objects
export interface ConversationCreate {
  title: string;
  topic: string;
  description?: string;
  created_by: string;
  participants: Partial<ConversationParticipant>[];
  state: Partial<ConversationState>;
  metadata: ConversationMetadata;
  settings: ConversationSettings;
}

export interface ConversationUpdate {
  title?: string;
  topic?: string;
  description?: string;
  state?: Partial<ConversationState>;
  metadata?: ConversationMetadata;
  settings?: ConversationSettings;
}

// Repository interface
export interface ConversationJSONBRepository {
  create(data: ConversationCreate): Promise<ConversationWithJSONB>;
  findById(id: string): Promise<ConversationWithJSONB | null>;
  findByQuery(query: ConversationQuery): Promise<ConversationWithJSONB[]>;
  update(id: string, updates: ConversationUpdate, actor?: string): Promise<ConversationWithJSONB>;
  addParticipant(conversationId: string, participant: ConversationParticipant): Promise<ConversationWithJSONB>;
  removeParticipant(conversationId: string, personaId: string): Promise<ConversationWithJSONB>;
  closeConversation(conversationId: string, closedBy: string, reason?: string): Promise<ConversationWithJSONB>;
  canUserAddMessage(conversationId: string, personaId: string): Promise<boolean>;
  softDelete(conversationId: string): Promise<boolean>;
}

// Implementation
export class ConversationRepositoryImpl implements ConversationJSONBRepository {
  constructor(private db: DatabaseConnection) {}

  async create(data: ConversationCreate): Promise<ConversationWithJSONB> {
    const now = new Date();
    
    // Prepare participants with full structure
    const participants = data.participants.map((p: any) => ({
      persona_id: p.persona_id!,
      role: p.role || 'guest',
      joined_at: p.joined_at || now,
      is_revealed: p.is_revealed || false,
      left_at: null,
      permissions: p.permissions || ['read', 'write'],
      metadata: p.metadata || {}
    }));

    // Prepare state with defaults
    const state: ConversationState = {
      status: 'active',
      can_add_messages: true,
      closed_by: null,
      closed_at: null,
      close_reason: null,
      paused_at: null,
      resumed_at: null,
      restrictions: [],
      ...data.state
    };

    // Create initial history entry
    const initialHistory: ConversationHistoryEntry[] = [{
      timestamp: now,
      action: 'conversation_created',
      actor: {
        id: data.created_by,
        type: 'user',
        name: 'User'
      },
      details: {
        title: data.title,
        topic: data.topic,
        participant_count: participants.length
      }
    }];

    const query = `
      INSERT INTO conversations (
        title, topic, description, created_by, created_at,
        participants, state, metadata, settings, history, schema_version
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11
      ) RETURNING *
    `;

    const params = [
      data.title,
      data.topic,
      data.description || null,
      data.created_by,
      now,
      JSON.stringify(participants),
      JSON.stringify(state),
      JSON.stringify(data.metadata),
      JSON.stringify(data.settings),
      JSON.stringify(initialHistory),
      2 // schema_version
    ];

    const result = await this.db.query(query, params);
    return this.parseConversationRow(result.rows[0]);
  }

  async findById(id: string): Promise<ConversationWithJSONB | null> {
    const query = `
      SELECT * FROM conversations 
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.parseConversationRow(result.rows[0]);
  }

  async findByQuery(query: ConversationQuery): Promise<ConversationWithJSONB[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (query.created_by) {
      conditions.push(`created_by = $${paramCounter}`);
      params.push(query.created_by);
      paramCounter++;
    }

    if (query.participant_persona_id) {
      conditions.push(`participants @> $${paramCounter}::jsonb`);
      params.push(JSON.stringify([{ persona_id: query.participant_persona_id }]));
      paramCounter++;
    }

    if (query.status) {
      conditions.push(`state->>'status' = $${paramCounter}`);
      params.push(query.status);
      paramCounter++;
    }

    if (query.tags && query.tags.length > 0) {
      conditions.push(`metadata->'tags' ?| $${paramCounter}::text[]`);
      params.push(query.tags);
      paramCounter++;
    }

    if (query.visibility) {
      conditions.push(`metadata->>'visibility' = $${paramCounter}`);
      params.push(query.visibility);
      paramCounter++;
    }

    let sql = `
      SELECT * FROM conversations 
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    // Add pagination
    if (query.limit) {
      sql += ` LIMIT $${paramCounter}`;
      params.push(query.limit);
      paramCounter++;
    }

    if (query.offset) {
      sql += ` OFFSET $${paramCounter}`;
      params.push(query.offset);
      paramCounter++;
    }

    const result = await this.db.query(sql, params);
    return result.rows.map(row => this.parseConversationRow(row));
  }

  async update(id: string, updates: ConversationUpdate, actor?: string): Promise<ConversationWithJSONB> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramCounter = 1;

    // Build SET clauses
    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramCounter}`);
      params.push(updates.title);
      paramCounter++;
    }

    if (updates.topic !== undefined) {
      setClauses.push(`topic = $${paramCounter}`);
      params.push(updates.topic);
      paramCounter++;
    }

    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramCounter}`);
      params.push(updates.description);
      paramCounter++;
    }

    if (updates.state) {
      setClauses.push(`state = state || $${paramCounter}::jsonb`);
      params.push(JSON.stringify(updates.state));
      paramCounter++;
    }

    if (updates.metadata) {
      setClauses.push(`metadata = metadata || $${paramCounter}::jsonb`);
      params.push(JSON.stringify(updates.metadata));
      paramCounter++;
    }

    if (updates.settings) {
      setClauses.push(`settings = settings || $${paramCounter}::jsonb`);
      params.push(JSON.stringify(updates.settings));
      paramCounter++;
    }

    // Add history entry if actor provided
    if (actor) {
      const historyEntry: ConversationHistoryEntry = {
        timestamp: new Date(),
        action: 'state_change',
        actor: {
          id: actor,
          type: 'user',
          name: 'User'
        },
        details: { updates: Object.keys(updates) }
      };

      setClauses.push(`history = history || $${paramCounter}::jsonb`);
      params.push(JSON.stringify([historyEntry]));
      paramCounter++;
    }

    const query = `
      UPDATE conversations 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCounter} AND deleted_at IS NULL
      RETURNING *
    `;

    params.push(id);

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Conversation ${id} not found`);
    }

    return this.parseConversationRow(result.rows[0]);
  }

  async addParticipant(conversationId: string, participant: ConversationParticipant): Promise<ConversationWithJSONB> {
    // First check if participant already exists
    const existing = await this.findById(conversationId);
    if (!existing) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (existing.participants.some(p => p.persona_id === participant.persona_id)) {
      return existing; // Already a participant
    }

    const historyEntry: ConversationHistoryEntry = {
      timestamp: new Date(),
      action: 'participant_added',
      actor: {
        id: 'system',
        type: 'system',
        name: 'System'
      },
      details: {
        persona_id: participant.persona_id,
        role: participant.role
      }
    };

    const query = `
      UPDATE conversations 
      SET 
        participants = participants || $2::jsonb,
        history = history || $3::jsonb
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const params = [
      conversationId,
      JSON.stringify([participant]),
      JSON.stringify([historyEntry])
    ];

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return this.parseConversationRow(result.rows[0]);
  }

  async removeParticipant(conversationId: string, personaId: string): Promise<ConversationWithJSONB> {
    const historyEntry: ConversationHistoryEntry = {
      timestamp: new Date(),
      action: 'participant_removed',
      actor: {
        id: 'system',
        type: 'system',
        name: 'System'
      },
      details: { persona_id: personaId }
    };

    const query = `
      UPDATE conversations 
      SET 
        participants = (
          SELECT jsonb_agg(participant)
          FROM jsonb_array_elements(participants) AS participant
          WHERE participant->>'persona_id' != $2
        ),
        history = history || $3::jsonb
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const params = [
      conversationId,
      personaId,
      JSON.stringify([historyEntry])
    ];

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return this.parseConversationRow(result.rows[0]);
  }

  async closeConversation(conversationId: string, closedBy: string, reason?: string): Promise<ConversationWithJSONB> {
    const now = new Date();
    
    const stateUpdate = {
      status: 'closed',
      can_add_messages: false,
      closed_by: closedBy,
      closed_at: now,
      close_reason: reason || null
    };

    const historyEntry: ConversationHistoryEntry = {
      timestamp: now,
      action: 'conversation_closed',
      actor: {
        id: closedBy,
        type: 'user',
        name: 'User'
      },
      details: { reason }
    };

    const query = `
      UPDATE conversations 
      SET 
        state = state || $2::jsonb,
        history = history || $3::jsonb
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const params = [
      conversationId,
      JSON.stringify(stateUpdate),
      JSON.stringify([historyEntry])
    ];

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return this.parseConversationRow(result.rows[0]);
  }

  async canUserAddMessage(conversationId: string, personaId: string): Promise<boolean> {
    const conversation = await this.findById(conversationId);
    
    if (!conversation || !conversation.state.can_add_messages) {
      return false;
    }

    const participant = conversation.participants.find(p => p.persona_id === personaId);
    if (!participant || participant.left_at) {
      return false;
    }

    return participant.permissions.includes('write');
  }

  async softDelete(conversationId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await this.db.query(query, [conversationId]);
    return result.rows.length > 0;
  }

  private parseConversationRow(row: any): ConversationWithJSONB {
    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      description: row.description,
      created_by: row.created_by,
      created_at: new Date(row.created_at),
      
      // Parse JSONB fields
      participants: Array.isArray(row.participants) ? row.participants.map((p: any) => ({
        ...p,
        joined_at: new Date(p.joined_at),
        left_at: p.left_at ? new Date(p.left_at) : null
      })) : [],
      
      state: {
        ...row.state,
        closed_at: row.state.closed_at ? new Date(row.state.closed_at) : null,
        paused_at: row.state.paused_at ? new Date(row.state.paused_at) : null,
        resumed_at: row.state.resumed_at ? new Date(row.state.resumed_at) : null
      },
      
      metadata: row.metadata || {},
      settings: row.settings || {},
      
      history: Array.isArray(row.history) ? row.history.map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp)
      })) : [],
      
      schema_version: row.schema_version || 2,
      deleted_at: row.deleted_at ? new Date(row.deleted_at) : null
    };
  }
}