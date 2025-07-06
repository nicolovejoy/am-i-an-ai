# RobotOrchestra

**Experimental platform where humans and AI collaborate in anonymous matches.**

Players join matches with 4 participants (MVP: 1 human + 3 robots), playing 5 rounds where each participant contributes once per round, ending with identity reveal.

## 🎯 Current Status

- ✅ **MSK Serverless deployed** - Kafka cluster with full VPC setup
- ✅ **Event schemas** - Comprehensive validation with 18 tests  
- ✅ **Sample data generation** - Population script with CLI interface
- 🔄 **Consumer Lambda** - Building match history API
- ⏳ **Frontend integration** - Display Kafka-sourced match history

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

Frontend (from `frontend/`):
```bash
npm run dev  # localhost:3001
```

Pre-commit checks:
```bash
# From frontend/
npm run lint && npm run build

# From lambda/ 
npm test
```

Kafka sample data (from `lambda/`):
```bash
npm run populate-kafka -- --cluster-arn <arn> --count 10
```

## 📁 Project Structure

```
├── frontend/              # Next.js app (simplified UX)
├── lambda/               # WebSocket handlers + robot AI
├── infrastructure/       # Terraform configs  
├── KAFKA_*.md           # Migration strategy docs
└── CURRENT_STATUS.md    # Detailed status
```