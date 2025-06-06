import { 
  DatabaseMessage, 
  MessageRepository as IMessageRepository, 
  QueryOptions 
} from '../types/database';
import { 
  Message, 
  MessageCreate, 
  MessageUpdate, 
  MessageSearch,
  MessageSearchResult,
  ConversationHistory,
  MessageType,
  ModerationStatus
} from '../types/messages';
import { getDatabase, table } from '../lib/database';

export class MessageRepository implements IMessageRepository {
  private tableName = 'messages';

  async findById(id: string): Promise<DatabaseMessage | null> {
    return await table<DatabaseMessage>(this.tableName)
      .where('id = $1', id)
      .first();
  }

  async findByConversation(conversationId: string, options: QueryOptions = {}): Promise<DatabaseMessage[]> {
    let query = table<DatabaseMessage>(this.tableName)
      .where('conversation_id = $1', conversationId)
      .where('is_visible = $2', true);

    // Apply ordering (default by sequence number)
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'ASC');
    } else {
      query = query.orderBy('sequence_number', 'ASC');
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

  async create(messageData: Omit<DatabaseMessage, 'id' | 'timestamp'>): Promise<DatabaseMessage> {
    const db = getDatabase();
    
    const result = await db.queryOne<DatabaseMessage>(`
      INSERT INTO ${this.tableName} (
        conversation_id, author_persona_id, content, type, sequence_number,
        is_edited, edited_at, original_content, reply_to_message_id, thread_id,
        metadata, moderation_status, moderation_flags, is_visible, is_archived,
        reactions, quality_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      messageData.conversation_id,
      messageData.author_persona_id,
      messageData.content,
      messageData.type,
      messageData.sequence_number,
      messageData.is_edited,
      messageData.edited_at,
      messageData.original_content,
      messageData.reply_to_message_id,
      messageData.thread_id,
      messageData.metadata,
      messageData.moderation_status,
      messageData.moderation_flags,
      messageData.is_visible,
      messageData.is_archived,
      messageData.reactions,
      messageData.quality_rating,
    ]);

    if (!result) {
      throw new Error('Failed to create message');
    }

    return result;
  }

  async update(id: string, updates: Partial<DatabaseMessage>): Promise<DatabaseMessage> {
    const db = getDatabase();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'timestamp' && value !== undefined) {
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

    const result = await db.queryOne<DatabaseMessage>(sql, values);
    
    if (!result) {
      throw new Error('Message not found or update failed');
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

  async search(criteria: Record<string, unknown>): Promise<DatabaseMessage[]> {
    const db = getDatabase();
    
    let sql = `
      SELECT m.*, 
             ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', $1)) as relevance
      FROM ${this.tableName} m
      WHERE to_tsvector('english', m.content) @@ plainto_tsquery('english', $1)
        AND m.is_visible = true
    `;
    
    const params: unknown[] = [criteria.query || ''];
    let paramIndex = 2;

    // Add filters
    if (criteria.conversationId) {
      sql += ` AND m.conversation_id = $${paramIndex}`;
      params.push(criteria.conversationId);
      paramIndex++;
    }

    if (criteria.authorPersonaId) {
      sql += ` AND m.author_persona_id = $${paramIndex}`;
      params.push(criteria.authorPersonaId);
      paramIndex++;
    }

    if (criteria.messageType) {
      sql += ` AND m.type = $${paramIndex}`;
      params.push(criteria.messageType);
      paramIndex++;
    }

    if (criteria.fromDate) {
      sql += ` AND m.timestamp >= $${paramIndex}`;
      params.push(criteria.fromDate);
      paramIndex++;
    }

    if (criteria.toDate) {
      sql += ` AND m.timestamp <= $${paramIndex}`;
      params.push(criteria.toDate);
      paramIndex++;
    }

    if (criteria.minLength) {
      sql += ` AND LENGTH(m.content) >= $${paramIndex}`;
      params.push(criteria.minLength);
      paramIndex++;
    }

    if (criteria.maxLength) {
      sql += ` AND LENGTH(m.content) <= $${paramIndex}`;
      params.push(criteria.maxLength);
      paramIndex++;
    }

    if (criteria.topics && Array.isArray(criteria.topics)) {
      sql += ` AND m.metadata->>'topics' ?| $${paramIndex}`;
      params.push(criteria.topics);
      paramIndex++;
    }

    if (criteria.sentimentRange && Array.isArray(criteria.sentimentRange)) {
      sql += ` AND (m.metadata->'sentiment'->>'score')::float BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(criteria.sentimentRange[0]);
      params.push(criteria.sentimentRange[1]);
      paramIndex += 2;
    }

    sql += ` ORDER BY relevance DESC, m.timestamp DESC`;

    if (criteria.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(criteria.limit);
      paramIndex++;
    }

    if (criteria.offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(criteria.offset);
    }

    return await db.query<DatabaseMessage>(sql, params);
  }

  async getLatest(conversationId: string, count: number): Promise<DatabaseMessage[]> {
    return await table<DatabaseMessage>(this.tableName)
      .where('conversation_id = $1', conversationId)
      .where('is_visible = $2', true)
      .orderBy('sequence_number', 'DESC')
      .limit(count)
      .execute();
  }

  // Additional utility methods
  async getNextSequenceNumber(conversationId: string): Promise<number> {
    const db = getDatabase();
    
    const result = await db.queryOne<{ max_sequence: number | null }>(`
      SELECT MAX(sequence_number) as max_sequence 
      FROM ${this.tableName} 
      WHERE conversation_id = $1
    `, [conversationId]);

    return (result?.max_sequence || 0) + 1;
  }

  async getConversationHistory(
    conversationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<ConversationHistory> {
    const db = getDatabase();
    
    let sql = `
      SELECT m.*, p.name as persona_name, p.type as persona_type
      FROM ${this.tableName} m
      JOIN personas p ON m.author_persona_id = p.id
      WHERE m.conversation_id = $1 AND m.is_visible = true
    `;
    
    const params: unknown[] = [conversationId];
    let paramIndex = 2;

    if (cursor) {
      sql += ` AND m.sequence_number > $${paramIndex}`;
      params.push(parseInt(cursor));
      paramIndex++;
    }

    sql += ` ORDER BY m.sequence_number ASC LIMIT $${paramIndex}`;
    params.push(limit + 1); // Get one extra to check if there are more

    const results = await db.query<DatabaseMessage & { persona_name: string; persona_type: string }>(sql, params);
    
    const hasMore = results.length > limit;
    const messages = hasMore ? results.slice(0, -1) : results;
    
    const nextCursor = hasMore ? messages[messages.length - 1].sequence_number.toString() : undefined;

    // Get unique participants
    const participantMap = new Map();
    messages.forEach(msg => {
      if (!participantMap.has(msg.author_persona_id)) {
        participantMap.set(msg.author_persona_id, {
          personaId: msg.author_persona_id,
          personaName: msg.persona_name,
          personaType: msg.persona_type,
        });
      }
    });

    return {
      conversationId,
      messages: messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        authorPersonaId: msg.author_persona_id,
        content: msg.content,
        type: msg.type as MessageType,
        timestamp: msg.timestamp,
        sequenceNumber: msg.sequence_number,
        isEdited: msg.is_edited,
        editedAt: msg.edited_at || undefined,
        originalContent: msg.original_content || undefined,
        replyToMessageId: msg.reply_to_message_id || undefined,
        threadId: msg.thread_id || undefined,
        metadata: msg.metadata as Message['metadata'],
        moderationStatus: msg.moderation_status as ModerationStatus,
        moderationFlags: msg.moderation_flags as Message['moderationFlags'],
        isVisible: msg.is_visible,
        isArchived: msg.is_archived,
        reactions: msg.reactions as Message['reactions'],
        qualityRating: msg.quality_rating || undefined,
      })),
      participants: Array.from(participantMap.values()),
      totalCount: await this.getMessageCount(conversationId),
      hasMore,
      nextCursor,
    };
  }

  async getMessageCount(conversationId: string): Promise<number> {
    return await table<DatabaseMessage>(this.tableName)
      .where('conversation_id = $1', conversationId)
      .where('is_visible = $2', true)
      .count();
  }

  async updateModerationStatus(id: string, status: ModerationStatus): Promise<void> {
    const db = getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET moderation_status = $2
      WHERE id = $1
    `, [id, status]);
  }

  async hideMessage(id: string): Promise<void> {
    const db = getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET is_visible = false
      WHERE id = $1
    `, [id]);
  }

  async getMessagesByAuthor(authorPersonaId: string, limit: number = 100): Promise<DatabaseMessage[]> {
    return await table<DatabaseMessage>(this.tableName)
      .where('author_persona_id = $1', authorPersonaId)
      .where('is_visible = $2', true)
      .orderBy('timestamp', 'DESC')
      .limit(limit)
      .execute();
  }

  async getMessagesByThread(threadId: string): Promise<DatabaseMessage[]> {
    return await table<DatabaseMessage>(this.tableName)
      .where('thread_id = $1', threadId)
      .where('is_visible = $2', true)
      .orderBy('timestamp', 'ASC')
      .execute();
  }

  async updateMessageMetadata(id: string, metadata: Record<string, unknown>): Promise<void> {
    const db = getDatabase();
    
    await db.execute(`
      UPDATE ${this.tableName}
      SET metadata = $2
      WHERE id = $1
    `, [id, metadata]);
  }
}

// Domain model conversion utilities
export class MessageMapper {
  static toDomain(dbMessage: DatabaseMessage): Message {
    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversation_id,
      authorPersonaId: dbMessage.author_persona_id,
      content: dbMessage.content,
      type: dbMessage.type as MessageType,
      timestamp: dbMessage.timestamp,
      sequenceNumber: dbMessage.sequence_number,
      isEdited: dbMessage.is_edited,
      editedAt: dbMessage.edited_at || undefined,
      originalContent: dbMessage.original_content || undefined,
      replyToMessageId: dbMessage.reply_to_message_id || undefined,
      threadId: dbMessage.thread_id || undefined,
      metadata: dbMessage.metadata as Message['metadata'],
      moderationStatus: dbMessage.moderation_status as ModerationStatus,
      moderationFlags: dbMessage.moderation_flags as Message['moderationFlags'],
      isVisible: dbMessage.is_visible,
      isArchived: dbMessage.is_archived,
      reactions: dbMessage.reactions as Message['reactions'],
      qualityRating: dbMessage.quality_rating || undefined,
    };
  }

  static toDatabase(
    message: MessageCreate, 
    sequenceNumber: number
  ): Omit<DatabaseMessage, 'id' | 'timestamp'> {
    return {
      conversation_id: message.conversationId,
      author_persona_id: message.authorPersonaId,
      content: message.content,
      type: message.type || 'text',
      sequence_number: sequenceNumber,
      is_edited: false,
      edited_at: undefined,
      original_content: undefined,
      reply_to_message_id: message.replyToMessageId || undefined,
      thread_id: undefined,
      metadata: {
        wordCount: message.content.split(/\s+/).length,
        characterCount: message.content.length,
        readingTime: Math.ceil(message.content.split(/\s+/).length / 200), // ~200 wpm
        complexity: 0.5, // Default complexity
      },
      moderation_status: 'pending',
      moderation_flags: [],
      is_visible: true,
      is_archived: false,
      reactions: {},
      quality_rating: undefined,
    };
  }

  static updateToDatabase(updates: MessageUpdate): Partial<DatabaseMessage> {
    const dbUpdates: Partial<DatabaseMessage> = {};
    
    if (updates.content !== undefined) {
      dbUpdates.content = updates.content;
      dbUpdates.is_edited = true;
      dbUpdates.edited_at = new Date();
    }
    
    if (updates.isVisible !== undefined) {
      dbUpdates.is_visible = updates.isVisible;
    }
    
    if (updates.isArchived !== undefined) {
      dbUpdates.is_archived = updates.isArchived;
    }
    
    if (updates.moderationStatus !== undefined) {
      dbUpdates.moderation_status = updates.moderationStatus;
    }

    return dbUpdates;
  }
}

// Service class that combines repository with domain logic
export class MessageService {
  constructor(private messageRepo: MessageRepository = new MessageRepository()) {}

  async createMessage(messageData: MessageCreate): Promise<Message> {
    const sequenceNumber = await this.messageRepo.getNextSequenceNumber(messageData.conversationId);
    const dbMessage = MessageMapper.toDatabase(messageData, sequenceNumber);
    const createdMessage = await this.messageRepo.create(dbMessage);
    return MessageMapper.toDomain(createdMessage);
  }

  async getMessageById(id: string): Promise<Message | null> {
    const dbMessage = await this.messageRepo.findById(id);
    return dbMessage ? MessageMapper.toDomain(dbMessage) : null;
  }

  async getConversationMessages(
    conversationId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Message[]> {
    const dbMessages = await this.messageRepo.findByConversation(conversationId, { limit, offset });
    return dbMessages.map(MessageMapper.toDomain);
  }

  async getConversationHistory(
    conversationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<ConversationHistory> {
    return await this.messageRepo.getConversationHistory(conversationId, limit, cursor);
  }

  async updateMessage(id: string, updates: MessageUpdate): Promise<Message> {
    const dbUpdates = MessageMapper.updateToDatabase(updates);
    const updatedMessage = await this.messageRepo.update(id, dbUpdates);
    return MessageMapper.toDomain(updatedMessage);
  }

  async deleteMessage(id: string): Promise<boolean> {
    return await this.messageRepo.delete(id);
  }

  async searchMessages(criteria: MessageSearch): Promise<MessageSearchResult[]> {
    const dbMessages = await this.messageRepo.search(criteria as unknown as Record<string, unknown>);
    
    return dbMessages.map(dbMessage => {
      const message = MessageMapper.toDomain(dbMessage);
      
      // Create highlights (simplified - in a real implementation, you'd use proper text highlighting)
      const highlights: string[] = [];
      if (criteria.query && typeof criteria.query === 'string') {
        const words = criteria.query.toLowerCase().split(/\s+/);
        const content = message.content.toLowerCase();
        
        words.forEach(word => {
          if (content.includes(word)) {
            const index = content.indexOf(word);
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + word.length + 50);
            highlights.push(message.content.substring(start, end) + '...');
          }
        });
      }

      return {
        message,
        highlights,
        relevanceScore: 1.0, // Would be calculated by the database query
        context: {
          // These would be fetched separately in a real implementation
          previousMessage: undefined,
          nextMessage: undefined,
        },
      };
    });
  }

  async moderateMessage(id: string, status: ModerationStatus): Promise<Message> {
    await this.messageRepo.updateModerationStatus(id, status);
    const updatedMessage = await this.messageRepo.findById(id);
    if (!updatedMessage) {
      throw new Error('Message not found after moderation update');
    }
    return MessageMapper.toDomain(updatedMessage);
  }

  async hideMessage(id: string): Promise<void> {
    await this.messageRepo.hideMessage(id);
  }

  async validateMessageOwnership(messageId: string, personaId: string): Promise<boolean> {
    const message = await this.getMessageById(messageId);
    return message?.authorPersonaId === personaId;
  }

  async getRecentMessages(conversationId: string, count: number = 10): Promise<Message[]> {
    const dbMessages = await this.messageRepo.getLatest(conversationId, count);
    return dbMessages.map(MessageMapper.toDomain).reverse(); // Reverse to get chronological order
  }
}