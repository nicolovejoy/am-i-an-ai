# AmIAnAI v2

**2H+2AI real-time anonymous conversations.** Two humans and two AI participants engage in 10-minute anonymous discussions with A/B/C/D identities, revealing who's who only at the end.

## 🚀 Live Site

Visit [amianai.com](https://amianai.com) to join anonymous 2H+2AI conversations.

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

- **2H+2AI conversations** - Anonymous real-time chat with 2 humans + 2 AI participants
- **A/B/C/D anonymity** - Participants identified only by letters until reveal
- **10-minute sessions** - Timed conversations with identity reveal at end
- **Real-time WebSocket** - Instant message sync across all participants
- **AI personalities** - Two distinct AI participants with different conversation styles
- **Session timer** - Synchronized countdown with server-side time coordination
- **Cost optimized** - 95% savings vs v1 ($90/month → $5/month)

## 🏗️ Architecture

### Current State (Mixed v1/v2)
- **Frontend**: v2 React app deployed at amianai.com
- **Backend**: v2 WebSocket system (DynamoDB + Lambda)
- **Infrastructure**: Partially destroyed v1, working v2 components

### Target State (Clean v2)
- **Serverless-only**: No VPC, NAT Gateway, or RDS
- **Real-time focus**: WebSocket-first architecture
- **Cost efficient**: ~$5/month vs v1's $90/month
- **Simple & maintainable**: ~800 lines vs v1's 15,000+ lines

## 📊 Migration Status

- ✅ v2 frontend deployed and working
- ✅ v2 WebSocket system operational  
- ✅ 2H+2AI conversations functional
- 🚧 Infrastructure in mixed state (partial v1 destruction)
- 🚧 GitHub Actions workflow broken
- 📋 **Next**: Clean slate rebuild (see NEXT_STEPS.md)

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Development instructions and conventions
- [NEXT_STEPS.md](NEXT_STEPS.md) - Current priorities and roadmap
- [Infrastructure Guide](docs/infrastructure.md) - AWS setup details
- [Lambda Implementation](docs/lambda-implementation-plan.md) - API architecture

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is proprietary and confidential.