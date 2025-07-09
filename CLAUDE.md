# RobotOrchestra - Claude Instructions

**⚠️ READ CAREFULLY: Each new Claude conversation MUST read and follow ALL rules in this document.**

## Project Overview

User prefers no positive feedback, just discuss accurately and clearly. Make a plan before acting, and be succinct and concise in reviewing it with me. thank you.
Don't archive old copies of files that are in git, silly.

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
# For Lambda changes ONLY:
./scripts/deploy-lambda.sh

# For infrastructure changes:
terraform plan && terraform apply
```

**⚠️ IMPORTANT: Lambda deployment uses scripts, NOT terraform apply!**

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
- **Architecture Decision** - Using DynamoDB + SQS instead of Kafka for simplicity

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

## 🚨 CURRENT PRIORITY: FIX FRONTEND DISPLAY & TDD

**FOCUS**: Fix frontend to display robot responses and update tests.

**STATUS**:

- ✅ DynamoDB + SQS infrastructure working correctly
- ✅ Robot responses ARE being generated and stored
- 🔧 Frontend not showing responses (sessionStore issue)
- 🔧 Need to update status transitions (responding → voting)
- 🔧 Frontend tests need updating for new architecture

**KEY BUGS**:
1. ✅ ~~`roundResponses` only populates when status='voting'~~ (FIXED)
2. Status remains 'responding' after all responses collected
3. Robot-worker should update status when all 4 responses exist
4. Round 5 loops infinitely instead of ending match
5. Voting options shuffle positions (should be stable)
6. Player identities get reassigned during voting

**CLEANUP NEEDED**:
- Remove timer-related code from sessionStore
- Delete obsolete test files (SessionTimer, GameHeader, TestingModeToggle)
- Update tests that reference testingMode/startTestingMode

**KEY DOCUMENTS**:

- `/CURRENT_STATUS.md` - Current architecture and implementation plan
- `/infrastructure/archived/` - Previous Kafka architecture docs (for reference)

**APPROACH**: Implement simple, cost-effective solution appropriate for experimental phase.
