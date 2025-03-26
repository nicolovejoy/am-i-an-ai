// Design System for the "Am I an AI?" application
// Simple, clean, and practical design choices

// Color Palette
export const colors = {
  // Base colors
  background: "#F8F9FA", // Light gray background
  surface: "#FFFFFF", // White for cards and surfaces
  text: {
    primary: "#2D3748", // Dark gray for main text
    secondary: "#4A5568", // Medium gray for secondary text
    light: "#718096", // Light gray for subtle text
  },
  border: "#E2E8F0", // Light gray for borders
  primary: "#8B6B4A", // Kelp brown for primary actions
  secondary: "#4A5568", // Gray for secondary actions
  success: "#48BB78", // Green for success states
  warning: "#ECC94B", // Yellow for warnings
  error: "#F56565", // Red for errors
};

// Typography
export const typography = {
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "IBM Plex Mono, monospace",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 600,
  },
  fontSize: {
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
  },
};

// Spacing
export const spacing = {
  xs: "0.5rem",
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
  xl: "3rem",
};

// Border Radius
export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
};

// Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

// Animation timings
export const animation = {
  fast: "150ms",
  medium: "200ms",
};

// Breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
};

// Media queries
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
};

// Common component styling
export const componentStyles = {
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    boxShadow: shadows.sm,
  },
  button: {
    primary: {
      background: colors.primary,
      color: colors.surface,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.sm,
      transition: `all ${animation.medium}`,
      hoverBackground: "#6B5239", // Darker kelp brown for hover
    },
    secondary: {
      background: colors.surface,
      color: colors.text.primary,
      border: `1px solid ${colors.border}`,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.sm,
      transition: `all ${animation.medium}`,
      hoverBackground: colors.background,
    },
  },
  mainContent: {
    paddingMobile: spacing.sm,
    paddingDesktop: spacing.md,
  },
};
