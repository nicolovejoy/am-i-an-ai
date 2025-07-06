# RobotOrchestra - Claude Instructions

**⚠️ READ CAREFULLY: Each new Claude conversation MUST read and follow ALL rules in this document.**

## Project Overview

**Where humans and AI collaborate in anonymous matches.** Players join matches with 4 participants (MVP: 1 human + 3 robots), playing 5 rounds where each participant contributes once per round, ending with voting and identity reveal.

### 🎯 Current Architecture (MVP)

- **Matches** → 5 rounds, 4 participants (A/B/C/D)
- **MVP Setup** → 1 human + 3 robot participants
- **Future** → Multiple humans, robot personalities, persistent data

### ⚠️ EXPERIMENTAL PROJECT STATUS

**Early-stage experimental project with NO LIVE USERS.**

- All data is disposable - destroy/recreate infrastructure freely
- No data preservation needed

## Development Workflow

### Deployment

- **User handles ALL deployments** - Claude never runs deployment commands
- **Scripts**: reside in `/infrastructure/scripts` -- for details see readme in this directory.

### Development Commands

**IMPORTANT**: Never prefix commands with "cd". Instead, specify the directory first, then the command on a new line.

Frontend development (run from `frontend/`):
```bash
npm run dev  # http://localhost:3001
```

Pre-commit checks (run from respective directories):
```bash
# From frontend/
npm run lint && npm run build

# From lambda/
npm test
```

Deployment (user handles, from `infrastructure/`):
```bash
terraform plan && terraform apply
```

### Pre-Commit Requirements

**MANDATORY: Before any git commit, run these checks:**

Frontend checks (from `frontend/`):
```bash
npm run lint    # Fix all errors (warnings OK)
npm run build   # Must complete successfully
```

Backend checks (from `lambda/`):
```bash
npm test        # All tests must pass
```

**❌ NEVER commit if any check fails**

### Key URLs

- **Production**: https://robotorchestra.org (soon. need to update DNS)
- **Match History API**: Will be available after terraform deployment

### Important Notes

- **Production-only development** - no local database, all testing in AWS
- **User manages infrastructure** - Claude implements features, user deploys
- **TDD approach** - write tests first when that makes sense, especially for Lambda functions
- **Follow existing patterns** - match code style and conventions
- **Experimental phase** - infrastructure can be destroyed/recreated anytime

### Commands not permitted for Claude:

- sed
- deploy scripts

### Command Permissions

Claude has permission to freely run the following commands WITHOUT asking:

- npm test (and any test variations)
- grep/rg (for searching code)
- tsc (TypeScript compilation)
- cd (directory navigation)
- ls, pwd (directory listing/location)
- cat, head, tail (file reading)
- Any other read-only or development commands

Just run them and continue with your work.

## Development Philosophy

- always write tests before writing features. However, when existing tests are failing the first question is, can I delete the test or is it serving a purpose? No worries if we break the front end. We do it every day during this phase of experimental development.

## 🚨 CURRENT PRIORITY: KAFKA MIGRATION - PHASE 1

**FOCUS**: Building Kafka consumer Lambda for match history API.

**PHASE 1 STATUS**: 
- ✅ MSK Serverless infrastructure deployed
- ✅ Event schemas with comprehensive tests  
- ✅ Sample data generator and population script
- 🔄 Consumer Lambda for match history API (in progress)
- ⏳ Frontend integration

**KEY DOCUMENTS**:
- `/KAFKA_MIGRATION_STRATEGY.md` - Full migration plan
- `/CURRENT_STATUS.md` - Current focus and next steps
- `/ROBOT_ORCHESTRATION.md` - How Kafka solves robot coordination

**APPROACH**: Start simple with read-only data to validate architecture before migrating live transactions.
