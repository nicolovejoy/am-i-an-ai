# RobotOrchestra

**A game where humans try to blend in with AI players.**

One human joins three AI participants responding to creative prompts. Players vote to identify who's human. Built as an experimental platform to explore human-AI interaction.

## 🎯 Current Status (January 16, 2025)

- ✅ **AI Integration** - AWS Bedrock with Claude 3 models working
- ✅ **Core Gameplay** - Full match flow with 5 rounds  
- ⚠️ **Round 5 Bug** - Cannot submit response in final round (fix in progress)
- 🚧 **Frontend Refactor** - Migrating to React Query + Zod schemas
- 🔜 **Next** - Complete migration, deploy fix, implement Phase 3 backend refactor

## 🚀 Live Site

[RobotOrchestra.org](https://robotorchestra.org)

## 🏗️ Architecture

```
Frontend (Vite/React) → CloudFront → S3
        ↓
   API Gateway → Lambda Functions → DynamoDB
                       ↓
                 SQS Queue → Robot Worker → AI Service
                                    ↓
                               AWS Bedrock (Claude 3)
```
