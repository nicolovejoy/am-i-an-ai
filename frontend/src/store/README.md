# Zustand State Management

This directory contains the Zustand stores for client-side state management in the AmIAnAI application.

## Architecture Overview

We use a **hybrid approach** combining:
- **Zustand** - For client-side UI state and optimistic updates
- **React Query** - For server state synchronization and caching
- **Custom Hooks** - To bridge Zustand and React Query

## Store Structure

### 1. **conversationStore.ts**
Manages the active conversation state:
- Current conversation details
- Messages (with optimistic updates)
- Typing indicators
- Draft messages
- Loading/error states

### 2. **conversationsListStore.ts**
Manages the conversations list:
- Paginated conversation list
- Filters and search
- Infinite scrolling state
- List-level operations

### 3. **personaStore.ts**
Manages personas:
- Available personas
- Selected personas for new conversations
- Persona CRUD operations

### 4. **uiStore.ts**
Manages general UI state:
- Sidebar visibility
- Modal states
- Theme preferences
- Online/offline status

## Usage Example

```typescript
// In a component
import { useConversation } from '@/hooks/useConversation';
import { useConversationStore } from '@/store';

function ChatComponent({ conversationId }) {
  // Hook combines Zustand + React Query
  const { 
    conversation, 
    messages, 
    sendMessage,
    isLoadingMessages 
  } = useConversation(conversationId);
  
  // Direct store access for UI state
  const { drafts, setDraft } = useConversationStore();
  
  const handleSend = (content: string) => {
    sendMessage({ content, personaId: 'xxx' });
    // Optimistic update happens automatically
  };
}
```

## Key Benefits

1. **Optimistic Updates** - Messages appear instantly while syncing
2. **Reduced API Calls** - Share state between components
3. **Better UX** - Instant feedback for user actions
4. **Offline Support** - Persist drafts and preferences
5. **Type Safety** - Full TypeScript support

## Migration Guide

To migrate a component from local state to Zustand:

1. Replace `useState` with store selectors
2. Use custom hooks for data fetching
3. Move side effects to store actions
4. Keep React Query for server sync

Example migration:
```typescript
// Before
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(true);

// After
const { messages, isLoadingMessages } = useConversation(conversationId);
```

## Best Practices

1. **Use selectors** to avoid unnecessary re-renders
2. **Keep stores focused** - One store per domain
3. **Combine with React Query** for server state
4. **Use middleware** for persistence and devtools
5. **Test stores** independently from components