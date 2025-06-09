# Am I an AI?

An interactive portal that invites visitors to engage in conversations from the moment they arrive. Through dynamic, evolving conversations with both AI systems and human agents, we explore the nature of digital identity and communication.

## 🎯 Vision

We're building an ecosystem designed to nurture meaningful interactions built on trust and mutual respect. Whether you're curious about AI capabilities, seeking meaningful conversation, or just looking to explore new ideas, Am I an AI? offers a safe space for engagement and discovery.

## 🛠️ Tech Stack

### Frontend

- Next.js with TypeScript
- Tailwind CSS for styling
- Jest and React Testing Library for testing

### Infrastructure

- AWS (S3, CloudFront, Lambda, API Gateway, RDS PostgreSQL)
- Terraform for IaC
- GitHub Actions for CI/CD

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20 and npm
- AWS CLI configured with appropriate permissions
- Terraform >= 1.0.0

### Deployment

The site is deployed at [amianai.com](https://amianai.com)

### Local Development

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Testing

```bash
cd frontend
npm test
```

## 🧪 Development Approach

We follow these key principles:

1. Build incrementally with small, testable changes
2. Write tests first, then implement
3. Document as we build
4. Simplify and remove complexity
5. Push to production frequently

## 📚 Documentation

- [Lambda Implementation Plan](docs/lambda-implementation-plan.md): Complete serverless API architecture
- [Infrastructure](docs/infrastructure.md): AWS infrastructure and deployment details
- [Next Steps](NEXT_STEPS.md): Current development phase and roadmap
- [Project Summary](PROJECT_SUMMARY.md): Complete platform status overview

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🔧 Infrastructure Management

### Scripts Overview

The project includes several scripts to manage infrastructure:

| Script     | Purpose                             | When to Use                          |
| ---------- | ----------------------------------- | ------------------------------------ |
| `setup.sh` | Initial infrastructure provisioning | First-time setup or complete rebuild |

### Setup Script (`setup.sh`)

The setup script handles the complete infrastructure deployment:

```bash
cd infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/setup.sh
```

This script:

- Initializes Terraform
- Creates all AWS resources (VPC, RDS PostgreSQL, Lambda, API Gateway, S3, CloudFront)
- Configures DNS settings and SSL certificates
- Sets up Lambda functions with VPC connectivity
- Deploys database schema and sample data
- Creates API endpoints for full database integration

Expected duration: 20-40 minutes

### Teardown Script (`destroy.sh`)

The destroy script handles complete cleanup:

```bash
cd infrastructure
DOMAIN_NAME=amianai.com ./scripts/destroy.sh
```

This script:

- Removes all AWS resources created by Terraform
- Cleans up any dependencies
- Backs up configuration when possible

> **Important**: Wait for CloudFront to fully disable before running destroy script again.

### Resource Tags

All resources are tagged with:

- Project = "amianai"
- Environment = "prod"
- Terraform = "true"
