// Design System for the "Am I an AI?" application
// This file centralizes styling choices for consistency across components

// Color Palette
export const colors = {
  // Primary colors
  darkBlue: 'var(--dark-blue)', // Main background
  mediumBlue: 'var(--medium-blue)', // Nav background
  neonBlue: 'var(--neon-blue)', // Primary accent
  neonPink: 'var(--neon-pink)', // Secondary accent
  neonPurple: 'var(--neon-purple)', // Tertiary accent

  // Text colors
  textPrimary: 'var(--text-color)',
  textSecondary: 'var(--text-secondary)',

  // Functional colors
  success: 'var(--success-color)',
  warning: 'var(--warning-color)',
  error: 'var(--error-color)',
};

// Typography
export const typography = {
  fontFamily: {
    main: 'var(--main-font)',
    monospace: 'var(--monospace-font)',
  },
  fontWeight: {
    normal: 400,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
};

// Spacing
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.25rem',
  lg: '0.5rem',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  glow: (color: string) => `0 0 10px ${color}, 0 0 20px ${color}`,
};

// 80's themed icons for the application
export const retroIcons = {
  homeIcon: '🕹️', // Game controller
  analysisIcon: '🔍', // Magnifying glass
  aboutIcon: '📼', // VHS tape
  donateIcon: '💾', // Floppy disk
  accountIcon: '🖥️', // Old computer
  // Atari game references
  pacManIcon: '👾',
  spaceInvadersIcon: '👽',
  tetrisIcon: '🧱',
  // Additional 80's references
  rubiksCubeIcon: '🎮',
  walkmanIcon: '🎧',
  ghettoblasterIcon: '📻',
  // Animal icons
  dogIcon: '🐶',
  catIcon: '🐱',
};

// Animation timings
export const animation = {
  fast: '150ms',
  medium: '300ms',
  slow: '500ms',
};

// Z-index scale
export const zIndex = {
  base: 0,
  above: 10,
  nav: 40,
  modal: 100,
  tooltip: 200,
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Media queries for responsive design
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  // Special queries
  belowMd: `@media (max-width: ${breakpoints.md})`,
  dark: '@media (prefers-color-scheme: dark)',
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
};

// Common component styling
export const componentStyles = {
  card: {
    background: colors.mediumBlue,
    border: `1px solid ${colors.neonBlue}`,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  button: {
    primary: {
      background: 'transparent',
      border: `1px solid ${colors.neonBlue}`,
      color: colors.neonBlue,
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      transition: `all ${animation.medium}`,
      hoverBackground: 'rgba(67, 208, 255, 0.15)',
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${colors.neonPink}`,
      color: colors.neonPink,
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      transition: `all ${animation.medium}`,
      hoverBackground: 'rgba(255, 67, 178, 0.15)',
    },
  },
  mainContent: {
    paddingMobile: `${spacing.sm} ${spacing.md}`,
    paddingDesktop: `${spacing.md} ${spacing.lg}`,
  },
};
