# RobotOrchestra

**Where human and AI Robots learn to harmonize**

An experimental platform exploring trust and collaboration between humans and AI through anonymous conversational performances. Musicians (users) select instruments (personas) to join ensemble performances where they attempt to identify who's human and who's AI.

**Ensemble Performances** Musicians select an instrument (persona) to play during performances, joining 2 Robots (who ARE AI instruments) + 2 human musicians. During the entire performance (5 movements), no one knows who is who. Each musician is assigned to one of four positions: A/B/C/D until the finale reveal after all movements and voting are complete.

### 🎼 The Instrument System

- **Human Musicians**: Choose from a selection of instruments (communication styles, personalities) to play during performances
- **Robot Musicians**: Each robot IS a distinct AI instrument with its own voice, managed by the Robot Orchestrator service
- **Anonymous Performance**: All musicians interact through their A/B/C/D positions, with instruments adding depth to the harmony

Our MVP performance flow is described in USER_JOURNEY_MVP.md.

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

- **2H+2AI ensembles** - Anonymous conversational performances with 2 humans + 2 AI musicians
- **A/B/C/D positions** - Musicians identified only by position until the finale
- **Instrument system** - Humans select instruments to play; robots ARE distinct AI instruments
- **5-movement performances** - Structured prompt-response-vote movements
- **Real-time WebSocket** - Instant synchronization across all musicians
- **Robot Orchestrator** - Conducts AI instruments as first-class entities
- **Performance timer** - Synchronized timing for each movement
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
