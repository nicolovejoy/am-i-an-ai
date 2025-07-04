# RobotOrchestra

**Where humans and AI collaborate in anonymous conversations**

An experimental platform exploring trust and collaboration between humans and AI through anonymous conversational sessions. Players join sessions with 2 humans + 2 AI participants, attempting to identify who's human and who's AI.

**Session Format** Players participate in structured sessions with 2 AI participants + 2 human players. During the entire session (5 rounds), no one knows who is who. Each participant is assigned to one of four positions: A/B/C/D until the final reveal after all rounds and voting are complete.

### 🎯 The Participant System

- **Human Players**: Choose from a selection of communication styles and personalities for each session
- **AI Participants**: Each AI has a distinct personality and communication style, managed by the AI Orchestrator service
- **Anonymous Sessions**: All participants interact through their A/B/C/D positions, with personalities adding depth to the conversation

## 🚀 Live Site

[RobotOrchestra.org](https://robotorchestra.org) (currently at [amianai.com](https://amianai.com))

## 🛠️ Tech Stack (v2)

- **Frontend**: React + Next.js, TypeScript, Tailwind CSS, Zustand
- **Backend**: WebSocket Lambda (Node.js), DynamoDB
- **Auth**: AWS Cognito (reused from v1)
- **Infrastructure**: Serverless-only (no VPC), CloudFront, S3
- **Real-time**: API Gateway WebSocket + Lambda

## 🏃 Quick Start

### Prerequisites

- Node.js >= 20
- AWS CLI configured
- Terraform >= 1.0.0

### Local Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server (runs on port 3001)
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001)

**Note:** Local dev connects to production WebSocket API for real-time functionality.

### Testing

```bash
# Run v2 WebSocket tests
cd lambda && npm test

# Run frontend tests
cd frontend && npm test
```

## 🚀 Deployment

**⚠️ Currently in migration state - GitHub Actions workflow broken**

### Manual Infrastructure Deployment

```bash
cd infrastructure
terraform init
DOMAIN_NAME=amianai.com terraform apply
```

### Manual Frontend Deployment

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://amianai.com --delete
aws cloudfront create-invalidation --distribution-id $(terraform output -raw cloudfront_distribution_id) --paths "/*"
```

## 📁 Project Structure (v2)

```
amianai/
├── frontend/          # React application (was v2/frontend)
├── lambda/           # WebSocket handlers (was v2/lambda)
├── infrastructure/   # Terraform configs (shared + v2)
├── archive/v1/      # Legacy code (preserved)
├── v2/              # TEMPORARY - will be reorganized
└── scripts/         # Deployment utilities
```

## 🔑 Key Features (v2)

- **2H+2AI sessions** - Anonymous conversational sessions with 2 humans + 2 AI participants
- **A/B/C/D positions** - Participants identified only by position until the final reveal
- **Personality system** - Humans select communication styles; AI participants have distinct personalities
- **5-round sessions** - Structured prompt-response-vote rounds
- **Real-time WebSocket** - Instant synchronization across all participants
- **AI Orchestrator** - Manages AI participants as first-class entities
- **Session timer** - Synchronized timing for each round
- **Cost optimized** - 95% savings vs v1 ($90/month → $5/month)

## 🏗️ Architecture

### Current State

- **Frontend**: React app deployed at amianai.com
- **Backend**: WebSocket system (DynamoDB + Lambda)

### Target State

- **Serverless-only**: No VPC, NAT Gateway, or RDS
- **Real-time focus**: WebSocket-first architecture

## 📄 License

This project is proprietary.
