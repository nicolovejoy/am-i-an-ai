import type { Identity } from '../schemas/match.schema';

/**
 * Generate an array of identities based on participant count
 * @param count Number of participants (3-8)
 * @returns Array of identities ['A', 'B', 'C', ...]
 */
export function generateIdentities(count: number): Identity[] {
  if (count < 3 || count > 8) {
    throw new Error(`Invalid participant count: ${count}. Must be between 3 and 8.`);
  }
  
  return Array.from({ length: count }, (_, i) => 
    String.fromCharCode(65 + i) as Identity
  );
}

/**
 * Get the total number of participants for a match
 * @param match Match object with totalParticipants or participants array
 * @returns Total participant count
 */
export function getParticipantCount(match: { 
  totalParticipants?: number; 
  participants?: Array<any>;
}): number {
  // Prefer totalParticipants if available
  if (match.totalParticipants !== undefined) {
    return match.totalParticipants;
  }
  
  // Fall back to participants array length
  if (match.participants) {
    return match.participants.length;
  }
  
  // Default to 4 for backward compatibility
  return 4;
}

/**
 * Check if all participants have responded in a round
 * @param responses Object with identity keys and response values
 * @param totalParticipants Expected total number of participants
 * @returns Boolean indicating if all responses are in
 */
export function hasAllResponses(
  responses: Record<string, any>, 
  totalParticipants: number
): boolean {
  const responseCount = Object.keys(responses).length;
  return responseCount === totalParticipants;
}

/**
 * Get AI participant identities based on human identities and total count
 * @param humanIdentities Array of human participant identities
 * @param totalParticipants Total number of participants
 * @returns Array of AI participant identities
 */
export function getAIIdentities(
  humanIdentities: Identity[], 
  totalParticipants: number
): Identity[] {
  const allIdentities = generateIdentities(totalParticipants);
  return allIdentities.filter(id => !humanIdentities.includes(id));
}

/**
 * Validate participant count for a match template
 * @param count Number to validate
 * @returns Boolean indicating if count is valid
 */
export function isValidParticipantCount(count: number): boolean {
  return count >= 3 && count <= 8;
}