// Player configuration for the game
// Easily configurable colors and positions

export interface PlayerConfig {
  number: 1 | 2 | 3 | 4;
  color: string;
  bgColor: string;
  borderColor: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  label: string;
  name: string;
}

export const PLAYER_COLORS = {
  1: {
    primary: '#3B82F6',     // blue-500
    background: '#DBEAFE',  // blue-100
    border: '#93C5FD'       // blue-300
  },
  2: {
    primary: '#10B981',     // green-500
    background: '#D1FAE5',  // green-100
    border: '#86EFAC'       // green-300
  },
  3: {
    primary: '#881337',     // rose-900
    background: '#FCE7F3',  // pink-100
    border: '#F9A8D4'       // pink-300
  },
  4: {
    primary: '#A855F7',     // fuchsia-500
    background: '#FAE8FF',  // fuchsia-100
    border: '#E9D5FF'       // fuchsia-300
  }
} as const;

// Identity mapping: A=Ashley, B=Brianna, C=Chloe, D=David
export const IDENTITY_NAMES = {
  A: 'Ashley',
  B: 'Brianna',
  C: 'Chloe',
  D: 'David'
} as const;

export const PLAYER_CONFIG: Record<1 | 2 | 3 | 4, PlayerConfig> = {
  1: {
    number: 1,
    color: PLAYER_COLORS[1].primary,
    bgColor: PLAYER_COLORS[1].background,
    borderColor: PLAYER_COLORS[1].border,
    position: 'top-left',
    label: 'Player 1',
    name: 'Player 1' // Will be overridden by identity mapping
  },
  2: {
    number: 2,
    color: PLAYER_COLORS[2].primary,
    bgColor: PLAYER_COLORS[2].background,
    borderColor: PLAYER_COLORS[2].border,
    position: 'top-right',
    label: 'Player 2',
    name: 'Player 2' // Will be overridden by identity mapping
  },
  3: {
    number: 3,
    color: PLAYER_COLORS[3].primary,
    bgColor: PLAYER_COLORS[3].background,
    borderColor: PLAYER_COLORS[3].border,
    position: 'bottom-left',
    label: 'Player 3',
    name: 'Player 3' // Will be overridden by identity mapping
  },
  4: {
    number: 4,
    color: PLAYER_COLORS[4].primary,
    bgColor: PLAYER_COLORS[4].background,
    borderColor: PLAYER_COLORS[4].border,
    position: 'bottom-right',
    label: 'Player 4',
    name: 'Player 4' // Will be overridden by identity mapping
  }
};

// Map identity (A,B,C,D) to player number (1,2,3,4)
// This mapping is randomized per session
export function getPlayerNumber(identity: 'A' | 'B' | 'C' | 'D', identityMapping: Record<string, number>): 1 | 2 | 3 | 4 {
  return (identityMapping[identity] || 1) as 1 | 2 | 3 | 4;
}

// Get player config by identity
export function getPlayerConfigByIdentity(identity: 'A' | 'B' | 'C' | 'D', identityMapping: Record<string, number>): PlayerConfig {
  const playerNumber = getPlayerNumber(identity, identityMapping);
  return PLAYER_CONFIG[playerNumber];
}