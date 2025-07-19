# RobotOrchestra

**A game where humans try to blend in with AI players.**

One human joins three AI participants responding to creative prompts. Players vote to identify who's human. Built as an experimental platform to explore human-AI interaction.

## 🎯 Current Status (January 19, 2025)

- ✅ **Fully Working** - All 5 rounds playable with voting and identity reveal
- ✅ **AI Integration** - AWS Bedrock with Claude 3 models  
- ✅ **State Management** - Centralized architecture eliminates race conditions
- ✅ **React Query** - Modern frontend with proper caching and state sync
- 🔜 **Next** - Use AI for prompts, admin service deployment, SSE/WebSockets, improved UX

## 🚀 Live Site

[RobotOrchestra.org](https://robotorchestra.org)

## 🏗️ Architecture

```
Frontend (Vite/React) → CloudFront → S3
        ↓
   API Gateway → Match Service → DynamoDB
                       ↓
                 Robot Queue → Robot Worker → AI Service
                       ↓              ↓           ↓
                State Updates → Match Service   AWS Bedrock
```
