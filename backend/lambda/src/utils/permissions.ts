import { UserContext } from '../middleware/cognito-auth';
import { User, Persona } from '../types/database';
import { queryDatabase } from '../lib/database';

export function transformUserContext(userContext: UserContext): User {
  const user: User = {
    id: userContext.id!,
    username: userContext.email || 'unknown',
    role: userContext.cognitoGroups.includes('admin') ? 'admin' : 'regular',
    created_at: new Date(), // We don't have this from UserContext
    updated_at: new Date(), // We don't have this from UserContext
  };
  
  if (userContext.email) {
    user.email = userContext.email;
  }
  
  return user;
}

export async function getUserPersonas(userId: string): Promise<Persona[]> {
  const query = `
    SELECT id, name, type, owner_id, description, personality, knowledge,
           communication_style, model_config, system_prompt, response_time_range,
           typing_speed, is_public, allowed_interactions, conversation_count,
           total_messages, average_rating, created_at, updated_at
    FROM personas 
    WHERE owner_id = $1
  `;
  
  const result = await queryDatabase(query, [userId]);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    owner_id: row.owner_id,
    description: row.description,
    personality: row.personality,
    knowledge: row.knowledge,
    communication_style: row.communication_style,
    model_config: row.model_config,
    system_prompt: row.system_prompt,
    response_time_range: row.response_time_range,
    typing_speed: row.typing_speed,
    is_public: row.is_public,
    allowed_interactions: row.allowed_interactions || [],
    conversation_count: row.conversation_count || 0,
    total_messages: row.total_messages || 0,
    average_rating: row.average_rating || 0,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}