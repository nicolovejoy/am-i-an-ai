# Am I an AI? (Next.js Version)

This is the Next.js version of the "Am I an AI?" application, migrated from Create React App for improved performance, developer experience, and future scalability.

## Features

- 🚀 Built with Next.js 15
- ⚛️ Using React 19
- 🔍 AI-powered text analysis
- 💻 80's retro-futuristic design
- 📱 Fully responsive for all device sizes
- ⚡ Server-side rendering for improved performance
- 🔒 Authentication and account management
- 🔄 Advanced state management with Zustand and React Query

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/amianai.git
   cd amianai/frontend-next
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/               # App Router pages
│   ├── page.tsx       # Home page
│   ├── analysis/      # Text analysis page
│   ├── about/         # About page
│   ├── donate/        # Donation page
│   └── account/       # User account page
├── components/        # Reusable components
├── hooks/             # Custom React hooks
│   └── useQueries.ts  # React Query hooks
├── providers/         # Context providers
│   ├── QueryProvider.tsx    # React Query provider
│   └── AuthProvider.tsx     # Authentication provider
├── store/             # Zustand stores
│   └── useAuthStore.ts      # Auth state management
├── services/          # API services
│   └── api.ts         # API service functions
└── public/            # Static assets
    └── images/        # Image files
```

## Key Technologies

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**:
  - **Zustand**: For global UI state and authentication
  - **React Query**: For server state, data fetching, and caching
- **Testing**: Jest and React Testing Library

## State Management Architecture

The application uses a hybrid state management approach:

### Client State (Zustand)

- Authentication state (login status, user info)
- UI state (theme preferences, modal visibility)
- Persisted with localStorage for session continuity

### Server State (React Query)

- Remote data fetching with automatic caching
- Optimistic updates for mutations
- Automatic refetching and background updates
- Loading and error states

This separation provides cleaner code organization and better performance.

## User Account Implementation Plan

Currently, the application uses a simulated authentication system with mock data. To implement real user accounts, the following steps are planned:

### Phase 1: Backend Setup

- [ ] Set up a backend service (Node.js/Express, Python/FastAPI, or serverless functions)
- [ ] Implement a database solution (MongoDB, PostgreSQL, Supabase, or Firebase)
- [ ] Create user account schema with necessary fields (name, email, password hash, etc.)
- [ ] Implement secure password hashing and storage

### Phase 2: API Development

- [ ] Create RESTful endpoints for authentication:
  - [ ] User registration with email verification
  - [ ] Login with JWT token generation
  - [ ] Password reset functionality
  - [ ] Account management (update profile, delete account)
- [ ] Implement secure session management
- [ ] Set up API rate limiting and security measures

### Phase 3: Frontend Integration

- [ ] Update the API service to connect to the real backend
- [ ] Enhance form validation and error handling
- [ ] Implement email verification flow
- [ ] Add password reset functionality
- [ ] Create account settings page for profile management

### Phase 4: Enhanced Features

- [ ] Social authentication (Google, GitHub, etc.)
- [ ] User roles and permissions
- [ ] Activity tracking and usage statistics
- [ ] User preferences and settings
- [ ] Premium account features

### Phase 5: Testing and Deployment

- [ ] Comprehensive testing of authentication flows
- [ ] Security audit and penetration testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Staging and production deployment

## Future Enhancements

- Enhanced text analysis capabilities
- More extensive account features
- Additional retro-themed UI elements
- Advanced data visualization

## License

[MIT License](LICENSE)
