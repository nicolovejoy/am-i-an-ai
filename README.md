# RobotOrchestra

**A game where humans try to blend in with AI players.**

One human joins three AI participants responding to creative prompts. Players vote to identify who's human. Built as an experimental platform to explore human-AI interaction.

## 🎯 Current Status (January 15, 2025)

- ✅ **AI Integration** - AWS Bedrock with Claude 3 models working
- ✅ **Core Gameplay** - Full match flow with 5 rounds
- ✅ **Keyboard Navigation** - Full keyboard support for voting
- ⚠️ **Known Issue** - Voting page display bug (see ACTION_PLAN.md)
- 🔜 **Next** - State management optimization, reduce API polling

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
