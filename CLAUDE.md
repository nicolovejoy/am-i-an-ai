# AmIAnAI Project - Claude Instructions

## Project Overview

**v1**: Multi-persona conversation system (Next.js + PostgreSQL + VPC)
**v2**: 2H+2AI real-time conversations (React + DynamoDB + WebSocket) - **CURRENT FOCUS**

Two parallel systems: v1 (complex, production) and v2 (simplified, TDD prototype).

## Development Workflow

**PRODUCTION-ONLY DEPLOYMENT STRATEGY**

- **ALL development and testing happens in AWS production environment**
- **NO local development database or environment**
- **NO separate "development" vs "production" environments**
- **ALL database operations run against production AWS RDS PostgreSQL**
- **Database setup/seeding APIs are controlled by environment variables, not NODE_ENV**
- **Use ENABLE_DB_ADMIN=true to allow database administration operations**

### Always Use Deployment Scripts

- **NEVER run terraform commands directly**
- **ALWAYS use the scripts in `/infrastructure/scripts/`**
- For full deployment: `DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all`
- For Lambda-only deployment: `DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --lambda`
- For teardown: `DOMAIN_NAME=amianai.com ./scripts/destroy.sh`
- **IMPORTANT**: The new granular deployment system allows selective component deployment for faster iterations.

### Architecture

**v1 (Production):**
- **Frontend**: Next.js app deployed to S3/CloudFront
- **Database**: PostgreSQL on AWS RDS
- **Auth**: AWS Cognito
- **Infrastructure**: VPC + NAT Gateway ($90/month)

**v2 (Prototype - CURRENT):**
- **Frontend**: React app (simplified)
- **Database**: DynamoDB (serverless)
- **WebSocket**: API Gateway WebSocket + Lambda
- **Infrastructure**: No VPC (~$5/month, 95% cost savings)

### Key Commands

```bash
# Infrastructure Deployment (REQUIRED FIRST)
cd infrastructure && DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all

# Lambda-only deployment (for code changes)
cd infrastructure && DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --lambda

# Database operations (PRODUCTION ONLY)
npm run db:setup      # Create fresh database schema
npm run db:seed       # Seed production database
npm run db:reset      # Reset production database

# Local development (frontend only)
# Note: User runs dev server manually in separate window on port 3000
cd frontend && npm run dev  # Runs on http://localhost:3000

# Testing and validation
npm run test
npm run lint
npm run build
```

### Important Notes

- **ALL database operations target production AWS RDS PostgreSQL**
- Database credentials managed via AWS Secrets Manager (REQUIRED)
- All repository operations are async (await getDatabase())
- Use TodoWrite tool for multi-step tasks
- Commit changes only when explicitly requested
- Follow existing code conventions and patterns
- **Dev Server**: User runs `npm run dev` manually in separate window (http://localhost:3000)
- **Never start/stop dev server** - user manages this independently
- **Infrastructure & Deployment**: User handles all deployment operations manually
  - **Never run deployment commands** - user manages all infrastructure scripts
  - **Lambda Deployment**: User runs `./scripts/deploy.sh --lambda` for Lambda-only deployment  
  - **Full Deployment**: User runs `./scripts/deploy.sh --all` for complete infrastructure
  - **Claude's Role**: Implement fixes and features, user handles deployment verification

### Test-Driven Development (TDD)

**MANDATORY: Always follow Test-Driven Development practices**

- **Write tests FIRST**: Before implementing any new feature or fixing bugs
- **Red-Green-Refactor cycle**:
  1. Write failing tests that define the expected behavior
  2. Write minimal code to make tests pass
  3. Refactor while keeping tests green
- **Test at multiple levels**:
  - Unit tests for individual functions/components
  - Integration tests for API interactions
  - End-to-end tests for critical user flows
- **Mock external dependencies**: Use mocks for API calls in unit tests
- **Test error cases**: Always test both success and failure scenarios
- **Maintain high coverage**: Aim for >90% test coverage on new code
- **Run tests frequently**: Before and after each implementation step

### Pre-Commit Requirements

**MANDATORY: Before any git commit, ALWAYS run these commands in parallel:**

```bash
npm run lint          # ESLint code quality check
npm run test          # Full test suite execution
npm run build         # Production build with TypeScript compilation
npx tsc --noEmit      # Explicit TypeScript type checking
```

**CRITICAL REQUIREMENTS:**

- ✅ **All linting errors must be fixed** (warnings are okay)
- ✅ **All tests must pass** (no failing tests allowed)
- ✅ **TypeScript compilation must succeed** (no type errors)
- ✅ **Production build must complete successfully**
- ❌ **NEVER commit if ANY check fails**

**Workflow:**

1. Run all four commands in parallel using multiple tool calls
2. Fix any errors found in linting, tests, or TypeScript
3. Re-run checks until ALL pass
4. Only then proceed with git commit

## Current Status

### **v1 (Production System)**
- ✅ Complete: PostgreSQL + VPC + Cognito + 15,000+ lines
- ✅ Working: Conversations, AI responses, persona management
- ✅ Deployed: amianai.com (full production system)

### **v2 (2H+2AI Prototype - ACTIVE DEVELOPMENT)**
- ✅ **TDD Complete**: 8/8 tests passing, 240 lines Lambda code
- ✅ **Core Features**: WebSocket + DynamoDB + A/B/C/D anonymity + 10min timer
- ✅ **Production Mode**: 2 humans + 2 AI participants (the actual game experience)
- ✅ **Testing Mode**: 1 human + 3 AI participants (for development/testing)
- ✅ **Infrastructure Ready**: Backend deployed and working
- 🚧 **Current Focus**: Enhanced UX with styled components

## PLATFORM COMPLETION STATUS

### ✅ **Complete Systems**

1. **Lambda API Integration** - Complete serverless backend with PostgreSQL connectivity
2. **Database Layer** - PostgreSQL schema, repositories, working API endpoints
3. **Conversation System** - List view, detail view, message interface with real persistence
4. **Persona Management** - Full CRUD with AI configuration support
5. **Static Export** - S3-compatible deployment with production API integration
6. **Testing Infrastructure** - Comprehensive test suite with 95%+ coverage (359 tests passing)
7. **Accessibility** - Full WCAG compliance with screen reader support
8. **API Client Standardization** - All components use centralized apiClient with consistent auth

### ✅ **AI Integration Complete**

OpenAI integration is fully operational! AI personas respond to messages and save responses to the production PostgreSQL database. All conversation data persists correctly.

### **Production API Status**

- **Lambda Functions**: Node.js 20.x with VPC connectivity to RDS
- **API Gateway**: REST API with CORS at https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod
- **Database Connectivity**: Full CRUD operations working with production data
- **End-to-End Testing**: Conversation creation persists to database successfully

### **Active AI Features**

- ✅ Complete API infrastructure for AI response generation
- ✅ Persona AI configurations with prompt engineering
- ✅ Message history context feeding AI responses
- ✅ Real-time chat interface with AI participation
- ✅ Production database storing all conversation context
- ✅ Automatic AI responses triggered by human messages
- ✅ AI personas with distinct personalities and communication styles

## **v2 Development Focus (Current Session)**

**User Request**: Build 2H+2AI prototype with radical simplification  
**Completed**: 
- TDD backend (8/8 tests), infrastructure configs
- WebSocket + DynamoDB deployed and working
- Configurable session limits implemented:
  - **Testing mode (1H+3AI)**: 3 minutes OR 10 messages
  - **Production mode (2H+2AI)**: 5 minutes OR 20 messages

**Current Focus**: User management and permissions
- User profiles with settings
- Admin vs regular user permissions
- Admin console for data viewing

**Key Constraints**:
- User handles ALL deployments (never run deploy commands)
- Follow TDD: tests first, minimal code
- Target <2,000 lines total (vs v1's 15,000+)
- Real-time WebSocket focus (vs REST API)

### **Development Commands**

```bash
# v1 (Production System)
cd infrastructure && ./scripts/deploy.sh --lambda  # User handles all deploys
npm run test && npm run lint && npm run build      # Pre-commit checks

# v2 (Prototype Development)
cd v2 && npm test                    # TDD cycle
cd v2 && ./scripts/deploy.sh --all   # User handles deployment
wscat -c wss://websocket-url         # Test WebSocket connection
```

### **Key URLs**
- **v1 Production**: https://amianai.com
- **v1 API**: https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod
- **v2 WebSocket**: (deployed by user)
- **Database**: DBeaver → eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com:5432
