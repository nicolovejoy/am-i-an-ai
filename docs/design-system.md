# Design System & UI Components

## 80's Retro-Futuristic Design

The "Am I an AI?" application features a distinctive 1980's retro-futuristic design with cyberpunk and sci-fi influences. The interface combines neon colors, grid patterns, and elements reminiscent of classic Atari games and 80's pop culture.

## Design System File

The design system is centralized in a single TypeScript file (`frontend/src/designSystem.ts`) that defines all styling choices, making it easier to maintain consistent aesthetics across the application.

### Key Components

```typescript
// Color Palette
export const colors = {
  // Primary colors
  darkBlue: "var(--dark-blue)", // Main background
  mediumBlue: "var(--medium-blue)", // Nav background
  neonBlue: "var(--neon-blue)", // Primary accent
  neonPink: "var(--neon-pink)", // Secondary accent
  neonPurple: "var(--neon-purple)", // Tertiary accent

  // Text colors
  textPrimary: "var(--text-color)",
  textSecondary: "var(--text-secondary)",

  // Functional colors
  success: "var(--success-color)",
  warning: "var(--warning-color)",
  error: "var(--error-color)",
};
```

The design system includes:

- **Color Palette**: Neon blues, pinks, and purples against dark backgrounds
- **Typography**: Font families, weights, and sizes
- **Spacing**: Consistent spacing variables
- **Border Radius**: Rounded corners for UI elements
- **Shadows**: Glow effects for neon elements
- **80's Themed Icons**: References to Atari games and 80's culture
- **Animation Timings**: Standard durations for transitions
- **Z-index Scale**: Layering system for elements
- **Breakpoints**: Responsive design breakpoints
- **Component Styles**: Standard styling for common components

## Custom App Icon

The application features a custom SVG icon component (`AppIcon.tsx`) that creates a retro-futuristic robot head with cyberpunk styling:

```typescript
interface AppIconProps {
  className?: string;
  width?: number;
  height?: number;
  glowColor?: string;
}

const AppIcon: React.FC<AppIconProps> = ({
  className = "",
  width = 100,
  height = 100,
  glowColor = "var(--neon-blue)",
}) => {
  // SVG implementation with:
  // - Robot head with neon outlines
  // - Grid background
  // - Glow effects
  // - Binary code elements
  // - "AI?" text
};
```

The icon is fully customizable with props for:

- Size (width/height)
- Glow color
- Additional CSS classes

## Retro 80's Sidebar

The sidebar component is a key UI element that showcases the 80's aesthetic:

```typescript
interface SidebarProps {
  isLoggedIn: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isLoggedIn }) => {
  // Implementation with:
  // - App icon at the top
  // - 80's-themed navigation icons
  // - Hover effects with neon glows
  // - Decorative section with retro icons
  // - Scanline overlay effect
};
```

### Features

- **Retro Icons**: Uses emoji icons representing 80's culture (game controllers, VHS tapes, floppy disks)
- **Atari References**: Special section with references to classic games like Pac-Man, Space Invaders, and Tetris
- **Neon Glow Effects**: Interactive elements have neon glow effects on hover
- **Scanlines Effect**: Subtle scanline overlay mimicking old CRT monitors
- **Responsive Design**: Collapsible sidebar that works on mobile and desktop

## Navigation

The navigation system includes:

- **Top Navigation Bar**: For primary navigation
- **Sidebar Toggle**: Button to show/hide the retro sidebar
- **Mobile Responsiveness**: Adjusts for different screen sizes

## Overall UI Elements

The interface incorporates several distinctive elements:

- **Grid Backgrounds**: Tron-like grid patterns in the background
- **Terminal-style UI**: Command-line inspired interface elements
- **Neon Text**: Glowing text effects for headings
- **Sci-fi Buttons**: Futuristic button styling
- **Retro Animations**: 80's-inspired transition effects
