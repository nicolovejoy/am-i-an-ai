# Am I an AI? 🤖

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-Powered-orange)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/Terraform-1.0+-purple)](https://www.terraform.io/)

A modern web application that helps users determine if text was written by a human or AI.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Infrastructure Management](#-infrastructure-management)
- [Progress Log](#-progress-log)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features (many to be built yet)

- Portal -- a graphic and aluring enterance, visual, starwars themed, that invites visitors to join the ecosystem by creating an account and interacting with our community greeting agent. login and create accounts here.
- Change-log a list of all the commit message with time and date listed, reverse chronological order
- Text analysis to determine AI vs. human authorship

## 🛠️ Tech Stack

### Frontend

- Next.js 15 with TypeScript 5
- React 19 for UI components
- TanStack Query (React Query) for data fetching
- Jest 29 and React Testing Library 16 for testing
- Zustand 5 for state management
- Tailwind CSS for styling

### Infrastructure

- AWS (S3, CloudFront, Lambda)
- Terraform for IaC
- GitHub Actions for CI/CD

## 📚 Documentation

Detailed documentation for specific aspects of the project:

- [Design System & UI Components](docs/design-system.md): Details about the 80's retro-futuristic design system, components, and styling
- [Infrastructure & Architecture](docs/infrastructure.md): Information about the AWS infrastructure, architecture, and deployment

## 🚀 Getting Started

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0.0
- Node.js >= 16 and npm for frontend development
- Domain name configured in Route53 (with NS and SOA records)

### Infrastructure Setup

1. Configure AWS credentials:

```bash
aws configure
```

2. Deploy infrastructure:

```bash
cd infrastructure
./scripts/setup.sh
```

The setup script will:

- Initialize Terraform
- Deploy all AWS resources
- Wait for SSL certificate validation
- Configure CloudFront distribution
- Deploy initial website content

> **Note**: The setup process takes approximately 15-30 minutes due to SSL certificate validation (5-15 minutes) and CloudFront distribution creation (10-15 minutes).

### Frontend Setup

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

## 💻 Development Workflow

### Local Development

1. Make changes to the React app in `frontend/`
2. Test locally with `npm start`
3. Run tests with `npm test`
4. Verify changes with linting: `npm run lint`

### Deployment

#### Automated Deployment with GitHub Actions

Deployment is fully automated via GitHub Actions workflow. The process is triggered on push to the main branch:

1. GitHub Actions workflow is triggered
2. Code is checked out and dependencies are installed
3. Tests are run to verify changes
4. Application is built
5. Built files are deployed to S3
6. CloudFront cache is invalidated

This eliminates the need for manual deployment steps.

#### Manual Deployment (Fallback)

If needed, manual deployment can still be performed:

```bash
cd frontend
npm run build
aws s3 sync build/ s3://amianai.com
aws cloudfront create-invalidation --distribution-id $(cd ../infrastructure && terraform output -raw cloudfront_distribution_id) --paths "/*"
```

## 🧪 Testing

The project uses Jest and React Testing Library for testing components and services.

### Running Tests

```bash
cd frontend
npm test
```

To run tests with coverage:

```bash
npm test -- --coverage
```

### Test Structure

- Component tests located alongside component files
- Service tests in their respective directories
- Mock Service Worker (MSW) for API mocking

### Git Hooks with Husky

The project uses Husky to run pre-commit hooks:

- ESLint for code quality
- Prettier for code formatting
- Tests are run before commits

## 🚀 CI/CD with GitHub Actions

The project uses GitHub Actions for continuous integration and deployment, automating the build, test, and deployment process.

### Workflow Overview

The GitHub Actions workflow is triggered automatically when:

- Code is pushed to the main branch
- Pull requests are created or updated

### Key Features

- **Automated Testing**: Runs the entire test suite to catch issues early
- **Build Verification**: Ensures the application builds successfully
- **Automated Deployment**: Deploys frontend to S3 and invalidates CloudFront cache
- **Security**: Uses AWS OIDC for secure cloud authentication without storing credentials
- **Failure Notifications**: Alerts developers of build or deployment failures

### Workflow File

The workflow configuration is located in `.github/workflows/` directory. It defines:

- Triggers (push, pull request)
- Required permissions
- Build environment
- Deployment steps
- Post-deployment validations

## 🔧 Infrastructure Management

### Scripts Overview

The project includes several scripts to manage infrastructure:

| Script       | Purpose                             | When to Use                          |
| ------------ | ----------------------------------- | ------------------------------------ |
| `setup.sh`   | Initial infrastructure provisioning | First-time setup or complete rebuild |
| `destroy.sh` | Tear down all infrastructure        | When decommissioning the project     |

Future scripts in development:

- `deploy.sh` - Automate frontend builds and deployment
- `update-infra.sh` - Apply infrastructure changes safely

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

## 📋 Progress Log

### Completed

- ✅ Local Terraform state configuration
- ✅ S3 bucket for website hosting
- ✅ CloudFront distribution
- ✅ SSL certificate and validation
- ✅ DNS configuration
- ✅ Infrastructure management scripts
- ✅ Basic React application setup
- ✅ Testing infrastructure setup
- ✅ Git hooks with Husky
- ✅ GitHub Actions CI/CD workflow

### Next Steps

- [ ] CI/CD Improvements:
  - [ ] Create `deploy.sh` script for local/emergency deployments
  - [ ] Enhance GitHub Actions workflow with deployment approval gates
  - [ ] Add performance benchmarking to CI pipeline
  - [ ] Implement infrastructure validation in CI workflow
- [ ] Infrastructure:
  - [ ] Configure monitoring and logging
  - [ ] Set up development and staging environments
  - [ ] Add CloudWatch alarms
- [ ] Frontend Features:
  - [ ] Complete AI text detection functionality
  - [ ] Implement user authentication
  - [ ] Add account history and analytics
- [ ] Testing Improvements:
  - [ ] Properly set up MSW for API mocking
  - [ ] Fix the App component test to properly mock react-router-dom
  - [ ] Add more comprehensive tests for components and services
  - [ ] Set up end-to-end testing with Cypress

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **CloudFront taking long to disable**

   - Wait 10-15 minutes for the distribution to fully disable
   - Check status in AWS Console or using AWS CLI

2. **Certificate validation issues**

   - Ensure Route53 NS records are correct
   - Wait up to 15 minutes for DNS propagation

3. **S3 bucket issues**

   - Check bucket name matches domain name
   - Verify bucket region is us-east-1

4. **Testing failures**
   - Ensure all dependencies are installed
   - Check for ESM compatibility issues with MSW
   - Verify that react-router-dom is properly mocked in tests

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
