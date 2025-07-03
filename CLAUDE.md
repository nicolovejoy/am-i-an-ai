# AmIAnAI Project - Claude Instructions

## Project Overview

**2H+2AI real-time anonymous conversations.** Users join sessions with 2 humans + 2 AI participants, engaging in anonymous discussions with A/B/C/D identities until the reveal.

## Development Workflow

### Architecture (v2)

- **Frontend**: React + Next.js (deployed to https://amianai.com)
- **Backend**: WebSocket API Gateway + Lambda (Node.js 20.x)
- **Database**: DynamoDB (serverless, managed by Terraform)
- **Auth**: AWS Cognito (inherited from v1)
- **Cost**: ~$5/month (95% savings vs v1)

### Deployment

- **User handles ALL deployments** - Claude never runs deployment commands
- **Scripts**: Use `/infrastructure/scripts/deploy.sh` (see README in that folder)
- **Infrastructure**: All AWS resources managed by Terraform

### Development Commands

```bash
# Frontend development (user runs manually in separate window)
cd frontend && npm run dev  # http://localhost:3001

# Pre-commit checks (run from project root)
cd frontend && npm run lint && npm run build
cd lambda && npm test
```

### Pre-Commit Requirements

**MANDATORY: Before any git commit, run these checks:**

```bash
# Frontend checks
cd frontend && npm run lint    # Fix all errors (warnings OK)
cd frontend && npm run build   # Must complete successfully

# Backend checks
cd lambda && npm test          # All tests must pass
```

**❌ NEVER commit if any check fails**

### Key URLs

- **Production**: https://amianai.com
- **WebSocket**: wss://ip1n2fcaw2.execute-api.us-east-1.amazonaws.com/prod
- **DynamoDB**: amianai-v2-sessions table

### Important Notes

- **Production-only development** - no local database, all testing in AWS
- **User manages infrastructure** - Claude implements features, user deploys
- **TDD approach** - write tests first when that makes sense, especially for Lambda functions
- **Follow existing patterns** - match code style and conventions
