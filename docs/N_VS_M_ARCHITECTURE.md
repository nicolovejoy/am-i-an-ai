# N vs M Architecture Documentation

## Overview

RobotOrchestra now supports flexible match configurations with 3-8 participants in any combination of humans vs AI players. This document describes the architecture changes and implementation details.

## Core Changes

### 1. Identity System Extension

The identity system has been extended from 4 fixed identities (A, B, C, D) to support up to 8 identities (A through H).

```typescript
// Old: Fixed 4 identities
export const IdentitySchema = z.enum(["A", "B", "C", "D"]);

// New: Extended to up to 8 identities
export const IdentitySchema = z.enum(["A", "B", "C", "D", "E", "F", "G", "H"]);
```

### 2. Match Templates

New match templates have been added to support various configurations

### 3. Dynamic Participant Handling

#### Backend Changes

- **Match Service**: Now uses `match.totalParticipants` instead of hardcoded 4
- **Robot Worker**: Dynamically assigns personalities and delays based on AI count
- **Multi-Human Service**: Generates identities based on actual participant count

#### Frontend Changes

- **Dynamic Identity Generation**: Components generate identity arrays based on match size
- **Responsive Layouts**: Grid layouts adapt to participant count
- **Extended Color Palette**: 8 unique colors for visual distinction

### 4. Helper Functions

New utility functions in `shared/utils/identity-helpers.ts`:

```typescript
// Generate identities for a specific count
generateIdentities(count: number): Identity[]

// Get participant count with fallback
getParticipantCount(match: { totalParticipants?: number }): number

// Check if all responses are in
hasAllResponses(responses: Record<string, any>, total: number): boolean

// Get AI identities from match
getAIIdentities(humanIdentities: Identity[], total: number): Identity[]
```

## Implementation Details

### Backend Architecture

1. **Response Collection**

   - Checks against `totalParticipants` instead of hardcoded 4
   - Uses dynamic identity arrays from match data

2. **AI Personality Assignment**

   - Cycles through 3 personalities for >3 AI players
   - Maintains consistency within a match

3. **Rate Limiting**
   - Staggers AI responses with 2-second delays
   - Scales delay based on AI position in participant list

### Frontend Architecture

1. **Grid Layouts**

   - 3 players: 1x3 or triangle layout
   - 4 players: 2x2 grid (original)
   - 5-6 players: 2x3 or 3x2 grid
   - 7-8 players: 2x4 or 4x2 grid

2. **Component Updates**
   - ParticipantBar: Shows X/Y format with actual totals
   - WaitingRoom: Displays correct player count
   - TableLayout: Adaptive grid based on participants
   - MatchComplete: Handles variable participant scoring

## Testing Strategy

### Unit Tests

- Identity generation for all valid counts (3-8)
- Helper function validation
- Match template configuration

### Integration Tests

- Match creation with each template
- Round completion with variable participants
- Robot response generation for extended identities
- Personality cycling for large AI counts

### Frontend Tests

- Component rendering with different participant counts
- Responsive layout verification
- Color assignment uniqueness

## Migration Notes

### Backward Compatibility

- Existing 4-player matches continue to work
- `totalParticipants` defaults to 4 if missing
- Original identity letters (A-D) unchanged

### Database Changes

- No schema changes required (DynamoDB is flexible)
- `totalParticipants` field added to new matches
- Existing matches infer count from participant array

## Performance Considerations

1. **AI Response Generation**

   - Maximum 8 AI responses per round
   - 2-second stagger prevents API rate limits
   - Total round time: ~16 seconds worst case

2. **Frontend Rendering**

   - Larger grids may impact mobile performance
   - Consider virtualization for future expansion

3. **Real-time Updates**
   - More participants = more WebSocket messages
   - Current polling (4s) handles up to 8 fine

## Future Enhancements

1. **Team-Based Modes**

   - 2v2v2 (3 teams of 2)
   - Asymmetric teams (3v2v1)

2. **Dynamic Personalities**

   - More than 3 AI personality types
   - Personality selection based on match type

3. **Scalability Beyond 8**
   - Extended identity system (I, J, K...)
   - Pagination for large participant lists
   - Performance optimizations

## Configuration

### Environment Variables

No new environment variables required.

### Match Template Configuration

Templates defined in `match-template-service.ts`:

```typescript
[
  "trio_3v3",
  {
    type: "trio_3v3",
    name: "Trio Match",
    description: "Three humans compete with three AI players",
    requiredHumans: 3,
    requiredAI: 3,
    totalParticipants: 6,
    isPublic: true,
  },
];
```

## Deployment

No special deployment steps required. The changes are backward compatible and will work with existing infrastructure.

## Monitoring

Key metrics to watch:

- Match creation by template type
- Average participants per match
- AI response generation time
- Round completion rates

## Troubleshooting

### Common Issues

1. **"Match validation failed"**

   - Ensure participant count matches totalParticipants
   - Verify all identities are within valid range

2. **"Robot response timeout"**

   - Check AI service rate limits
   - Verify staggered delays are working

3. **"Layout looks broken"**
   - Clear browser cache
   - Check responsive breakpoints
