# Migrating from Create React App to Next.js

## Why Migrate to Next.js?

Our "Am I an AI?" application is currently built with Create React App (CRA), which has served us well for initial development. However, migrating to Next.js offers several compelling benefits:

### Performance Benefits

- **Server-Side Rendering (SSR)**: Improves initial page load times and SEO
- **Automatic Code Splitting**: Only loads JavaScript needed for each page
- **Image Optimization**: Automatic image optimization with `next/image`
- **Font Optimization**: Better loading of web fonts with `next/font`

### Developer Experience Benefits

- **File-based Routing**: Simplifies routing compared to React Router
- **API Routes**: Built-in API functionality without needing a separate server
- **Hot Module Replacement**: Faster refresh times during development
- **TypeScript Integration**: First-class TypeScript support

### Future-Proofing

- **React Server Components**: Access to the latest React features
- **Incremental Static Regeneration**: Smart caching and revalidation
- **Edge Runtime Support**: Deploy portions of your app to the edge

## Migration Strategy

We'll follow these key principles during our migration:

1. **Incremental Migration**: Convert one page/component at a time
2. **Feature Parity First**: Ensure existing functionality works before adding new features
3. **Comprehensive Testing**: Verify each step of the migration
4. **No User Disruption**: Maintain a working application throughout the process

## Migration Phases

### Phase 1: Setup & Structure (Current Sprint)

- [x] Create branch for Next.js migration
- [x] Set up new Next.js project with TypeScript
- [x] Configure Tailwind CSS
- [x] Set up equivalent folder structure
- [ ] Configure environment variables

### Phase 2: Core Components & Utilities

- [x] Migrate design system and theme files
- [x] Migrate shared components (NavMenu, etc.)
- [x] Update image usage to use `next/image`
- [x] Adjust imports and relative paths

### Phase 3: Page Migration

- [x] Convert Home page
- [x] Convert TextAnalysis page
- [x] Convert About page
- [x] Convert Donate page
- [x] Convert Account page

### Phase 4: Routing & Navigation

- [x] Update navigation to use Next.js Link component
- [x] Implement routing with Next.js file-based system
- [ ] Set up dynamic routes where needed
- [ ] Handle navigation layouts

### Phase 5: API Integration & State Management

- [x] Implement API routes for any backend functionality
- [x] Update API service calls
- [x] Migrate state management approaches where needed
- [x] Implement hybrid state management with Zustand and React Query

### Phase 6: Testing & Optimization

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] SEO enhancements
- [ ] Accessibility testing

### Phase 7: Deployment

- [ ] Configure deployment setup
- [ ] CI/CD pipeline adjustments
- [ ] Monitoring and analytics setup

## Specific Component Migration Notes

### Pages → App Router

Our pages will be restructured according to Next.js 13+ App Router:

| Current Path       | New Path                |
| ------------------ | ----------------------- |
| `Home.tsx`         | `app/page.tsx`          |
| `TextAnalysis.tsx` | `app/analysis/page.tsx` |
| `About.tsx`        | `app/about/page.tsx`    |
| `Donate.tsx`       | `app/donate/page.tsx`   |
| `Account.tsx`      | `app/account/page.tsx`  |

### Components

Components will largely remain the same, with updates to imports and Next.js-specific features:

- Update image tags to use `next/image`
- Replace React Router's `Link` with Next.js `Link`
- Convert client-side navigation logic to use Next.js patterns

### State Management

We've implemented a hybrid state management approach that combines:

#### Zustand for Client State

- Used for UI state and authentication state
- Lightweight and simple API with hooks-based access
- Persists authentication state in localStorage
- Provides global state without prop drilling or complex context setup

#### React Query for Server State

- Used for data fetching, caching, and synchronization with the server
- Provides built-in loading and error states
- Handles caching and background refetching
- Offers mutations with optimistic updates

This separation allows us to:

- Keep UI state changes snappy and responsive
- Decouple server state concerns from UI logic
- Implement proper loading and error handling
- Maintain a clean and maintainable codebase

#### Implementation Details

- **`useAuthStore.ts`**: Zustand store for authentication state
- **`AuthProvider.tsx`**: Provider that initializes auth state from localStorage
- **`QueryProvider.tsx`**: Wraps the app with React Query's provider
- **`useQueries.ts`**: Custom React Query hooks for data fetching and mutations
- **`api.ts`**: API service functions for data fetching and mutations

### Styling

We'll continue using Tailwind CSS with minimal changes:

- Configure Tailwind in `tailwind.config.js` for Next.js
- Ensure proper purging of unused styles
- Maintain our existing design system

## Testing Plan

- Each migrated component will be tested individually
- Full page testing after component migration
- End-to-end user flow testing
- Performance benchmarking before/after

## Running and Testing the Next.js Application

### Development Mode

To run the application in development mode:

```bash
cd frontend-next
npm run dev
```

This will start the development server at http://localhost:3000 with hot-reloading enabled.

### Building for Production

To create a production build:

```bash
cd frontend-next
npm run build
```

To serve the production build locally:

```bash
npm start
```

### Testing

1. **Component Testing**: We'll implement Jest and React Testing Library for component tests.

   - Test files will be placed next to the components they test with the format `[Component].test.tsx`
   - Component tests will focus on rendering, user interactions, and state changes

2. **Integration Testing**: These tests will ensure different parts of the application work together correctly.

3. **End-to-End Testing**: We'll use Cypress for E2E tests to simulate real user journeys through the application.

## Common Issues and Troubleshooting

### State Management Issues

1. **Server-Side Rendering with Client Libraries**: When using Zustand or React Query with Next.js, ensure:

   - All components using these libraries are marked with `"use client"`
   - Code accessing browser APIs like `localStorage` is protected with `typeof window !== 'undefined'` checks
   - Providers are properly set up in the component tree

2. **React Query Errors**:

   - If you see "React Query provider is missing" errors, check that `QueryProvider` is wrapping your application
   - For hydration mismatches, ensure your key structure is consistent between server and client

3. **Zustand Persistence Issues**:
   - If auth state isn't persisting between refreshes, check localStorage access and parsing logic
   - Clear localStorage if schema changes during development

### Tailwind CSS Issues

If Tailwind CSS utility classes like `bg-dark-blue` aren't working in production builds, check the following:

1. **CSS Variables**: Make sure the CSS variables in `src/app/globals.css` are properly defined in the `:root` selector.

2. **Tailwind Configuration**: Ensure custom colors are correctly defined in `tailwind.config.ts`:

   ```js
   theme: {
     extend: {
       colors: {
         "dark-blue": "var(--dark-blue)",
         // Other colors...
       }
     }
   }
   ```

3. **Content Configuration**: Check that the `content` array in `tailwind.config.ts` includes all files where you use Tailwind classes.

4. **PostCSS Configuration**: Verify `postcss.config.mjs` correctly references the Tailwind plugin.

5. **JIT Mode**: For Next.js 12+ and Tailwind CSS 3+, JIT (Just-In-Time) is enabled by default. Ensure you're not disabling it.

For the specific `bg-dark-blue` error, try using direct CSS variables in your component instead of Tailwind utility classes as a workaround:

```jsx
<div style={{ backgroundColor: "var(--dark-blue)" }} className="text-white">
  // Content
</div>
```

If you're getting the "Cannot apply unknown utility class: bg-dark-blue" error in production builds, the solution includes:

1. Update the PostCSS configuration in `postcss.config.mjs` to use the proper plugin format:

   ```js
   const config = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };

   export default config;
   ```

2. Update the package.json to use the correct versions of Tailwind CSS and related packages:

   ```json
   "devDependencies": {
     // Other dependencies...
     "autoprefixer": "^10.4.16",
     "tailwindcss": "^3.4.1",
     "postcss": "^8.4.31"
   }
   ```

3. Ensure your Tailwind configuration includes all the necessary file patterns:

   ```js
   content: [
     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
     "./src/**/*.{js,ts,jsx,tsx,mdx}",
   ],
   ```

4. After making these changes, run:
   ```bash
   npm install
   npm run build
   ```

### CSS Import Rules

When working with CSS in Next.js, be aware of the following:

1. `@import` statements must come before all other CSS rules except `@charset` and `@layer`.

   Incorrect:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* Comment */
   @import url("https://fonts.googleapis.com/css2?family=..."); /* This will cause an error */
   ```

   Correct:

   ```css
   @import url("https://fonts.googleapis.com/css2?family=..."); /* Import first */

   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

2. If you encounter the error `@import rules must precede all rules aside from @charset and @layer statements`, move your `@import` statements to the top of the CSS file.

### Command Differences: CRA vs Next.js

When migrating from Create React App to Next.js, note these command differences:

| Purpose          | Create React App | Next.js         |
| ---------------- | ---------------- | --------------- |
| Development      | `npm start`      | `npm run dev`   |
| Production Build | `npm run build`  | `npm run build` |
| Serve Production | `serve -s build` | `npm start`     |
| Linting          | `npm run lint`   | `npm run lint`  |

This is an important distinction as `npm start` serves the production build in Next.js, not the development server as in CRA.

## Timeline

- **Weeks 1-2**: Phases 1-2
- **Weeks 3-4**: Phases 3-4
- **Weeks 5-6**: Phases 5-6
- **Week 7**: Phase 7

## Resources

- [Next.js Migration Guide](https://nextjs.org/docs/migrating/from-create-react-app)
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)

## Progress Tracking

We'll track migration progress in this repo's issues and pull requests, with the label `next-migration`.
