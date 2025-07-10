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

- **User handles ALL deployments** - Claude NEVER runs deployment commands, including:
  - `terraform apply` (infrastructure)
  - `./scripts/deploy-frontend.sh` (frontend)
  - `./scripts/deploy-lambdas.sh` (backend)
  - `git push` (code pushes)
  - Any AWS CLI commands that modify infrastructure
- **User handles ALL commits** - Claude NEVER runs `git commit` or `git push`
- **Claude can run**: Build commands, tests, linting, local dev servers
- **User happy to move and remove directories and such** - Claude should encourage users assistance whenever helpful
- **Scripts**: reside in `/infrastructure/scripts` -- for details see readme in this directory.

### Development Commands

**IMPORTANT**: Never prefix commands for the user to execute with "cd". Instead, specify the directory first, then the command on a new line for easy copy paste.

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
./scripts/deploy-lambdas.sh

# For infrastructure changes:
terraform plan && terraform apply
```

**⚠️ IMPORTANT: Lambda deployments use the deploy-lambdas.sh script, NOT terraform apply!**

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

### Commands NOT permitted for Claude:

- `sed` - file editing
- `terraform apply` - infrastructure changes
- `./scripts/deploy-frontend.sh` - frontend deployment
- `./scripts/deploy-lambdas.sh` - Lambda deployment  
- `git commit` - committing code
- `git push` - pushing code
- `aws s3 sync` - S3 uploads
- `aws cloudfront create-invalidation` - CDN updates
- Any command that costs money or modifies production resources

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

## 🚨 KEY LEARNINGS FROM JULY 9, 2025 FIXES

### TDD Approach Success

- Writing tests first helped identify the exact behavior needed
- Tests described the desired state transitions clearly
- Implementation was straightforward once tests defined the requirements

### Status Transition Logic

- Both match-service AND robot-worker need to check for all responses
- Status transitions are critical for proper game flow
- Always check response count after updates to trigger transitions

### Test Infrastructure

- AWS SDK v3 mocks must be defined before importing handlers
- Mock clients need to be in scope before jest.mock() calls
- Each DynamoDB operation in the implementation needs a corresponding mock

### Frontend Store Pattern

- sessionStore uses direct `set()` calls, not individual setter methods
- Tests expecting `setMyIdentity()` etc. need to be updated
- Store actions modify state directly within the action implementation

### Architecture Benefits

- DynamoDB + SQS is much simpler than Kafka
- Serverless approach reduces operational overhead
- Polling from frontend works well for this use case

**KEY DOCUMENTS**:

- `/CURRENT_STATUS.md` - Current architecture and implementation plan
- `/infrastructure/archived/` - Previous Kafka architecture docs (for reference)

**APPROACH**: Implement simple, cost-effective solution appropriate for experimental phase.
