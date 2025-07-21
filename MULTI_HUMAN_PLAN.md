# Multi-Human Matches Implementation Plan

## Overview

Implementing support for multiple humans in matches using Test-Driven Development (TDD).

## Test-First Approach

1. **Created comprehensive test suite** (`lambda/match-templates.test.ts`)

   - Match template definitions (1v3, 2v2, admin)
   - Match creation with `waiting_for_players` state
   - Invite system with shareable codes
   - Dynamic participant assignment
   - Auto-start when ready

2. **Key behaviors defined in tests:**
   - Matches start in `waiting_for_players` state for multi-human templates
   - 6-character invite codes (e.g., `A7B3C9`)
   - Random identity assignment (A/B/C/D) when match starts
   - Diverse AI personality selection
   - Automatic progression when all humans joined

## Implementation Steps

### 1. Update Match Schema

```typescript
// Add to match schema
status: 'waiting_for_players' | 'active' | 'completed'
templateType: 'classic_1v3' | 'duo_2v2' | 'admin_custom'
inviteCode: string
waitingFor: { humans: number, ai: number }
```

### 2. Create Match Template Service

```typescript
interface MatchTemplate {
  type: MatchTemplateType;
  name: string;
  description: string;
  requiredHumans: number;
  requiredAI: number;
  totalParticipants: number;
  isPublic: boolean;
  isAdminOnly?: boolean;
}
```

### 3. Update Match Service

- New `/matches/create-with-template` endpoint
- `/matches/join/{inviteCode}` endpoint
- Auto-progression logic when players join

### 4. Frontend Updates

- Template selection UI
- Waiting room display
- Share invite functionality
- Show who's joined

## Database Changes

### Matches Table

- Add GSI for `inviteCode` lookups
- Store `templateType` and `waitingFor` counts

### State Transitions

```
waiting_for_players → round_active → round_voting → completed
```

Where `waiting_for_players` includes:

1. Waiting for humans to join
2. Match starts (assigns identities, adds AI players)
3. First prompt shown
4. Waiting for all participants (human + AI) to respond
5. Only transitions to `round_active` when all responses received

## API Changes

### POST /matches/create-with-template

```json
{
  "templateType": "duo_2v2",
  "userId": "user-123",
  "displayName": "Alice"
}
```

### POST /matches/join/{inviteCode}

```json
{
  "userId": "user-456",
  "displayName": "Bob"
}
```

## Next Steps

1. Run tests to see failures (TDD red phase)
2. Implement match template service
3. Update match creation logic
4. Add invite code generation
5. Implement join functionality
6. Update frontend components
7. Make all tests pass (TDD green phase)
8. Refactor and optimize (TDD refactor phase)
