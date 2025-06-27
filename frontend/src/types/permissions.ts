/**
 * Conversation Permissions
 * 
 * Permissions are now determined by the backend and returned with API responses.
 * Frontend components use these permissions to control UI elements.
 */

export interface ConversationPermissions {
  canView: boolean;
  canAddMessage: boolean;
  canJoin: boolean;
  canClose: boolean;
  canAddParticipant: boolean;
  canRemoveParticipant: boolean;
  canDelete: boolean;
}