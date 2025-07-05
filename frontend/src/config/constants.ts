// Project constants and configuration

export const PROJECT_INFO = {
  name: 'Robot Orchestra',
  description: 'An experimental platform exploring trust and collaboration between humans and AI through anonymized matches where participants try and determine who is human and who is a robot (AI).',
  tagline: 'Where humans and AI collaborate',
  website: 'https://robotorchestra.org'
} as const;

export const GAME_CONFIG = {
  totalRounds: 5,
  participantsPerMatch: 4,
  humansPerMatch: 2,
  aiPerMatch: 2,
  messageMaxLength: 280
} as const;

export const IDENTITIES = ['A', 'B', 'C', 'D'] as const;
export type Identity = typeof IDENTITIES[number];