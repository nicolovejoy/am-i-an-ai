# State Management Migration Guide

## Overview
This guide explains how to migrate from the old Zustand-based state management to the new React Query + minimal Zustand architecture.

## Key Changes

### 1. Server State → React Query
All server data (matches, rounds, responses) is now managed by React Query:
- Automatic caching and background refetching
- Optimistic updates with rollback
- Built-in loading and error states

### 2. UI State → Minimal Zustand
Only truly local UI state remains in Zustand:
- Selected items, focused indices
- Menu/modal states
- User preferences
- Typing indicators

### 3. Shared Schemas
All types are now defined once in `/shared/schemas` using Zod:
- Runtime validation
- TypeScript types generated from schemas
- Shared between frontend and backend

## Migration Steps

### Step 1: Update Imports

**Old:**
```typescript
import { useSessionStore } from '@/store/sessionStore';
import type { Match, Round } from '@/store/types/match.types';
```

**New:**
```typescript
import { useMatch, useMyIdentity, useCurrentRound } from '@/store/server-state/match.queries';
import { useUIStore } from '@/store/ui-state/ui.store';
import type { Match, Round } from '@shared/schemas';
```

### Step 2: Replace State Access

**Old:**
```typescript
const { match, myIdentity, submitResponse, hasSubmittedResponse } = useSessionStore();
```

**New:**
```typescript
// Server state from React Query
const { data: match } = useMatch(matchId);
const myIdentity = useMyIdentity();
const currentRound = useCurrentRound();

// Mutations
const submitResponse = useSubmitResponse();

// Derived state
const hasSubmittedResponse = !!currentRound?.responses[myIdentity];
```

### Step 3: Update Mutations

**Old:**
```typescript
// Direct store action
submitResponse(responseText);
```

**New:**
```typescript
// React Query mutation
submitResponse.mutate(
  { matchId, identity: myIdentity, response: responseText, round: currentRound.roundNumber },
  {
    onSuccess: () => {
      console.log('Response submitted!');
    },
    onError: (error) => {
      console.error('Failed:', error);
    },
  }
);

// Check loading state
if (submitResponse.isPending) {
  // Show loading UI
}
```

### Step 4: Handle Loading States

**Old:**
```typescript
if (!match) return <div>Loading...</div>;
```

**New:**
```typescript
const { data: match, isLoading, error } = useMatch(matchId);

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!match) return <div>No match found</div>;
```

### Step 5: Update Effect Dependencies

**Old:**
```typescript
useEffect(() => {
  if (match?.currentRound !== prevRound) {
    // Handle round change
  }
}, [match?.currentRound]);
```

**New:**
```typescript
// React Query handles this automatically
// The sync engine manages round transitions
// Components just react to data changes
```

## Component Examples

### Before: ChatInterface.tsx
```typescript
const { match, myIdentity, currentPrompt, hasSubmittedResponse } = useSessionStore();

useEffect(() => {
  const interval = setInterval(() => {
    pollMatchUpdates(matchId);
  }, 2000);
  return () => clearInterval(interval);
}, [matchId]);
```

### After: ChatInterface.tsx
```typescript
const { data: match } = useMatch(matchId); // Auto-polls every 2s
const myIdentity = useMyIdentity();
const currentRound = useCurrentRound();
const hasSubmittedResponse = !!currentRound?.responses[myIdentity];

// No manual polling needed!
```

## Testing Updates

Tests now need to mock React Query:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

// In tests
const { result } = renderHook(() => useMatch('test-id'), { wrapper });
```

## Benefits

1. **Better Performance**: Intelligent caching, deduplication
2. **Better UX**: Optimistic updates, background refetching
3. **Better DX**: DevTools, clear separation of concerns
4. **Type Safety**: Runtime validation with Zod
5. **Future Ready**: Easy to add WebSockets, offline support