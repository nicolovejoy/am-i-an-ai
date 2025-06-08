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
npm run lint
npm run test
npm run build  # This includes TypeScript compilation check
```
- All linting errors must be fixed
- All tests must pass
- TypeScript compilation must succeed
- Only commit if ALL checks pass
- If any check fails, fix issues before committing

## Current Status
- ✅ Infrastructure: PostgreSQL-based, deployed to AWS (`eeyore-postgres` RDS instance running)
- ❌ Database: Schema and seed scripts created but not yet deployed due to TypeScript module issues
- ✅ Frontend: Next.js with comprehensive type system (200+ interfaces)

## NEXT STEPS TO COMPLETE DATABASE SETUP

### Current Issue
The database schema and seeding scripts have TypeScript/Node.js ES module import issues preventing execution.

### Option 1: Fix TypeScript Module Issues (Recommended)
```bash
cd frontend

# Fix the npm scripts - update package.json to use proper CommonJS syntax:
"db:setup": "npx tsx scripts/setup-schema.ts"
"db:seed": "npx tsx scripts/seed-database.ts"

# Install tsx if needed:
npm install --save-dev tsx

# Then run:
npm run db:setup
npm run db:seed
```

### Option 2: Use PostgreSQL Client (Alternative)
1. Install PostgreSQL client: `brew install postgresql`
2. Connect directly to database:
   ```bash
   # Get credentials from AWS Secrets Manager first
   psql -h eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com -U amianai_admin -d amianai
   ```
3. Run SQL from `src/lib/schema.ts` manually to create tables
4. Run seed data creation manually

### Option 3: Use Database Management Tool
1. Download DBeaver or pgAdmin
2. Connect using RDS endpoint: `eeyore-postgres.cw92m20s8ece.us-east-1.rds.amazonaws.com:5432`
3. Use GUI to run schema creation and seeding

### What Needs to Happen
1. **Create database schema** - All tables (users, personas, conversations, messages, analytics)
2. **Seed with sample data** - Users (Alice, Bob, Charlie), Personas (Creative Writer, Philosopher, AI agents), Conversations, Messages
3. **Verify data creation** - Confirm tables exist and contain expected sample data

### Files Ready for Deployment
- `src/lib/schema.ts` - Complete PostgreSQL schema creation
- `src/lib/seedData.ts` - Rich sample data (users, personas, conversations, messages)
- `scripts/setup-schema.ts` - Schema deployment script
- `scripts/seed-database.ts` - Data seeding script