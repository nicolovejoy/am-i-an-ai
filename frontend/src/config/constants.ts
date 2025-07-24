// Project constants and configuration

export const PROJECT_INFO = {
  name: 'Robot Orchestra',
  description: 'An experimental platform exploring trust and collaboration between humans and AI through anonymized matches where participants try and determine who is human and who is a robot (AI).',
  tagline: 'Where humans and AI collaborate',
  website: 'https://robotorchestra.org'
} as const;

export const GAME_CONFIG = {
  totalRounds: 5,
  participantsPerMatch: 4, // Default, but matches can have 3-8
  humansPerMatch: 2,
  aiPerMatch: 2,
  messageMaxLength: 150,
  minParticipants: 3,
  maxParticipants: 8
} as const;

// All possible identities (matches will use a subset)
export const ALL_IDENTITIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
export type Identity = typeof ALL_IDENTITIES[number];

// Legacy export for backward compatibility
export const IDENTITIES = ALL_IDENTITIES;