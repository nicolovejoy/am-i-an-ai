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
- ✅ Testing: 284 tests passing with comprehensive coverage

## PLATFORM COMPLETION STATUS

### ✅ **Complete Systems**
1. **Database Layer** - PostgreSQL schema, repositories, API endpoints
2. **Conversation System** - List view, detail view, message interface  
3. **Persona Management** - Full CRUD with AI configuration support
4. **Static Export** - S3-compatible deployment with graceful fallbacks
5. **Testing Infrastructure** - Comprehensive test suite with 95%+ coverage
6. **Accessibility** - Full WCAG compliance with screen reader support

### 🔄 **Next Phase: AI Integration**
The platform is ready for AI service integration. All UI components, database structures, and persona configurations are in place to support AI-powered conversations.

### **AI-Ready Features**
- Persona AI configurations (model provider, system prompts, temperature)
- Message history context for AI responses
- Real-time chat interface for AI participation
- Error handling and fallback systems
- Comprehensive testing framework for AI features

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
1. **DBeaver GUI** - Visual database management (recommended)
   - Host: `eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com:5432`
   - Database: `amianai`, User: `amianai_admin`
2. **API Endpoints** - `/api/admin/database-status`, `/api/admin/setup-database`, `/api/admin/seed-database`
3. **Direct Scripts** - `npm run db:setup`, `npm run db:seed`, `npm run db:show`
