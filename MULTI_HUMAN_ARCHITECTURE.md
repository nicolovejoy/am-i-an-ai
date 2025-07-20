# Multi-Human Match Architecture

## Vision

An experimental ecosystem exploring trust and identity in the AI age. Humans and AI collaborate through creative prompts, trying to identify who's human while engaging in meaningful discussion. This platform seeks to provide a safe, interactive space to explore what trust means as AI becomes increasingly sophisticated and integrated into human interactions.

## Core Concepts

### 1. User Model (First-Class Entity)

All participants (human and AI) are users:

```
USER
├── userId: UUID
├── userType: "human" | "ai"
├── displayName: string
├── isActive: boolean
├── isAdmin: boolean (humans only)
├── cognitoId?: string (humans only)
├── email?: string (humans only)
├── personality?: string (AI only)
├── modelConfig?: {
│     provider: "bedrock"
│     model: "claude-3-haiku" | "claude-3-sonnet"
│   } (AI only)
└── createdAt: timestamp
```

### 2. Match Templates

```
MATCH_TEMPLATE
├── templateId: string
├── name: string ("debug-1v3" | "standard-2v2")
├── config: {
│     humanCount: number
│     robotCount: number
│     totalRounds: number
│   }
├── accessLevel: "admin" | "user"
└── isDefault: boolean
```

**Initial Templates:**
- **debug-1v3**: 1 human + 3 robots (admin only)
- **standard-2v2**: 2 humans + 2 robots (default for all users)

### 3. Match State

```
MATCH
├── matchId: string
├── templateId: string
├── status: "initiated" | "active" | "completed"
├── invitedEmails: string[] (for 2v2 matches)
├── participants: Participant[]
├── rounds: Round[]
├── debugInfo?: {  // only populated for admin users
│     enabled: boolean
│     metadata: Map<responseId, DebugMetadata>
│   }
└── createdBy: userId
```

### 4. Participant (Lightweight Reference)

```
PARTICIPANT
├── userId: string (references User.userId)
├── hasResponded: boolean (for current round)
├── joinedAt: timestamp
└── lastSeen: timestamp
```

### 5. Round Structure

```
ROUND
├── roundNumber: number
├── prompt: string
├── responses: Map<userId, string>  // backend truth
├── anonymization: {
│     responseMapping: Map<responseId, userId>
│     presentationOrder: userId[]  // shuffled
│   }
├── votes: Map<userId, responseId>
└── scores: Map<userId, number>
```

### 6. Debug Metadata (Admin Only)

```
DEBUG_METADATA
├── responseId: string
├── userId: string
├── userType: "human" | "ai"
├── model?: string
├── isFallback?: boolean
├── generationTime?: number
└── promptContext?: string
```

## Key Architecture Changes

### From Current State:
1. **Fixed roles (A/B/C/D)** → Dynamic userId-based system
2. **Ephemeral participants** → Persistent User entities
3. **Hardcoded 4 players** → Flexible 3+ participants
4. **Always visible tags** → Debug mode only for admins
5. **Immediate match start** → Wait for all humans before adding AI

## Data Flow

### Match Creation (2v2):

1. **Initiation**: First human creates match, enters friend's email
2. **Waiting**: Match status = "initiated", sends invite notification
3. **Second human joins**: Both humans respond to first prompt
4. **Activation**: Once both responses received:
   - Match status → "active"
   - System selects 2 AI users
   - AI users generate responses
   - Round proceeds with voting

### Match Creation (1v3 debug):

1. **Initiation**: Admin creates debug match
2. **Immediate activation**: No waiting, adds 3 AI users
3. **Standard flow**: Proceeds as normal match

### Response Flow:

1. Backend stores `responses[userId] = content`
2. Generate unique `responseId` for each response
3. Create `responseMapping[responseId] = userId`
4. Shuffle userIds to create `presentationOrder`
5. Frontend receives `[{responseId, content, displayPosition}]`
6. User votes using `responseId`
7. Backend resolves `responseMapping[responseId] → userId` for scoring

### Debug Mode (Admin Only):

When `user.isAdmin && match.debugInfo.enabled`:
- Response objects include metadata
- Frontend shows: [Human] or [AI-Haiku], response time
- Fallback responses marked clearly
- True userIds visible

## Implementation Path

### Phase 1: User System
- Create User table with human/AI types
- Migrate hardcoded AI personalities to User records
- Link Cognito users to User table
- Session-based users initially (no forced auth)

### Phase 2: Template & Debug
- Implement match templates
- Add isAdmin flag to users
- Conditional debug metadata
- Remove hardcoded AI tags from normal view

### Phase 3: Multi-Human Flow
- Add invitedEmails to match
- Implement "initiated" status
- Wait for all humans before adding AI
- Email notifications (later)

### Phase 4: Full Flexibility
- Support 3+ participants
- Custom templates
- Advanced matchmaking

## Database Changes

### New Tables:
1. **users** - All participants (human and AI)
2. **match_templates** - Template configurations (can hardcode initially)

### Modified:
- **matches** - Add templateId, invitedEmails, status states
- **rounds** - Use userId instead of roles (A/B/C/D)

### Removed:
- No lobby table needed - matches handle waiting state

## Benefits

- AI agents persist and can evolve
- Clean user-based architecture
- Foundation for social features
- Flexible participant counts
- Debug mode for development