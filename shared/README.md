# Shared Code

This directory contains code shared between the frontend and Lambda functions.

## Usage

### In Frontend (Vite)
```typescript
import { AIRequestSchema, type AIRequest } from '@shared/schemas/ai-service.schema';
```

### In Lambda
```typescript
import { AIRequestSchema, type AIRequest } from '../../shared/schemas/ai-service.schema';
```

## Benefits

1. **Single Source of Truth**: Define schemas once, use everywhere
2. **Type Safety**: TypeScript types are automatically inferred from schemas
3. **Runtime Validation**: Use the same schema for validation in both places
4. **Consistency**: Frontend and backend stay in sync automatically

## Example

```typescript
// Frontend - validate before sending
const request: AIRequest = {
  task: 'generate_prompt',
  inputs: { round: 1 }
};

// This will throw if invalid
const validated = AIRequestSchema.parse(request);

// Or use safeParse for error handling
const result = AIRequestSchema.safeParse(request);
if (!result.success) {
  console.error('Invalid request:', result.error);
}
```