# RobotOrchestra - Claude Instructions

## Project Overview

**Where humans and AI collaborate in anonymous conversations.** Players join sessions with 2 humans + 2 AI participants, creating conversational interactions with A/B/C/D positions until the final reveal.

### 🎯 Participant Architecture

- **Human Players** → ASSIGNED personas automatically (behind the scenes, not visible in UX)
- **AI Participants** → HAVE distinct personas (each AI embodies a specific persona)
- **AI Orchestrator** → Service managing AI participants as first-class entities
- **System Account** → `@system/coordinator` manages the AI participant group

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

### Command Permissions

Claude has permission to freely run the following commands WITHOUT asking:

- npm test (and any test variations)
- grep (for searching code)
- tsc (TypeScript compilation)
- cd (directory navigation)
- ls, pwd (directory listing/location)
- cat, head, tail (file reading)
- Any other read-only or development commands

Just run them and continue with your work.
