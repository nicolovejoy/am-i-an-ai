// Rocket League bot names for AI players
export const ROCKET_LEAGUE_BOT_NAMES = [
  'Sundown',
  'Bandit', 
  'Maverick',
  'Beast',
  'Boomer',
  'Buzz',
  'Casper',
  'Caveman',
  'Chipper',
  'Cougar',
  'Dude',
  'Fury',
  'Gerwin',
  'Goose',
  'Heater',
  'Hollywood',
  'Hound',
  'Iceman',
  'Imp',
  'Jester',
  'Junker',
  'Khan',
  'Marley',
  'Merlin',
  'Middy',
  'Mountain',
  'Myrtle',
  'Outlaw',
  'Poncho',
  'Rainmaker',
  'Rex',
  'Roundhouse',
  'Sabretooth',
  'Saltie',
  'Samara',
  'Scout',
  'Shepard',
  'Slider',
  'Squall',
  'Sticks',
  'Stinger',
  'Storm',
  'Sultan',
  'Swabbie',
  'Tex',
  'Tusk',
  'Viper',
  'Wolfman',
  'Yuri'
];

// Map personality types to suitable bot names
export const PERSONALITY_TO_BOT_MAP: Record<string, string[]> = {
  sundown: ['Sundown', 'Fury', 'Sabretooth', 'Viper', 'Storm'],
  bandit: ['Bandit', 'Outlaw', 'Imp', 'Jester', 'Swabbie'],
  maverick: ['Maverick', 'Iceman', 'Goose', 'Hollywood', 'Wolfman']
};

// Get a bot name for a given index (cycles through the list)
export function getBotName(index: number): string {
  return ROCKET_LEAGUE_BOT_NAMES[index % ROCKET_LEAGUE_BOT_NAMES.length];
}

// Get a bot name that matches a personality type
export function getBotNameForPersonality(personality: string, index: number = 0): string {
  const suitableNames = PERSONALITY_TO_BOT_MAP[personality] || ROCKET_LEAGUE_BOT_NAMES;
  return suitableNames[index % suitableNames.length];
}