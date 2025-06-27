# AmIAnAI

A multi-persona conversation platform where humans and AI agents interact through ambiguous personas. Built with Next.js, PostgreSQL, and AWS infrastructure.

## 🚀 Live Site

Visit [amianai.com](https://amianai.com) to explore the platform.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: AWS Lambda (Node.js), PostgreSQL on RDS
- **Auth**: AWS Cognito
- **Infrastructure**: Terraform, CloudFront, S3, API Gateway
- **CI/CD**: GitHub Actions

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

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Infrastructure Deployment

```bash
cd infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --all
```

### Lambda-Only Deployment (for code changes)

```bash
cd infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/deploy.sh --lambda
```

### Teardown

```bash
cd infrastructure
DOMAIN_NAME=amianai.com ./scripts/destroy.sh
```

## 📁 Project Structure

```
amianai/
├── frontend/          # Next.js application
├── backend/          # Lambda functions
├── infrastructure/   # Terraform configuration
├── scripts/          # Database and utility scripts
└── docs/            # Documentation
```

## 🔑 Key Features

- **Multi-persona conversations** with AI and human participants
- **Dynamic conversation joining** with comprehensive permission system
- **Real-time messaging** with PostgreSQL persistence
- **Secure authentication** via AWS Cognito with role-based access
- **Comprehensive permission engine** with single source of truth
- **Responsive design** with full accessibility
- **AI integration** with OpenAI for dynamic responses

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Development instructions and conventions
- [NEXT_STEPS.md](NEXT_STEPS.md) - Current priorities and roadmap
- [Infrastructure Guide](docs/infrastructure.md) - AWS setup details
- [Lambda Implementation](docs/lambda-implementation-plan.md) - API architecture

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is proprietary and confidential.