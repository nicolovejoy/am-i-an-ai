/**
 * Utilities for transforming data between frontend (camelCase) and backend (snake_case) formats
 */

import { Message, MessageData } from '../types/messages';
import { Persona, PersonaData } from '../types/personas';

/**
 * Convert a string from camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert a string from snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively convert object keys from camelCase to snake_case
 */
export function objectCamelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(objectCamelToSnake);
  if (typeof obj !== 'object') return obj;

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      converted[camelToSnake(key)] = objectCamelToSnake(obj[key]);
    }
  }
  return converted;
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
export function objectSnakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(objectSnakeToCamel);
  if (typeof obj !== 'object') return obj;

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      converted[snakeToCamel(key)] = objectSnakeToCamel(obj[key]);
    }
  }
  return converted;
}

/**
 * Transform frontend Message to backend MessageData format
 */
export function messageToMessageData(message: Message): MessageData {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    author_persona_id: message.authorPersonaId,
    content: message.content,
    type: message.type,
    created_at: message.timestamp.toISOString(),
    sequence_number: message.sequenceNumber,
    is_edited: message.isEdited,
    edited_at: message.editedAt?.toISOString(),
    metadata: message.metadata,
    moderation_status: message.moderationStatus,
    is_visible: message.isVisible,
    is_archived: message.isArchived
  };
}

/**
 * Transform backend MessageData to frontend Message format
 */
export function messageDataToMessage(data: MessageData): Message {
  return {
    id: data.id,
    conversationId: data.conversation_id,
    authorPersonaId: data.author_persona_id,
    content: data.content,
    type: data.type,
    timestamp: new Date(data.created_at),
    sequenceNumber: data.sequence_number,
    isEdited: data.is_edited || false,
    editedAt: data.edited_at ? new Date(data.edited_at) : undefined,
    metadata: data.metadata || {
      wordCount: data.content.split(/\s+/).length,
      characterCount: data.content.length,
      readingTime: Math.ceil(data.content.split(/\s+/).length / 200) * 60,
      complexity: 0.5,
      aiGenerated: data.author_persona_id?.startsWith('ai-') || false
    },
    moderationStatus: data.moderation_status || 'approved',
    isVisible: data.is_visible !== false,
    isArchived: data.is_archived || false
  };
}

/**
 * Transform frontend Persona to backend PersonaData format
 */
export function personaToPersonaData(persona: Persona): PersonaData {
  return {
    id: persona.id,
    name: persona.name,
    type: persona.type,
    owner_id: persona.ownerId,
    description: persona.description,
    personality_traits: persona.personality,
    knowledge_areas: persona.knowledge,
    communication_style: persona.communicationStyle,
    model_config: persona.modelConfig,
    system_prompt: persona.systemPrompt,
    response_time_range: persona.responseTimeRange,
    typing_speed: persona.typingSpeed,
    is_public: persona.isPublic,
    allowed_interactions: persona.allowedInteractions,
    conversation_count: persona.conversationCount,
    total_messages: persona.totalMessages,
    average_rating: persona.averageRating,
    created_at: persona.createdAt.toISOString(),
    updated_at: persona.updatedAt.toISOString()
  };
}

/**
 * Transform backend PersonaData to frontend Persona format
 */
export function personaDataToPersona(data: PersonaData): Persona {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    ownerId: data.owner_id,
    description: data.description,
    personality: data.personality_traits || {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      creativity: 50,
      assertiveness: 50,
      empathy: 50
    },
    knowledge: data.knowledge_areas || [],
    communicationStyle: data.communication_style,
    modelConfig: data.model_config,
    systemPrompt: data.system_prompt,
    responseTimeRange: data.response_time_range,
    typingSpeed: data.typing_speed,
    isPublic: data.is_public,
    allowedInteractions: data.allowed_interactions || [],
    conversationCount: data.conversation_count || 0,
    totalMessages: data.total_messages || 0,
    averageRating: data.average_rating || 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

/**
 * Batch transform messages
 */
export function transformMessages(messages: MessageData[]): Message[] {
  return messages.map(messageDataToMessage);
}

/**
 * Batch transform personas
 */
export function transformPersonas(personas: PersonaData[]): Persona[] {
  return personas.map(personaDataToPersona);
}