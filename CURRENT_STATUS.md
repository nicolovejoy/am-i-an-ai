# RobotOrchestra Current Status

**Last Updated: 2025-07-22**

## Architecture
- Frontend: React/TypeScript with Vite
- Backend: AWS Lambda functions
- Database: DynamoDB (matches table with composite key: matchId + timestamp)
- AI: AWS Bedrock (Claude models)
- Auth: AWS Cognito

### Data Models

**User Entity** (persistent participants):
- `userId`: UUID
- `userType`: "human" | "ai"
- `displayName`: string
- `isActive`: boolean
- `isAdmin`: boolean (humans only)
- `cognitoId`: string (humans only)
- `email`: string (humans only)
- `personality`: string (AI only - philosopher, scientist, comedian, artist, engineer)
- `modelConfig`: { provider: "bedrock", model: "claude-3-haiku" | "claude-3-sonnet" }

**Match Templates**:
- `classic_1v3`: 1 human + 3 AI robots (original mode)
- `duo_2v2`: 2 humans + 2 AI robots (multi-human mode)

**Match Flow**:
1. Creator selects template and starts match
2. For multi-human: generates 6-character invite code, waits for players
3. When all humans join: assigns random AI users, starts round 1
4. Players respond anonymously to prompts
5. Responses shuffled and presented for voting
6. After 5 rounds: reveal identities and final scores

## Completed Features

### User System
- Persistent users table (human and AI)
- 5 AI personalities with unique traits
- User service for CRUD operations

### Multi-Human Matches
- Template-based match creation (1v3, 2v2)
- 6-character invite codes
- Waiting room with player status
- Join flow for all users
- Dynamic identity assignment
- Auto-start when ready

### Core Gameplay
- 5-round matches with AI-generated prompts
- Real-time response collection
- Voting on human identity
- Results and scoring
- Match history tracking

## Deployment
```bash
# Backend
cd infrastructure
./scripts/deploy-lambdas.sh

# Frontend  
cd infrastructure
./scripts/deploy-frontend.sh
```

## Recent Fixes (2025-07-22)
- Fixed join match bug: UpdateCommand conditionally includes :waitingFor field
- Implemented AI-generated prompts using AI service
- Fixed schema validation to support variable participant counts (1-N during waiting)
- Added totalParticipants field from match template
- Fixed WaitingRoom to not reveal AI/Human player types
- Fixed TypeScript errors with Zod schema refinements

## Known Issues
- **2v2 Match Bug**: Second player doesn't see prompt and cannot respond
  - Likely issue with identity assignment or match state after joining
  - May be related to match status transitions or round initialization
- Invite code lookup uses table scan instead of GSI (performance concern at scale)
- No real-time updates when other players join or make moves
- Match status may not transition properly from `waiting` to `round_active`

## Technical Implementation Details

### Response Anonymization
- Backend stores responses by userId
- Generates unique responseId for each response  
- Creates responseMapping: responseId → userId
- Shuffles and presents responses by responseId
- Votes use responseId, backend resolves to userId for scoring

### Database Schema
- **users table**: Persistent user entities (human and AI)
- **matches table**: Match state with composite key (matchId + timestamp=0)
  - Uses table scan for invite code lookup (needs GSI for production)
- **Future**: match_templates table for configurable templates

## Next Steps
- **Fix 2v2 prompt visibility**: Debug why second player can't see/respond to prompts
- Ensure match transitions from `waiting` → `round_active` properly
- Add logging to track match state transitions
- Add GSI for invite code lookups (performance improvement)
- Admin debug mode showing AI metadata
- WebSocket real-time updates
- Email/SMS notifications for invites
- Configurable match templates (3+ players)
- Tournament mode

## Debug Notes for 2v2
The second player joining a 2v2 match experiences:
1. Successfully joins the match
2. Match starts (AI players added, identities assigned)
3. But: No prompt visible, cannot submit response
4. First player can play normally

Possible causes:
- Match status not updating to `round_active` for all participants
- Round data not properly initialized when match starts
- Frontend not polling/updating after match transitions
- Identity assignment issue preventing proper UI state