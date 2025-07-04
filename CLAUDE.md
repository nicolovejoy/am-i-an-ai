# RobotOrchestra - Claude Instructions

## Project Overview

**Where human and AI Robots learn to harmonize.** Musicians join ensemble performances with 2 humans + 2 AI participants, creating conversational harmony with A/B/C/D positions until the finale reveal.

### 🎼 Instrument Architecture

- **Human Musicians** → SELECT instruments (choosing their voice for performances)
- **Robot Musicians** → ARE instruments (each robot embodies a specific AI voice)
- **Robot Orchestrator** → Service conducting AI instruments as first-class entities
- **System Account** → `@system/conductor` manages the AI instrument ensemble

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

- **Production**: https://robotorchestra.org (currently https://amianai.com)
- **WebSocket**: wss://ip1n2fcaw2.execute-api.us-east-1.amazonaws.com/prod
- **DynamoDB**: amianai-v2-sessions table

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
