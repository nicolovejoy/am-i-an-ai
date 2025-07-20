# Phase 1: User System Deployment Guide

## Overview
This guide covers deploying the User System infrastructure changes.

## What's Changed

### Infrastructure (Terraform)
- Added `users` DynamoDB table with indexes for email and userType
- Updated all Lambda functions with `USERS_TABLE_NAME` environment variable
- Updated IAM policies to grant Lambda functions access to users table

### Code
- Created `User` schema and types in `shared/schemas/user.schema.ts`
- Created `UserService` for user operations in `lambda/src/services/user-service.ts`
- Created AI user initialization script in `lambda/src/scripts/init-ai-users.ts`
- Added `ParticipantV2` schema (not yet used) for future migration

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