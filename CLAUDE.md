# RobotOrchestra - Claude Instructions

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

```bash
# Frontend development (user runs manually in separate window)
cd frontend && npm run dev  # http://localhost:3001

# Pre-commit checks (run from project root)
cd frontend && npm run lint && npm run build
cd lambda && npm test

# Deployment (user handles)
cd infrastructure && terraform plan && terraform apply
cd infrastructure/scripts && ./build-frontend.sh && DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh
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

- **Production**: https://robotorchestra.org (soon. need to update DNS)
- **WebSocket**: wss://ip1n2fcaw2.execute-api.us-east-1.amazonaws.com/pro

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

**FOCUS**: Implementing Kafka-based event architecture, starting with read-only match history.

**IMMEDIATE GOAL**: 
1. Set up MSK Serverless infrastructure
2. Populate with sample match events
3. Display match history from Kafka in UI

**KEY DOCUMENTS**:
- `/KAFKA_MIGRATION_STRATEGY.md` - Full migration plan
- `/CURRENT_STATUS.md` - Current focus and next steps
- `/ROBOT_ORCHESTRATION.md` - How Kafka solves robot coordination

**APPROACH**: Start simple with read-only data to validate architecture before migrating live transactions.
