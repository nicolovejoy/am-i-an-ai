# Identity → UserId Refactoring Plan

## Plan of Record

Replace "identity" (A, B, C, D) with userId-based system aligned with NOMENCLATURE.md.

## Implementation Approach

### Phase 1: Backend Preparation
1. Add `displayPosition` field (0, 1, 2, ...) to ParticipantSchema
2. Keep `identity` field temporarily for backwards compatibility
3. Update match creation to assign positions dynamically based on participant count

### Phase 2: Frontend Migration  
1. Update components to use `displayPosition` instead of `identity`
2. Add `getDisplayLabel(position)` helper for UI display (A, B, C, D, ...)
3. Change voting to use userId directly

### Phase 3: Cleanup
1. Remove `identity` field and IdentitySchema from schemas
2. Update all tests
3. Remove hardcoded 4-participant limits

## Key Changes

```typescript
// Schema change
participant: {
  userId: string,
  displayPosition: number, // 0-based index
  // Remove: identity: 'A' | 'B' | 'C' | 'D'
}

// Display helper
function getDisplayLabel(position: number): string {
  return String.fromCharCode(65 + position); // 0→A, 1→B, etc.
}
```

## Benefits
- Supports any number of participants (limited only by templates)
- Aligns with NOMENCLATURE.md principles
- Single source of truth: userId
- Clean separation of identity from presentation

## Timeline: 3 days total