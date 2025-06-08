import { 
  DatabaseConversation, 
  DatabaseConversationParticipant,
  ConversationRepository as IConversationRepository 
} from '../types/database';
import { 
  Conversation, 
  ConversationCreate, 
  ConversationUpdate, 
  ConversationStatus,
  PersonaInstance 
} from '../types/conversations';
import { getDatabase, table } from '../lib/database';

export class ConversationRepository implements IConversationRepository {
  private tableName = 'conversations';
  private participantsTable = 'conversation_participants';

  async findById(id: string): Promise<DatabaseConversation | null> {
    return await table<DatabaseConversation>(this.tableName)
      .where('id = $1', id)
      .first();
  }

  async findByUser(userId: string, status?: string): Promise<DatabaseConversation[]> {
    const db = await getDatabase();
    
    let sql = `
      SELECT DISTINCT c.*
      FROM ${this.tableName} c
      JOIN ${this.participantsTable} cp ON c.id = cp.conversation_id
      JOIN personas p ON cp.persona_id = p.id
      WHERE p.owner_id = $1
    `;
    
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY c.created_at DESC`;

    return await db.query<DatabaseConversation>(sql, params);
  }

  async findByPersona(personaId: string): Promise<DatabaseConversation[]> {
    const db = await getDatabase();
    
    const sql = `
      SELECT c.*
      FROM ${this.tableName} c
      JOIN ${this.participantsTable} cp ON c.id = cp.conversation_id
      WHERE cp.persona_id = $1
      ORDER BY c.created_at DESC
    `;

    return await db.query<DatabaseConversation>(sql, [personaId]);
  }

  async create(conversationData: Omit<DatabaseConversation, 'id' | 'created_at'>): Promise<DatabaseConversation> {
    const db = await getDatabase();
    
    const result = await db.queryOne<DatabaseConversation>(`
      INSERT INTO ${this.tableName} (
        title, topic, description, constraints, goal, status, current_turn, message_count,
        started_at, ended_at, paused_at, resumed_at, created_by, total_characters,
        average_response_time, topic_tags, quality_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      conversationData.title,
      conversationData.topic,
      conversationData.description,
      conversationData.constraints,
      conversationData.goal,
      conversationData.status,
      conversationData.current_turn,
      conversationData.message_count,
      conversationData.started_at,
      conversationData.ended_at,
      conversationData.paused_at,
      conversationData.resumed_at,
      conversationData.created_by,
      conversationData.total_characters,
      conversationData.average_response_time,
      conversationData.topic_tags,
      conversationData.quality_score,
    ]);

    if (!result) {
      throw new Error('Failed to create conversation');
    }

    return result;
  }

  async update(id: string, updates: Partial<DatabaseConversation>): Promise<DatabaseConversation> {
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

    values.push(id); // Add ID as the last parameter

    const sql = `
      UPDATE ${this.tableName} 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.queryOne<DatabaseConversation>(sql, values);
    
    if (!result) {
      throw new Error('Conversation not found or update failed');
    }

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    
    // Delete participants first (foreign key constraint)
    await db.execute(`DELETE FROM ${this.participantsTable} WHERE conversation_id = $1`, [id]);
    
    const result = await db.execute(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);

    return result.affectedRows > 0;
  }

  async getParticipants(conversationId: string): Promise<DatabaseConversationParticipant[]> {
    return await table<DatabaseConversationParticipant>(this.participantsTable)
      .where('conversation_id = $1', conversationId)
      .orderBy('joined_at', 'ASC')
      .execute();
  }

  async addParticipant(participant: DatabaseConversationParticipant): Promise<DatabaseConversationParticipant> {
    const db = await getDatabase();
    
    const result = await db.queryOne<DatabaseConversationParticipant>(`
      INSERT INTO ${this.participantsTable} (
        conversation_id, persona_id, role, is_revealed, joined_at, last_active_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      participant.conversation_id,
      participant.persona_id,
      participant.role,
      participant.is_revealed,
      participant.joined_at,
      participant.last_active_at,
    ]);

    if (!result) {
      throw new Error('Failed to add participant');
    }

    return result;
  }

  async updateParticipant(
    conversationId: string, 
    personaId: string, 
    updates: Partial<DatabaseConversationParticipant>
  ): Promise<DatabaseConversationParticipant> {
    const db = await getDatabase();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'conversation_id' && key !== 'persona_id' && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(conversationId, personaId);

    const sql = `
      UPDATE ${this.participantsTable} 
      SET ${updateFields.join(', ')}
      WHERE conversation_id = $${paramIndex} AND persona_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await db.queryOne<DatabaseConversationParticipant>(sql, values);
    
    if (!result) {
      throw new Error('Participant not found or update failed');
    }

    return result;
  }

  // Additional utility methods
  async findActiveConversations(): Promise<DatabaseConversation[]> {
    return await table<DatabaseConversation>(this.tableName)
      .where('status = $1', 'active')
      .orderBy('created_at', 'DESC')
      .execute();
  }

  async findByStatus(status: ConversationStatus): Promise<DatabaseConversation[]> {
    return await table<DatabaseConversation>(this.tableName)
      .where('status = $1', status)
      .orderBy('created_at', 'DESC')
      .execute();
  }

  async updateMessageCount(id: string, increment: number = 1): Promise<void> {
    const db = await getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET 
        message_count = message_count + $2,
        current_turn = current_turn + 1
      WHERE id = $1
    `, [id, increment]);
  }

  async updateStats(id: string, stats: {
    totalCharacters?: number;
    averageResponseTime?: number;
    qualityScore?: number;
  }): Promise<void> {
    const db = await getDatabase();
    
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (stats.totalCharacters !== undefined) {
      updateFields.push(`total_characters = $${paramIndex}`);
      values.push(stats.totalCharacters);
      paramIndex++;
    }

    if (stats.averageResponseTime !== undefined) {
      updateFields.push(`average_response_time = $${paramIndex}`);
      values.push(stats.averageResponseTime);
      paramIndex++;
    }

    if (stats.qualityScore !== undefined) {
      updateFields.push(`quality_score = $${paramIndex}`);
      values.push(stats.qualityScore);
      paramIndex++;
    }

    if (updateFields.length === 0) return;

    values.push(id);

    const sql = `
      UPDATE ${this.tableName}
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await db.execute(sql, values);
  }

  async setParticipantActiveTime(conversationId: string, personaId: string): Promise<void> {
    const db = await getDatabase();
    
    await db.execute(`
      UPDATE ${this.participantsTable}
      SET last_active_at = NOW()
      WHERE conversation_id = $1 AND persona_id = $2
    `, [conversationId, personaId]);
  }

  async revealParticipant(conversationId: string, personaId: string): Promise<void> {
    const db = await getDatabase();
    
    await db.execute(`
      UPDATE ${this.participantsTable}
      SET is_revealed = true
      WHERE conversation_id = $1 AND persona_id = $2
    `, [conversationId, personaId]);
  }

  async getConversationWithParticipants(id: string): Promise<{
    conversation: DatabaseConversation;
    participants: DatabaseConversationParticipant[];
  } | null> {
    const conversation = await this.findById(id);
    if (!conversation) {
      return null;
    }

    const participants = await this.getParticipants(id);
    
    return { conversation, participants };
  }
}

// Domain model conversion utilities
export class ConversationMapper {
  static toDomain(
    dbConversation: DatabaseConversation, 
    participants: DatabaseConversationParticipant[]
  ): Conversation {
    const personaInstances: [PersonaInstance, PersonaInstance] = [
      {
        personaId: participants[0].persona_id,
        role: participants[0].role as PersonaInstance['role'],
        isRevealed: participants[0].is_revealed,
        joinedAt: participants[0].joined_at,
        lastActiveAt: participants[0].last_active_at,
      },
      {
        personaId: participants[1].persona_id,
        role: participants[1].role as PersonaInstance['role'],
        isRevealed: participants[1].is_revealed,
        joinedAt: participants[1].joined_at,
        lastActiveAt: participants[1].last_active_at,
      }
    ];

    return {
      id: dbConversation.id,
      title: dbConversation.title,
      topic: dbConversation.topic,
      description: dbConversation.description || undefined,
      participants: personaInstances,
      constraints: dbConversation.constraints as Conversation['constraints'],
      goal: dbConversation.goal as Conversation['goal'],
      status: dbConversation.status as ConversationStatus,
      currentTurn: dbConversation.current_turn,
      messageCount: dbConversation.message_count,
      createdAt: dbConversation.created_at,
      startedAt: dbConversation.started_at || undefined,
      endedAt: dbConversation.ended_at || undefined,
      pausedAt: dbConversation.paused_at || undefined,
      resumedAt: dbConversation.resumed_at || undefined,
      createdBy: dbConversation.created_by,
      totalCharacters: dbConversation.total_characters,
      averageResponseTime: dbConversation.average_response_time,
      topicTags: dbConversation.topic_tags,
      qualityScore: dbConversation.quality_score || undefined,
    };
  }

  static toDatabase(
    conversation: ConversationCreate, 
    createdBy: string
  ): Omit<DatabaseConversation, 'id' | 'created_at'> {
    return {
      title: conversation.title,
      topic: conversation.topic,
      description: conversation.description || undefined,
      constraints: conversation.constraints,
      goal: conversation.goal || undefined,
      status: 'active',
      current_turn: 0,
      message_count: 0,
      started_at: undefined,
      ended_at: undefined,
      paused_at: undefined,
      resumed_at: undefined,
      created_by: createdBy,
      total_characters: 0,
      average_response_time: 0,
      topic_tags: [],
      quality_score: undefined,
    };
  }

  static updateToDatabase(updates: ConversationUpdate): Partial<DatabaseConversation> {
    const dbUpdates: Partial<DatabaseConversation> = {};
    
    if (updates.title !== undefined) {
      dbUpdates.title = updates.title;
    }
    
    if (updates.topic !== undefined) {
      dbUpdates.topic = updates.topic;
    }
    
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
    }
    
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
      
      // Update timestamps based on status
      if (updates.status === 'active' && !dbUpdates.started_at) {
        dbUpdates.started_at = new Date();
      } else if (updates.status === 'paused') {
        dbUpdates.paused_at = new Date();
      } else if (updates.status === 'completed' || updates.status === 'terminated') {
        dbUpdates.ended_at = new Date();
      }
    }
    
    if (updates.constraints !== undefined) {
      dbUpdates.constraints = updates.constraints;
    }
    
    if (updates.goal !== undefined) {
      dbUpdates.goal = updates.goal;
    }

    return dbUpdates;
  }
}

// Service class that combines repository with domain logic
export class ConversationService {
  constructor(private conversationRepo: ConversationRepository = new ConversationRepository()) {}

  async createConversation(
    conversationData: ConversationCreate, 
    createdBy: string
  ): Promise<Conversation> {
    const db = await getDatabase();
    
    return await db.transaction(async () => {
      // Create the conversation
      const dbConversation = ConversationMapper.toDatabase(conversationData, createdBy);
      const createdConversation = await this.conversationRepo.create(dbConversation);

      // Add participants
      const participants: DatabaseConversationParticipant[] = [];
      
      const participant1: DatabaseConversationParticipant = {
        conversation_id: createdConversation.id,
        persona_id: conversationData.participantPersonaIds[0],
        role: 'initiator',
        is_revealed: false,
        joined_at: new Date(),
        last_active_at: new Date(),
      };
      
      const participant2: DatabaseConversationParticipant = {
        conversation_id: createdConversation.id,
        persona_id: conversationData.participantPersonaIds[1],
        role: 'responder',
        is_revealed: false,
        joined_at: new Date(),
        last_active_at: new Date(),
      };

      participants.push(await this.conversationRepo.addParticipant(participant1));
      participants.push(await this.conversationRepo.addParticipant(participant2));

      return ConversationMapper.toDomain(createdConversation, participants);
    });
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const result = await this.conversationRepo.getConversationWithParticipants(id);
    if (!result) {
      return null;
    }

    return ConversationMapper.toDomain(result.conversation, result.participants);
  }

  async getUserConversations(userId: string, status?: ConversationStatus): Promise<Conversation[]> {
    const dbConversations = await this.conversationRepo.findByUser(userId, status);
    
    // Get participants for each conversation
    const conversations: Conversation[] = [];
    for (const dbConversation of dbConversations) {
      const participants = await this.conversationRepo.getParticipants(dbConversation.id);
      conversations.push(ConversationMapper.toDomain(dbConversation, participants));
    }

    return conversations;
  }

  async updateConversation(id: string, updates: ConversationUpdate): Promise<Conversation> {
    const dbUpdates = ConversationMapper.updateToDatabase(updates);
    const updatedConversation = await this.conversationRepo.update(id, dbUpdates);
    const participants = await this.conversationRepo.getParticipants(id);
    
    return ConversationMapper.toDomain(updatedConversation, participants);
  }

  async deleteConversation(id: string): Promise<boolean> {
    return await this.conversationRepo.delete(id);
  }

  async startConversation(id: string): Promise<Conversation> {
    return await this.updateConversation(id, { 
      status: 'active',
    });
  }

  async pauseConversation(id: string): Promise<Conversation> {
    return await this.updateConversation(id, { 
      status: 'paused',
    });
  }

  async endConversation(id: string): Promise<Conversation> {
    return await this.updateConversation(id, { 
      status: 'completed',
    });
  }

  async revealPersona(conversationId: string, personaId: string): Promise<void> {
    await this.conversationRepo.revealParticipant(conversationId, personaId);
  }

  async updateParticipantActivity(conversationId: string, personaId: string): Promise<void> {
    await this.conversationRepo.setParticipantActiveTime(conversationId, personaId);
  }

  async validateParticipant(conversationId: string, personaId: string): Promise<boolean> {
    const participants = await this.conversationRepo.getParticipants(conversationId);
    return participants.some(p => p.persona_id === personaId);
  }
}