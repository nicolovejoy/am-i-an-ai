# Design System & UI Components

## Clean, Modern Design

The "Am I an AI?" application features a clean, modern design that prioritizes readability and usability. The interface uses a carefully selected color palette and typography to create an engaging but professional experience.

## Design System File

The design system is centralized in a single TypeScript file (`frontend/src/designSystem.ts`) that defines all styling choices, making it easier to maintain consistent aesthetics across the application.

### Key Components

```typescript
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
```

The design system includes:

- **Color Palette**: A carefully selected set of colors that provide good contrast and readability
- **Typography**: Clean, modern fonts with a clear hierarchy
- **Spacing**: Consistent spacing variables for layout and components
- **Border Radius**: Subtle rounded corners for UI elements
- **Shadows**: Light shadows for depth and elevation
- **Animation Timings**: Standard durations for transitions
- **Breakpoints**: Responsive design breakpoints
- **Component Styles**: Standard styling for common components

## Typography

The application uses two main font families:

- **Inter**: A modern, highly readable sans-serif font for general text
- **IBM Plex Mono**: A clean monospace font for technical content

### Font Weights

- Regular (400)
- Medium (500)
- Semibold (600)

### Font Sizes

- Small: 0.875rem
- Base: 1rem
- Large: 1.125rem
- Extra Large: 1.25rem
- 2XL: 1.5rem

## Components

### Cards

Cards are used to contain related content:

- White background
- Light border
- Subtle shadow
- Rounded corners
- Consistent padding

### Buttons

Two main button styles:

- Primary: Kelp brown background with white text
- Secondary: White background with dark text and border

### Forms

Form elements feature:

- Clean, minimal styling
- Clear focus states
- Consistent spacing
- Helpful placeholder text

### Navigation

The navigation system includes:

- Clean, minimal top bar
- Clear active states
- Responsive design
- Accessible links

## Layout

The application uses a clean, centered layout with:

- Maximum width constraints for readability
- Consistent padding and margins
- Responsive breakpoints
- Clear visual hierarchy

## Best Practices

1. **Accessibility**: All components meet WCAG 2.1 guidelines
2. **Responsiveness**: Design works well on all screen sizes
3. **Performance**: Minimal use of animations and effects
4. **Consistency**: Use design system tokens for all styling
5. **Simplicity**: Keep the interface clean and focused
