# Deployment Guide

## Phase 1: User System ✅
- Users DynamoDB table
- AI user initialization
- User service implementation

## Phase 2: Multi-Human Matches ✅

### Schema Updates
- Added `waiting_for_players` status
- Extended Participant with userId, displayName, isReady, joinedAt
- Extended Match with templateType, inviteCode, waitingFor, inviteUrl

### Backend Updates
- Match template service (classic_1v3, duo_2v2, admin_custom)
- Multi-human match service with invite system
- New endpoints in match-service Lambda

### Frontend Updates
- Template selection on dashboard
- Waiting room component
- Join by invite code flow

## Deployment Steps

### 1. Deploy Infrastructure Changes
```bash
cd infrastructure
terraform plan  # Review changes - should show users table creation
terraform apply # User deploys this
```

Expected changes:
- Create `robot-orchestra-users` DynamoDB table
- Update Lambda environment variables
- Update IAM policies

### 2. Deploy Lambda Functions
No Lambda code changes yet, but environment variables have changed:
```bash
cd infrastructure
./scripts/deploy-lambdas.sh  # User deploys this
```

Note: The deploy-lambdas.sh script will show a warning about OpenAI API key,
but this is expected as we now use AWS Bedrock for AI services.

### 3. Initialize AI Users
After infrastructure is deployed, populate the AI users:
```bash
cd lambda
npm install  # If not already done
AWS_REGION=us-east-1 USERS_TABLE_NAME=robot-orchestra-users npm run init-ai-users
```

This creates 5 AI users:
- Thoughtful Philosopher
- Analytical Scientist  
- Witty Comedian
- Creative Artist
- Pragmatic Engineer

### 4. Verify Deployment

Check DynamoDB table created:
```bash
aws dynamodb describe-table --table-name robot-orchestra-users
```

Check AI users created:
```bash
aws dynamodb scan --table-name robot-orchestra-users \
  --filter-expression "userType = :ai" \
  --expression-attribute-values '{":ai":{"S":"ai"}}' \
  --query "Count"
```

Should return count of 5.

## What's NOT Changed Yet

- Match creation still uses hardcoded participants (A/B/C/D)
- Frontend still shows [AI] tags
- No user authentication integration yet
- Participants don't reference userId yet

These will be addressed in subsequent phases.

## Rollback Plan

If issues occur:
```bash
# Remove users table from state and delete
cd infrastructure
terraform destroy -target=aws_dynamodb_table.users
```

Then redeploy Lambda functions with old environment variables.

## Next Steps

Phase 2 will:
- Add match templates
- Implement debug mode for admins
- Start using userId in match creation