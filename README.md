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

- AWS (S3, CloudFront, Lambda)
- Terraform for IaC
- GitHub Actions for CI/CD

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16 and npm
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

- [Design System](docs/design-system.md): Our clean, modern design system
- [Infrastructure](docs/infrastructure.md): AWS infrastructure and deployment details

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
./scripts/setup.sh
```

This script:

- Initializes Terraform
- Creates all AWS resources (S3, CloudFront, etc.)
- Configures DNS settings
- Sets up SSL certificates
- Creates initial deployment paths

Expected duration: 15-30 minutes

### Teardown Script (`destroy.sh`)

The destroy script handles complete cleanup:

```bash
cd infrastructure
./scripts/destroy.sh
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
