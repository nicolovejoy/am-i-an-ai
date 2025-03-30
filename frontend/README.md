# Am I an AI? (Next.js Version)

This is the Next.js version of the "Am I an AI?" application, built for clean, modern design and focused user experience.

## Features

- 🚀 Built with Next.js 15
- ⚛️ Using React 19
- 🎨 Clean, modern design system
- 📱 Fully responsive for all device sizes
- ⚡ Static site generation for optimal performance
- 🎯 Simplified, purposeful UI

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/amianai.git
   cd amianai/frontend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Run the development server

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/               # App Router pages
│   ├── page.tsx      # Home page
│   ├── about/        # About page
│   └── not-found.tsx # 404 page
├── components/        # Reusable components
│   ├── ChatContainer.tsx    # Main chat interface
│   ├── ChatInterface.tsx    # Chat implementation
│   └── NavMenu.tsx         # Navigation menu
├── hooks/            # Custom React hooks
├── lib/             # Utilities and constants
│   └── designSystem.ts     # Design system definitions
├── test/            # Test utilities
└── types/           # TypeScript type definitions
```

## Key Technologies

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest and React Testing Library

## Design System

The application uses a clean, modern design system:

- **Colors**: Professional palette with kelp brown accents
- **Typography**: Clear hierarchy with Inter font
- **Components**: Minimal, focused UI elements
- **Layout**: Centered, readable content areas

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:

- Component rendering
- User experience
- Accessibility
- Responsive design

## Development Workflow

1. Make changes in a feature branch
2. Run tests and linting
3. Build and check production build
4. Create pull request
5. Deploy after review

## Future Enhancements

- Enhanced user experience
- Additional accessibility features
- Performance optimizations
- Extended test coverage

## License

[MIT License](LICENSE)
