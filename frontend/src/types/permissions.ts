// Permission System for AmIAnAI
// Hierarchical actor model with AI agents as special system personas

export type ActorType = 'user' | 'persona' | 'agent' | 'system';

export type AgentRole = 'amy' | 'clara' | 'ray_gooler' | 'god';

export type Permission = 
  // Conversation permissions
  | 'conversation.create'
  | 'conversation.read'
  | 'conversation.update'
  | 'conversation.close'
  | 'conversation.archive'
  | 'conversation.delete'
  
  // Message permissions
  | 'message.create'
  | 'message.read'
  | 'message.edit'
  | 'message.delete'
  | 'message.moderate'
  
  // Participant permissions
  | 'participant.add'
  | 'participant.remove'
  | 'participant.promote'
  
  // System permissions
  | 'system.override_rules'
  | 'system.emergency_action'
  | 'system.audit_access'
  | 'system.data_cleanup'
  
  // Content moderation
  | 'moderation.flag_content'
  | 'moderation.remove_content'
  | 'moderation.ban_user';

export interface Actor {
  id: string;
  type: ActorType;
  name: string;
  role?: AgentRole; // Only for agent types
  permissions: Permission[];
  created_by?: string; // For personas created by users
  is_system_agent?: boolean;
}

// AI Agent Definitions
export const AI_AGENTS: Record<AgentRole, Omit<Actor, 'id'>> = {
  amy: {
    type: 'agent',
    name: 'Amy',
    role: 'amy',
    is_system_agent: true,
    permissions: [
      'conversation.create',
      'conversation.read',
      'message.create',
      'participant.add',
      'moderation.flag_content'
    ]
  },
  
  clara: {
    type: 'agent', 
    name: 'Clara',
    role: 'clara',
    is_system_agent: true,
    permissions: [
      'conversation.read',
      'conversation.close',
      'conversation.archive',
      'message.delete',
      'system.data_cleanup',
      'moderation.remove_content'
    ]
  },
  
  ray_gooler: {
    type: 'agent',
    name: 'Ray Gooler', 
    role: 'ray_gooler',
    is_system_agent: true,
    permissions: [
      'conversation.read',
      'conversation.update',
      'system.override_rules',
      'system.audit_access',
      'moderation.flag_content',
      'moderation.ban_user'
    ]
  },
  
  god: {
    type: 'agent',
    name: 'God',
    role: 'god', 
    is_system_agent: true,
    permissions: [
      'conversation.create',
      'conversation.read', 
      'conversation.update',
      'conversation.close',
      'conversation.archive',
      'conversation.delete',
      'message.create',
      'message.read',
      'message.edit', 
      'message.delete',
      'message.moderate',
      'participant.add',
      'participant.remove',
      'participant.promote',
      'system.override_rules',
      'system.emergency_action',
      'system.audit_access',
      'system.data_cleanup',
      'moderation.flag_content',
      'moderation.remove_content',
      'moderation.ban_user'
    ]
  }
};

// Permission checker
export function hasPermission(actor: Actor, permission: Permission): boolean {
  return actor.permissions.includes(permission);
}

// Context-aware permission checking
export function canActorPerformAction(
  actor: Actor, 
  action: Permission, 
  context: {
    conversation?: any;
    target_user_id?: string;
    is_owner?: boolean;
    is_participant?: boolean;
  }
): boolean {
  // God can do anything (with ethical restraints built into God's logic)
  if (actor.role === 'god') {
    return hasPermission(actor, action);
  }
  
  // Basic permission check
  if (!hasPermission(actor, action)) {
    return false;
  }
  
  // Context-specific rules
  switch (action) {
    case 'conversation.close':
      return context.is_owner || context.is_participant || actor.role === 'clara';
      
    case 'message.delete':
      return context.target_user_id === actor.id || actor.role === 'clara';
      
    case 'system.override_rules':
      return actor.role === 'ray_gooler' || actor.role === 'god';
      
    default:
      return true;
  }
}