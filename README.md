# RobotOrchestra

**An experimental platform exploring trust and collaboration between humans and AI through anonymized matches where participants try and determine who is human and who is a robot (AI).**

Players join 5-round matches with 2 humans + 2 AI participants, attempting to identify who's human and who's AI. Each participant is assigned a position (A/B/C/D) until the final reveal.

## 🚀 Live Site

[RobotOrchestra.org](https://robotorchestra.org)

## 🛠️ Tech Stack

- **Frontend**: Next.js + TypeScript + Tailwind + Zustand
- **Backend**: WebSocket Lambda + DynamoDB
- **Infrastructure**: AWS Serverless (S3 + CloudFront + API Gateway)
- **Cost**: ~$5/month

## 🏃 Development

```bash
# Frontend (localhost:3001)
cd frontend && npm run dev

# Pre-commit checks (required before commit)
cd frontend && npm run lint && npm run build
cd lambda && npm test
```

## 🔑 Key Features

- **2H+2AI Matches**: Anonymous conversations with mixed participants
- **5-Round Structure**: Prompt → Response → Vote format
- **Real-time WebSocket**: Instant synchronization
- **AI Orchestrator**: 3 distinct AI personalities
- **Testing Mode**: Solo practice with AI participants

## 📁 Project Structure

```
├── frontend/          # Next.js app
├── lambda/           # WebSocket handlers  
├── infrastructure/   # Terraform configs
└── scripts/         # Deployment utilities
```

## 🚀 Deployment

User handles all deployments via scripts in `/infrastructure/scripts/`.

See `/infrastructure/README.md` for details.