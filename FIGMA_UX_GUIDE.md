# RobotOrchestra Figma UX Design Guide

## Getting Started with Figma

### What is Figma?
Figma is a collaborative web-based design tool used for creating user interfaces, prototypes, and design systems. Think of it as Photoshop meets Google Docs - you can design interfaces and multiple people can work on them simultaneously.

### Setting Up Your Figma Workspace

1. **Create Your First File**
   - Go to figma.com and sign in
   - Click "New design file" or press Cmd+N (Mac) / Ctrl+N (Windows)
   - Name it "RobotOrchestra Design System"

2. **Basic Figma Concepts**
   - **Frames**: Containers for your designs (like artboards)
   - **Components**: Reusable design elements (like React components!)
   - **Auto Layout**: Makes designs responsive automatically
   - **Variants**: Different states of the same component

3. **Essential Keyboard Shortcuts**
   - `F` - Create Frame
   - `R` - Rectangle tool
   - `T` - Text tool
   - `V` - Select/Move tool
   - `Cmd/Ctrl + D` - Duplicate
   - `Cmd/Ctrl + G` - Group elements
   - `Shift + A` - Add Auto Layout

## RobotOrchestra Design Process

### Phase 1: Document Current State (Week 1)

1. **Take Screenshots**
   ```bash
   # Capture key screens at different states:
   - Dashboard (empty state, with matches)
   - Create match flow
   - Waiting room (empty, partially filled, ready)
   - Match interface (each round state)
   - Voting interface
   - Results screen
   ```

2. **Import to Figma**
   - Drag screenshots into Figma
   - Create a page called "Current State"
   - Organize by user flow

3. **Extract Current Design Patterns**
   - Colors: Document all grays currently used
   - Typography: Font sizes, weights, line heights
   - Spacing: Margins, padding, gaps
   - Components: Buttons, cards, inputs

### Phase 2: Build Design System (Week 1-2)

1. **Create Color Palette**
   ```
   Current Colors to Document:
   - Background: #1a1a1a (dark mode)
   - Cards: #2a2a2a
   - Text: #ffffff, #aaaaaa
   - Accent: (currently none - opportunity!)
   
   Suggested Additions:
   - Primary: Electric blue (#00D4FF)
   - Success: Green (#00FF88)
   - Error: Red (#FF4444)
   - Warning: Orange (#FF8800)
   ```

2. **Define Typography Scale**
   ```
   Headings:
   - H1: 32px, bold
   - H2: 24px, semibold
   - H3: 20px, medium
   
   Body:
   - Large: 18px
   - Regular: 16px
   - Small: 14px
   ```

3. **Create Base Components**
   - Buttons (primary, secondary, disabled states)
   - Cards (match card, response card)
   - Input fields
   - Countdown timer
   - Score displays

### Phase 3: Design New Screens (Week 2-3)

1. **Start with Mobile First**
   - iPhone 14 frame (390 x 844)
   - Design key screens for small viewport
   - Use Auto Layout for responsive behavior

2. **Key Screens to Redesign**
   
   **Welcome Dashboard**
   - Add visual interest with illustrations/graphics
   - Better hierarchy for create vs join actions
   - Show recent matches more prominently
   
   **Match Interface** 
   - Enhanced accordion with visual states
   - More prominent scoreboard
   - Better response cards with hover states
   - Animated countdown timer design
   
   **Voting Interface**
   - Make voting more game-like
   - Visual feedback for selection
   - Progress indicator
   
   **Results Screen**
   - Celebration animations
   - Clear winner announcement
   - Share functionality

3. **Create Interaction Prototypes**
   - Link screens together
   - Add hover states
   - Show loading states
   - Demonstrate animations

### Phase 4: Component Variants (Week 3)

Create variations for different states:

1. **Button Component**
   - Default, Hover, Active, Disabled
   - Primary, Secondary, Danger
   - Small, Medium, Large

2. **Response Cards**
   - Unselected, Selected, Correct, Incorrect
   - With/without voting results

3. **Player Indicators**
   - Human vs Robot visual distinction
   - Different robot personalities
   - Active/Inactive states

## Figma Best Practices for Developers

1. **Use Consistent Naming**
   ```
   Components/Button/Primary/Default
   Components/Button/Primary/Hover
   Colors/Brand/Primary-500
   ```

2. **Design Tokens**
   Create variables for:
   - Colors
   - Spacing (8px grid system)
   - Border radius
   - Shadows

3. **Developer Handoff**
   - Use Figma's Dev Mode
   - Add component descriptions
   - Specify animations/transitions
   - Include responsive breakpoints

4. **Maintain Design-Code Parity**
   - Name Figma components like React components
   - Use same color variables
   - Document state management

## Learning Resources

### Figma Basics
1. **Official Figma Tutorial** (1 hour)
   - figma.com/resources/learn-design/lessons/
   - Start with "Figma basics" course

2. **YouTube Channels**
   - Figma official channel
   - DesignCourse
   - The Futur

3. **Practice Exercises**
   - Recreate existing RobotOrchestra screens
   - Design a new feature (e.g., user profiles)
   - Create loading/empty states

### Specific to RobotOrchestra

1. **Study Similar Games**
   - Among Us (voting mechanics)
   - Jackbox Games (party game UI)
   - Kahoot (real-time quiz UI)

2. **Design Principles**
   - Keep it playful but readable
   - Ensure accessibility (contrast ratios)
   - Design for 10-second understanding
   - Make voting feel consequential

## Next Steps

1. **This Week**
   - Install Figma desktop app
   - Complete basic tutorial
   - Screenshot current app states
   - Create first frame with existing dashboard

2. **Next Week**
   - Build color palette
   - Create button component with variants
   - Design improved match interface
   - Get feedback from users

3. **Ongoing**
   - Test designs on actual devices
   - Create clickable prototypes
   - Document animation ideas
   - Iterate based on user feedback

## Tips for Success

- **Start Simple**: Don't try to redesign everything at once
- **Copy First**: Recreate existing screens before innovating
- **Get Feedback Early**: Share designs with others
- **Think in Systems**: Create reusable components
- **Consider Context**: Design for both new and returning users
- **Have Fun**: This is a game - the design should reflect that!

## Useful Figma Plugins

- **Unsplash**: Free stock photos
- **Iconify**: Massive icon library
- **Stark**: Accessibility checking
- **Lorem Ipsum**: Placeholder text
- **Color Palettes**: Generate color schemes

Remember: Good design is iterative. Your first version won't be perfect, and that's okay!