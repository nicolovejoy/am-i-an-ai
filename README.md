# RobotOrchestra

**Experimental platform where humans and AI collaborate in anonymous matches.**

Players join matches with 4 participants (MVP: 1 human + 3 robots), playing 5 rounds where each participant contributes once per round, ending with identity reveal.

## 🎯 Current Status

- ✅ **Infrastructure deployed** - AWS serverless stack running
- ✅ **CI/CD pipeline working** - GitHub Actions deploy successfully  
- ✅ **Frontend simplified** - Clean UX with dashboard, match history, admin pages
- ✅ **Backend functional** - WebSocket Lambda with robot AI integration
- 🔄 **Migrating to Kafka** - Event-driven architecture for robot orchestration

**Minor issue**: DNS nameservers need updating at domain registrar

## 🚀 Live Site
[RobotOrchestra.org](https://robotorchestra.org)

## 🏗️ Architecture Evolution

**Current**: In-memory WebSocket handler with synchronous robots  
**Target**: Kafka-based event streaming with independent robot services

Key documents:
- `KAFKA_MIGRATION_STRATEGY.md` - Migration plan and phases
- `KAFKA_SERVICE_ARCHITECTURE.md` - Service separation design  
- `ROBOT_ORCHESTRATION.md` - Robot management via Kafka

## 🛠️ Tech Stack

### Current
- **Frontend**: Next.js + TypeScript + Tailwind + Zustand
- **Backend**: WebSocket Lambda + DynamoDB  
- **Infrastructure**: AWS Serverless (~$5/month)

### Target (Kafka Migration)
- **Event Streaming**: MSK Serverless (~$50-80/month)
- **Services**: Match Service + Robot Orchestration Service
- **Storage**: Kafka as event store + DynamoDB for materialized views

## 🏃 Development

```bash
# Frontend (localhost:3001)
cd frontend && npm run dev

# Pre-commit checks (required)  
cd frontend && npm run lint && npm run build
cd lambda && npm test

# Deployment (user handles)
# GitHub Actions auto-deploy on push to main
```

## 📁 Project Structure

```
├── frontend/              # Next.js app (simplified UX)
├── lambda/               # WebSocket handlers + robot AI
├── infrastructure/       # Terraform configs  
├── KAFKA_*.md           # Migration strategy docs
└── CURRENT_STATUS.md    # Detailed status
```