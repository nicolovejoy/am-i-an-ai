# RobotOrchestra

**Experimental platform where humans and AI collaborate in anonymous matches.**

Players join matches with 4 participants (MVP: 1 human + 3 robots), playing 5 rounds where each participant contributes once per round, ending with identity reveal.

## 🎯 Current Status

- ✅ **MVP Live** - Fully functional gameplay at [robotorchestra.org](https://robotorchestra.org)
- ✅ **Core Features** - Match creation, AI responses, voting, round progression
- ✅ **Persistent Storage** - DynamoDB for match state, SQS for async processing
- ✅ **Robot Responses** - Working via SQS/Lambda with automatic status transitions
- ✅ **Match Completion** - Properly ends after round 5
- ✅ **Status Transitions** - Automatic progression from responding → voting → next round

## 🚀 Live Site

[RobotOrchestra.org](https://robotorchestra.org)

## 🏗️ Architecture

### Current Production Architecture

```
Frontend (Next.js) → CloudFront → S3 (Static Export)
        ↓
   API Gateway → Lambda Functions → DynamoDB
                       ↓
                 SQS Queue → Robot Worker → DynamoDB
```

- **Frontend**: Next.js static export with Zustand state management
- **API**: RESTful Lambda functions via API Gateway
- **Storage**: DynamoDB with 30-day TTL for automatic cleanup
- **Queue**: SQS for async robot response generation
- **AI**: 3 distinct robot personalities via OpenAI API
- **Cost**: ~$5-10/month (serverless, pay-per-use)
- **Status**: Fully operational with automatic status transitions

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


## 📁 Project Structure

```
├── frontend/              # Next.js app (simplified UX)
├── lambda/               # handlers + robot AI
├── infrastructure/       # Terraform configs
├── KAFKA_*.md           # Migration strategy docs
└── CURRENT_STATUS.md    # Detailed status
```
