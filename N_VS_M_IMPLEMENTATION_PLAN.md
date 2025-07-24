# N vs M Match Support Implementation Plan

## Overview
Enable RobotOrchestra to support matches with variable numbers of participants (not just 4), allowing formats like 1v5, 3v3, 2v1, etc.

## Current State
- All match formats hardcoded to exactly 4 participants (A, B, C, D)
- UI components assume 4-player layout
- Backend mostly flexible but has some hardcoded checks

## Implementation Phases

### Phase 1: Backend Foundation (Minimal Breaking Changes)

#### 1.1 Extend Identity System
**File**: `shared/schemas/match.schema.ts`
- Extend `IdentitySchema` from `['A', 'B', 'C', 'D']` to `['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']`
- This supports up to 8 participants (reasonable max for UI layout)

#### 1.2 Update Match Templates
**File**: `lambda/src/services/match-template-service.ts`
- Add `totalParticipants` to existing templates (backwards compatible)
- Add new template examples:
  ```typescript
  'trio_3v3': { requiredHumans: 3, requiredAI: 3, totalParticipants: 6 }
  'solo_1v5': { requiredHumans: 1, requiredAI: 5, totalParticipants: 6 }
  'duel_2v1': { requiredHumans: 2, requiredAI: 1, totalParticipants: 3 }
  ```

#### 1.3 Fix Hardcoded Backend Assumptions
**Files to update**:
- `lambda/match-service.ts:343` - Change `responseCount === 4` to use `match.totalParticipants`
- `lambda/robot-worker.ts` - Make AI identity assignment dynamic
- Update helper functions to accept participant count parameter

### Phase 2: API Updates (Non-Breaking)

#### 2.1 Match Creation API
**Endpoint**: `POST /matches`
- Already accepts `templateType` - no changes needed
- Response already includes participant list - works as-is

#### 2.2 Join Match API  
**Endpoint**: `POST /matches/{matchId}/join`
- Update to check against `match.totalParticipants` instead of hardcoded 4
- No API contract changes needed

#### 2.3 Match State API
**Endpoint**: `GET /matches/{matchId}`
- Already returns full participant list
- Add `totalParticipants` to response (backwards compatible)

### Phase 3: Frontend Components

#### 3.1 Dynamic Identity Handling
**Files to update**:
- Remove hardcoded `['A', 'B', 'C', 'D']` arrays
- Generate identity arrays based on `match.totalParticipants`
- Utility function: `getIdentities(count: number): Identity[]`

#### 3.2 Responsive UI Components

**ParticipantBar.tsx**
- Use `match.participants.length` instead of hardcoded 4
- Dynamically create slots based on participant count
- Grid layout that adapts to different counts

**HumanOrRobot.tsx**
- Already handles dynamic response counts - minimal changes

**TableLayout.tsx** (Biggest UI Change)
- Current: Fixed 2x2 grid for 4 players
- New: Dynamic grid based on participant count:
  - 3 players: Triangle layout
  - 4 players: 2x2 grid (current)
  - 5-6 players: 2x3 or 3x2 grid
  - 7-8 players: 2x4 or circular layout

**WaitingRoom.tsx**
- Update "X/4 players" to "X/{totalParticipants} players"
- Adjust invite system for different human requirements

#### 3.3 Participant Colors & Styling
**File**: `frontend/src/config/playerConfig.ts`
- Extend PLAYER_COLORS to support 8 players
- Make configuration dynamic based on participant count

### Phase 4: Match Flow Updates

#### 4.1 Multi-Human Logic
**File**: `lambda/src/services/multi-human-match-service.ts`
- Update to support variable human counts
- Waiting room logic based on `requiredHumans` from template

#### 4.2 Robot Assignment
- Dynamically assign AI players to fill remaining slots
- Update personality assignment for >3 AI players

### Migration Strategy

1. **Database Migration**: None needed - DynamoDB is schemaless
2. **Backwards Compatibility**: 
   - Add `totalParticipants` field to existing matches (default: 4)
   - Old clients continue working with 4-player matches
3. **Feature Flag**: Consider adding feature flag for new match types

### Testing Requirements

1. **Backend Tests**:
   - Test matches with 3, 4, 5, 6, 7, 8 participants
   - Verify identity assignment logic
   - Test round completion with different counts

2. **Frontend Tests**:
   - Component rendering with different participant counts
   - Responsive layouts on mobile/desktop
   - Keyboard navigation with more options

3. **E2E Tests**:
   - Full match flow for each new template
   - Multi-human waiting and joining
   - AI response generation for larger groups

### Risks & Mitigation

1. **UI Complexity**: 
   - Risk: Layout becomes messy with many participants
   - Mitigation: Cap at 8 players, carefully design layouts

2. **Performance**: 
   - Risk: More API calls with more participants
   - Mitigation: Batch operations, optimize queries

3. **AI Rate Limits**:
   - Risk: Hitting Bedrock limits with many AI players
   - Mitigation: Stagger AI responses, use fallbacks

### Implementation Order

1. Backend identity extension (low risk)
2. Fix hardcoded backend checks
3. Add new match templates
4. Update frontend identity generation
5. Create responsive UI layouts
6. Test with new match formats
7. Polish UI for different layouts

### Estimated Effort

- Backend changes: 2-3 hours
- Frontend component updates: 4-6 hours  
- Testing & debugging: 2-3 hours
- **Total: 8-12 hours**

### Future Considerations

- Team-based formats (2v2v2)
- Asymmetric games (1v3 with different rules)
- Tournament brackets with varying formats
- Custom participant counts for admin users