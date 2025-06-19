# AmIAnAI Project - Claude Instructions

## Project Overview

Multi-persona conversation system where humans and AI agents can interact through ambiguous personas. Built with Next.js frontend, PostgreSQL database, and AWS infrastructure.

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
- For deployment: `DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/setup.sh`
- For teardown: `DOMAIN_NAME=amianai.com ./scripts/destroy.sh`
- **IMPORTANT**: Read infrastructure scripts before suggesting their use - `setup.sh` runs FULL deployment (terraform, Lambda, frontend, CloudFront invalidation). This remains our preferred approach.

### Architecture

- **Frontend**: Next.js app deployed to S3/CloudFront
- **Database**: PostgreSQL on AWS RDS (not DynamoDB)
- **Auth**: AWS Cognito
- **Infrastructure**: Terraform with VPC, security groups, secrets management

### Key Commands

```bash
# Infrastructure Deployment (REQUIRED FIRST)
cd infrastructure && DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/setup.sh

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
- **Infrastructure Scripts**: User runs all Terraform/infrastructure scripts manually
- **Never run `terraform` or `./scripts/setup.sh` or `./scripts/destroy.sh`** - user manages infrastructure
- **Lambda Deployment**: ALWAYS done via `./scripts/setup.sh` - NEVER suggest direct AWS CLI commands

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

- ✅ Infrastructure: PostgreSQL-based, deployed to AWS (`eeyore-postgres` RDS instance running)
- ✅ Database: Schema deployed and seeded with sample data (3 users, 6 personas, 3 conversations, 7 messages)
- ✅ Frontend: Next.js with comprehensive type system (200+ interfaces)
- ✅ Core UI: Complete conversation and persona management system
- ✅ Deployment: Static export working with S3 deployment and demo mode fallback
- ✅ Testing: 359 tests passing with comprehensive coverage (75+ tests added in Phase 1)
- ✅ Authentication: Cognito JWT working end-to-end with proper token management
- ✅ Message System: Human messages and AI responses working with database persistence
- ✅ Admin Tools: CLI and webapp admin console fully functional

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

### **Available Development Tools**

```bash
# Database operations
npm run db:setup      # Create fresh database schema
npm run db:seed       # Seed production database
npm run db:show       # View current data
npm run db:reset      # Reset production database

# Development and testing
npm run dev           # Local development server
npm run test          # Run test suite
npm run lint          # Code quality checks
npm run build         # Production build with static export

# Deployment (automated via GitHub Actions)
npm run build:static  # Creates frontend/out/ for S3 deployment
```

### **Database Management Options**

1. **Production API Endpoints** - Working Lambda functions (recommended)
   - Health: `GET https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod/api/health`
   - Database Status: `GET https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod/api/admin/database-status`
   - Personas: `GET https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod/api/personas`
   - Conversations: `GET https://vk64sh5aq5.execute-api.us-east-1.amazonaws.com/prod/api/conversations`
2. **DBeaver GUI** - Visual database management
   - Host: `eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com:5432`
   - Database: `amianai`, User: `amianai_admin`
3. **Direct Scripts** - `npm run db:setup`, `npm run db:seed`, `npm run db:show`
