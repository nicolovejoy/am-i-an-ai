// Database types for backend Lambda functions

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'regular' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Persona {
  id: string;
  name: string;
  type: 'human_persona' | 'ai_agent' | 'ai_ambiguous';
  owner_id: string;
  description?: string;
  personality?: any; // JSONB
  knowledge?: string[];
  communication_style?: string;
  model_config?: any; // JSONB
  system_prompt?: string;
  response_time_range?: any; // JSONB
  typing_speed?: number;
  is_public: boolean;
  allowed_interactions?: string[];
  conversation_count?: number;
  total_messages?: number;
  average_rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PersonaInstance {
  personaId: string;
  role: 'initiator' | 'responder';
  isRevealed: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  topic: string;
  description?: string;
  participants: PersonaInstance[];
  metadata?: {
    visibility?: 'public' | 'private' | 'unlisted';
    tags?: string[];
    featured?: boolean;
    priority?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
  settings?: any; // JSONB
  constraints?: any; // JSONB
  goal?: any; // JSONB
  status: 'active' | 'paused' | 'completed' | 'terminated';
  can_add_messages: boolean;
  initiator_persona_id?: string;
  permission_overrides?: any; // JSONB
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  persona_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system' | 'reveal';
  metadata?: any; // JSONB
  is_flagged?: boolean;
  flag_reason?: string;
  created_at: Date;
  updated_at: Date;
}