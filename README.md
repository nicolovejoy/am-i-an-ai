# RobotOrchestra

**Experimental platform where humans and AI collaborate in anonymous matches.**

Players join matches with 4 participants (MVP: 1 human + 3 robots), playing 5 rounds where each participant contributes once per round, ending with voting and identity reveal.

## 🎯 Current Status

- ✅ **MVP Live** - Functional gameplay at [robotorchestra.org](https://robotorchestra.org)
- ✅ **Core Features** - Match creation, AI responses, voting, round progression
- ✅ **Persistent Storage** - DynamoDB for match state, SQS for async processing
- ✅ **Robot Responses** - Working via SQS/Lambda with automatic status transitions
- ✅ **Frontend Migration** - Migrated from Next.js to Vite for better performance

## 🚀 Live Site

[RobotOrchestra.org](https://robotorchestra.org)

## 🏗️ Architecture

### Current Production Architecture

```
Frontend (Vite/React) → CloudFront → S3 (Static Export)
        ↓
   API Gateway → Lambda Functions → DynamoDB
                       ↓
                 SQS Queue → Robot Worker → DynamoDB
```
