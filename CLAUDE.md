# RobotOrchestra - Claude Instructions

**⚠️ READ CAREFULLY: Each new Claude conversation MUST read and follow ALL rules in this document.**

## Project Overview

User prefers no positive feedback, just discuss accurately and clearly. Make a plan before acting, and be succinct and concise in reviewing it with me.
Don't archive old copies of files that are in git, silly.
User enjoys doing tasks in AWS Console - this helps them learn. Ask them to do console tasks when necessary or helpful (but not always).

**Where humans and AI collaborate in anonymous matches.** Players join matches with a set of other participants. for now, we are using this set: 4 participants (MVP: 1 human + 3 robots), playing 5 rounds where each participant contributes once per round, ending with voting and identity reveal. Over time, that's configurable.

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

  - Any AWS CLI commands that modify infrastructure

- **User handles MOST commits** - Claude bias towards letting user run `git commit` and `git push`
- **Claude can run**: Build commands, tests, linting, local dev servers
- **User happy to move and remove directories and such** - Claude should encourage users assistance whenever helpful
- **Scripts**: reside in `/infrastructure/scripts`

### Development Commands

**Development Strategy**: Use local dev server for debugging and development, but deploy to production often without fear of breaking things.

Frontend development (run from `frontend/`):

```bash
npm run dev  # https://localhost:3001 - better console output and hot reload
```

Pre-deployment checks (run from respective directories):

```bash
# From frontend/
npm run lint && npm run build

# From lambda/
npm test
```

Deployment (user handles, from `infrastructure/`):

```bash
# For Frontend changes:
./scripts/deploy-frontend.sh

# For Lambda changes:
./scripts/deploy-lambdas.sh

# For infrastructure changes:
terraform plan (Claude can run this one anytime) && terraform apply
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

### Important Notes for Claude

- **Production-only development** - no local database, all testing in AWS
- **User manages infrastructure** - Claude implements features, user deploys
- **TDD approach** - write tests first when that makes sense, especially for Lambda functions
- **Follow existing patterns** - match code style and conventions
- **Experimental phase** - infrastructure can be destroyed/recreated anytime
- Please Respond without any unnecessary introductory or concluding remarks
- Be concise and get straight to the point
- Avoid using phrases like 'Great idea,' 'Absolutely,' or 'Of course.'
- Provide only the requested information without embellishment

### Commands NOT permitted for Claude:

- `terraform apply` - infrastructure changes
- `./scripts/deploy-frontend.sh` - frontend deployment
- `./scripts/deploy-lambdas.sh` - Lambda deployment

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

**KEY DOCUMENTS**:

- `/CURRENT_STATUS.md` - Current architecture and implementation plan
