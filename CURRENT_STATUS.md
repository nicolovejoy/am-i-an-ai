# RobotOrchestra Current Status

**Last Updated: 2025-07-20**

## Architecture
- Frontend: React/TypeScript with Vite
- Backend: AWS Lambda functions
- Database: DynamoDB
- AI: AWS Bedrock (Claude models)
- Auth: AWS Cognito

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
- 5-round matches with prompts
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

## Recent Fixes (2025-07-20)
- Fixed CORS configuration for new endpoints in API Gateway
- Updated Lambda code to use AWS SDK v3 (required for Node.js 20 runtime)
- Fixed DynamoDB operations to include timestamp field in composite key
- Implemented proper invite code lookup using table scan

## Known Issues
- Invite code lookup uses table scan instead of GSI (performance concern at scale)
- No real-time updates when other players join or make moves
- Match templates are currently hardcoded

## Next Steps
- Add GSI for invite code lookups (performance improvement)
- Admin debug mode
- WebSocket real-time updates
- Email/SMS notifications
- Configurable match templates
- Tournament mode