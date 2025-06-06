import { 
  DatabasePersona, 
  PersonaRepository as IPersonaRepository, 
  QueryOptions 
} from '../types/database';
import { Persona, PersonaCreate, PersonaUpdate, PersonaType } from '../types/personas';
import { getDatabase, table } from '../lib/database';

export class PersonaRepository implements IPersonaRepository {
  private tableName = 'personas';

  async findById(id: string): Promise<DatabasePersona | null> {
    return await table<DatabasePersona>(this.tableName)
      .where('id = $1', id)
      .first();
  }

  async findByOwner(ownerId: string): Promise<DatabasePersona[]> {
    return await table<DatabasePersona>(this.tableName)
      .where('owner_id = $1', ownerId)
      .orderBy('created_at', 'DESC')
      .execute();
  }

  async findPublic(options: QueryOptions = {}): Promise<DatabasePersona[]> {
    let query = table<DatabasePersona>(this.tableName)
      .where('is_public = $1', true);

    // Apply additional filters
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.where(`${key} = $${query['whereParams'].length + 1}`, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'ASC');
    } else {
      query = query.orderBy('average_rating', 'DESC');
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

  async create(personaData: Omit<DatabasePersona, 'id' | 'created_at' | 'updated_at'>): Promise<DatabasePersona> {
    const db = getDatabase();
    
    const result = await db.queryOne<DatabasePersona>(`
      INSERT INTO ${this.tableName} (
        name, type, owner_id, description, personality, knowledge, communication_style,
        model_config, system_prompt, response_time_range, typing_speed, is_public,
        allowed_interactions, conversation_count, total_messages, average_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      personaData.name,
      personaData.type,
      personaData.owner_id,
      personaData.description,
      personaData.personality,
      personaData.knowledge,
      personaData.communication_style,
      personaData.model_config,
      personaData.system_prompt,
      personaData.response_time_range,
      personaData.typing_speed,
      personaData.is_public,
      personaData.allowed_interactions,
      personaData.conversation_count,
      personaData.total_messages,
      personaData.average_rating,
    ]);

    if (!result) {
      throw new Error('Failed to create persona');
    }

    return result;
  }

  async update(id: string, updates: Partial<DatabasePersona>): Promise<DatabasePersona> {
    const db = getDatabase();
    
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

    const result = await db.queryOne<DatabasePersona>(sql, values);
    
    if (!result) {
      throw new Error('Persona not found or update failed');
    }

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    
    const result = await db.execute(`
      DELETE FROM ${this.tableName} WHERE id = $1
    `, [id]);

    return result.affectedRows > 0;
  }

  async search(query: string, filters: Record<string, unknown> = {}): Promise<DatabasePersona[]> {
    const db = getDatabase();
    
    let sql = `
      SELECT *, 
             ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery('english', $1)) as relevance
      FROM ${this.tableName}
      WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', $1)
    `;
    
    const params: unknown[] = [query];
    let paramIndex = 2;

    // Add filters
    if (filters.type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.is_public !== undefined) {
      sql += ` AND is_public = $${paramIndex}`;
      params.push(filters.is_public);
      paramIndex++;
    }

    if (filters.owner_id) {
      sql += ` AND owner_id = $${paramIndex}`;
      params.push(filters.owner_id);
      paramIndex++;
    }

    if (filters.knowledge && Array.isArray(filters.knowledge)) {
      sql += ` AND knowledge && $${paramIndex}`;
      params.push(filters.knowledge);
      paramIndex++;
    }

    if (filters.communication_style) {
      sql += ` AND communication_style = $${paramIndex}`;
      params.push(filters.communication_style);
      paramIndex++;
    }

    if (filters.min_rating) {
      sql += ` AND average_rating >= $${paramIndex}`;
      params.push(filters.min_rating);
      paramIndex++;
    }

    sql += ` ORDER BY relevance DESC, average_rating DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    return await db.query<DatabasePersona>(sql, params);
  }

  // Additional utility methods
  async findByType(type: PersonaType): Promise<DatabasePersona[]> {
    return await table<DatabasePersona>(this.tableName)
      .where('type = $1', type)
      .orderBy('created_at', 'DESC')
      .execute();
  }

  async findCompatible(personaId: string, criteria: {
    oppositeTraits?: boolean;
    sharedInterests?: string[];
    experienceLevel?: string;
  } = {}): Promise<DatabasePersona[]> {
    const db = getDatabase();
    
    // Get the source persona first
    const sourcePersona = await this.findById(personaId);
    if (!sourcePersona) {
      throw new Error('Source persona not found');
    }

    let sql = `
      SELECT p.*, 
             CASE 
               WHEN $2::jsonb ? 'sharedInterests' THEN
                 (SELECT COUNT(*) FROM unnest(p.knowledge) k WHERE k = ANY($3::text[]))
               ELSE 0 
             END as shared_interests_count
      FROM ${this.tableName} p
      WHERE p.id != $1 
        AND p.is_public = true
    `;

    const params: unknown[] = [personaId, criteria, criteria.sharedInterests || []];
    let paramIndex = 4;

    // Filter by interaction compatibility
    sql += ` AND p.allowed_interactions && $${paramIndex}`;
    params.push(sourcePersona.allowed_interactions);
    paramIndex++;

    if (criteria.experienceLevel) {
      // Add experience level filtering logic based on conversation_count
      const experienceThresholds = {
        'beginner': 10,
        'intermediate': 50,
        'expert': 100,
      };
      
      const threshold = experienceThresholds[criteria.experienceLevel as keyof typeof experienceThresholds];
      if (threshold) {
        sql += ` AND p.conversation_count >= $${paramIndex}`;
        params.push(threshold);
        paramIndex++;
      }
    }

    sql += ` ORDER BY shared_interests_count DESC, p.average_rating DESC LIMIT 20`;

    return await db.query<DatabasePersona>(sql, params);
  }

  async updateStats(id: string, stats: { 
    conversationCount?: number; 
    totalMessages?: number; 
    averageRating?: number 
  }): Promise<void> {
    const db = getDatabase();
    
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (stats.conversationCount !== undefined) {
      updateFields.push(`conversation_count = $${paramIndex}`);
      values.push(stats.conversationCount);
      paramIndex++;
    }

    if (stats.totalMessages !== undefined) {
      updateFields.push(`total_messages = $${paramIndex}`);
      values.push(stats.totalMessages);
      paramIndex++;
    }

    if (stats.averageRating !== undefined) {
      updateFields.push(`average_rating = $${paramIndex}`);
      values.push(stats.averageRating);
      paramIndex++;
    }

    if (updateFields.length === 0) return;

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE ${this.tableName}
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await db.execute(sql, values);
  }

  async incrementMessageCount(id: string, count: number = 1): Promise<void> {
    const db = getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET 
        total_messages = total_messages + $2,
        updated_at = NOW()
      WHERE id = $1
    `, [id, count]);
  }

  async getTopRated(limit: number = 10): Promise<DatabasePersona[]> {
    return await table<DatabasePersona>(this.tableName)
      .where('is_public = $1', true)
      .where('conversation_count >= $2', 5) // Minimum conversations for meaningful rating
      .orderBy('average_rating', 'DESC')
      .limit(limit)
      .execute();
  }
}

// Domain model conversion utilities
export class PersonaMapper {
  static toDomain(dbPersona: DatabasePersona): Persona {
    return {
      id: dbPersona.id,
      name: dbPersona.name,
      type: dbPersona.type as PersonaType,
      ownerId: dbPersona.owner_id || undefined,
      description: dbPersona.description,
      personality: dbPersona.personality as Persona['personality'],
      knowledge: dbPersona.knowledge as Persona['knowledge'],
      communicationStyle: dbPersona.communication_style as Persona['communicationStyle'],
      modelConfig: dbPersona.model_config as Persona['modelConfig'],
      systemPrompt: dbPersona.system_prompt || undefined,
      responseTimeRange: dbPersona.response_time_range as Persona['responseTimeRange'],
      typingSpeed: dbPersona.typing_speed || undefined,
      isPublic: dbPersona.is_public,
      allowedInteractions: dbPersona.allowed_interactions as Persona['allowedInteractions'],
      conversationCount: dbPersona.conversation_count,
      totalMessages: dbPersona.total_messages,
      averageRating: dbPersona.average_rating,
      createdAt: dbPersona.created_at,
      updatedAt: dbPersona.updated_at,
    };
  }

  static toDatabase(persona: PersonaCreate, ownerId?: string): Omit<DatabasePersona, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: persona.name,
      type: persona.type,
      owner_id: ownerId || undefined,
      description: persona.description,
      personality: persona.personality,
      knowledge: persona.knowledge,
      communication_style: persona.communicationStyle,
      model_config: persona.modelConfig || undefined,
      system_prompt: persona.systemPrompt || undefined,
      response_time_range: undefined,
      typing_speed: undefined,
      is_public: persona.isPublic,
      allowed_interactions: persona.allowedInteractions,
      conversation_count: 0,
      total_messages: 0,
      average_rating: 0.0,
    };
  }

  static updateToDatabase(updates: PersonaUpdate): Partial<DatabasePersona> {
    const dbUpdates: Partial<DatabasePersona> = {};
    
    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }
    
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
    }
    
    if (updates.personality !== undefined) {
      dbUpdates.personality = updates.personality;
    }
    
    if (updates.knowledge !== undefined) {
      dbUpdates.knowledge = updates.knowledge;
    }
    
    if (updates.communicationStyle !== undefined) {
      dbUpdates.communication_style = updates.communicationStyle;
    }
    
    if (updates.modelConfig !== undefined) {
      dbUpdates.model_config = updates.modelConfig;
    }
    
    if (updates.systemPrompt !== undefined) {
      dbUpdates.system_prompt = updates.systemPrompt;
    }
    
    if (updates.isPublic !== undefined) {
      dbUpdates.is_public = updates.isPublic;
    }
    
    if (updates.allowedInteractions !== undefined) {
      dbUpdates.allowed_interactions = updates.allowedInteractions;
    }

    return dbUpdates;
  }
}

// Service class that combines repository with domain logic
export class PersonaService {
  constructor(private personaRepo: PersonaRepository = new PersonaRepository()) {}

  async createPersona(personaData: PersonaCreate, ownerId?: string): Promise<Persona> {
    const dbPersona = PersonaMapper.toDatabase(personaData, ownerId);
    const createdPersona = await this.personaRepo.create(dbPersona);
    return PersonaMapper.toDomain(createdPersona);
  }

  async getPersonaById(id: string): Promise<Persona | null> {
    const dbPersona = await this.personaRepo.findById(id);
    return dbPersona ? PersonaMapper.toDomain(dbPersona) : null;
  }

  async getUserPersonas(userId: string): Promise<Persona[]> {
    const dbPersonas = await this.personaRepo.findByOwner(userId);
    return dbPersonas.map(PersonaMapper.toDomain);
  }

  async getPublicPersonas(limit: number = 20, offset: number = 0): Promise<Persona[]> {
    const dbPersonas = await this.personaRepo.findPublic({ limit, offset });
    return dbPersonas.map(PersonaMapper.toDomain);
  }

  async updatePersona(id: string, updates: PersonaUpdate): Promise<Persona> {
    const dbUpdates = PersonaMapper.updateToDatabase(updates);
    const updatedPersona = await this.personaRepo.update(id, dbUpdates);
    return PersonaMapper.toDomain(updatedPersona);
  }

  async deletePersona(id: string): Promise<boolean> {
    return await this.personaRepo.delete(id);
  }

  async searchPersonas(query: string, filters: Record<string, unknown> = {}): Promise<Persona[]> {
    const dbPersonas = await this.personaRepo.search(query, filters);
    return dbPersonas.map(PersonaMapper.toDomain);
  }

  async findCompatiblePersonas(personaId: string, criteria: {
    oppositeTraits?: boolean;
    sharedInterests?: string[];
    experienceLevel?: string;
  } = {}): Promise<Persona[]> {
    const dbPersonas = await this.personaRepo.findCompatible(personaId, criteria);
    return dbPersonas.map(PersonaMapper.toDomain);
  }

  async validatePersonaOwnership(personaId: string, userId: string): Promise<boolean> {
    const persona = await this.getPersonaById(personaId);
    return persona?.ownerId === userId;
  }

  async getTopRatedPersonas(limit: number = 10): Promise<Persona[]> {
    const dbPersonas = await this.personaRepo.getTopRated(limit);
    return dbPersonas.map(PersonaMapper.toDomain);
  }
}