# Interactive Agent Portal 🤖💬

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-Powered-orange)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/Terraform-1.0+-purple)](https://www.terraform.io/)

An interactive portal that engages visitors in conversations with both AI and human agents. The platform tracks interactions, builds trust profiles, and creates a dynamic engagement environment.

## 🎯 Project Purpose

This project is an interactive portal that:

- Invites visitors to engage in conversation immediately
- Supports multiple types of interactions (pre-defined, AI-generated, human-to-human)
- Tracks visitors and creates user records as they navigate
- Stores all conversations for analysis
- Implements authentication and trust levels for agents
- Distinguishes between human and AI agents
- Creates an engaging experience that evolves over time

The architecture involves incremental development, starting with simplified functionality while working toward the complete vision.

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

## ✨ Features

- **Interactive Conversations**: Engage with AI and human agents in natural conversation
- **Multi-Agent Support**: System can route conversations to appropriate agents (AI or trusted humans)
- **User Tracking**: Anonymous sessions are converted to registered users as trust builds
- **Trust System**: Progressive trust levels unlock additional features and capabilities
- **Conversation Analysis**: All interactions are analyzed to improve system intelligence
- **Authentication**: Secure login system with different permission levels
- **Responsive Design**: Works seamlessly across desktop and mobile devices

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

The project uses a comprehensive testing strategy to ensure reliability and maintainability.

### Current Test Coverage

#### Frontend Tests

The frontend has several test categories already implemented:

1. **State Management Tests**

   - `useAuthStore.test.ts`: Tests authentication state management including login, logout, and error handling
   - Proper mocking of localStorage and API services

2. **Component Tests**

   - `LoginForm.test.tsx`, `RegisterForm.test.tsx`: Authentication form validation and submission
   - `ProtectedRoute.test.tsx`: Route protection based on authentication status
   - `NavMenu.test.tsx`: Navigation component behavior
   - Page tests for layout, login, register, and account pages

3. **Test Infrastructure**
   - Jest with React Testing Library
   - Mock implementations for auth store and browser APIs
   - Test setup in `jest.setup.js` and configuration in `jest.config.js`

### Testing Approach Moving Forward

#### Backend Tests

1. **DynamoDB Repository Tests**

   - CRUD operations for User repository
   - CRUD operations for Interaction repository
   - Query performance for common access patterns
   - Proper error handling tests

2. **API Endpoint Tests**

   - Authentication endpoints (login, register, logout)
   - User profile management endpoints
   - Conversation and interaction endpoints
   - Error handling and validation

3. **Middleware Tests**

   - Authentication middleware
   - Error handling middleware
   - Request validation

4. **Utility Function Tests**
   - Password hashing and verification
   - Token generation and validation
   - Date/time handling and formatting

#### Frontend Expansion

1. **Component Tests**

   - Conversation interface components
   - Agent interaction UI
   - Profile and settings components
   - Trust indicators and feedback UI

2. **Integration Tests**

   - Complete user flows (register → login → conversation)
   - Error recovery paths
   - Progressive feature unlocking based on trust levels

3. **End-to-End Tests**
   - User registration and onboarding
   - Conversation with different agent types
   - Account management features

### Testing Tools

- **Unit & Integration Tests**: Jest for both frontend and backend
- **Component Testing**: React Testing Library
- **API Testing**: SuperTest for HTTP endpoint testing
- **Database Testing**: DynamoDB local for isolated database testing
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **E2E Testing**: Cypress for full end-to-end testing

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# With coverage
npm test -- --coverage

# Backend tests (once implemented)
cd backend
npm test
```

### CI/CD Integration

Tests are automatically run as part of the CI/CD pipeline using GitHub Actions, ensuring that all code changes are verified before deployment.

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

## 🗺️ Implementation Roadmap

1. **Implement Backend API**

   - Set up the Node.js/Express backend as outlined in BACKEND_SETUP.md
   - Set up DynamoDB tables for Users, Conversations, and Agent interactions
   - Implement authentication endpoints (register, login, logout)
   - Replace the mock API functions in `api.ts` with real API calls

2. **Enhance User Profiles**

   - Implement the "Modify Profile Configuration" functionality on the account page
   - Add user avatar/image upload capability
   - Add email verification process
   - Implement password reset functionality

3. **Conversation Storage**

   - Create database schema for storing conversations
   - Add API endpoints for retrieving and storing conversation history
   - Implement frontend components to display conversation history

4. **Admin Dashboard**
   - Create admin-specific routes and components
   - Implement user management features
   - Add basic analytics for conversation monitoring

### Phase 3 Transition Tasks

1. **AI Integration Foundation**

   - Select AI conversation model (OpenAI, Anthropic, etc.)
   - Implement API integration for AI conversations
   - Create conversation context management system
   - Replace mock analysis results with actual AI detection

2. **Conversation UI Enhancement**

   - Redesign landing page with interactive greeting
   - Create robust chat interface for human-AI conversations
   - Implement typing indicators and loading states
   - Add support for different message types (text, images)

3. **Context Awareness**

   - Develop system to track and store conversation context
   - Implement backend storage for conversation history
   - Create algorithms to reference past interactions

4. **Basic Trust System**
   - Design initial trust scoring algorithm
   - Track user interaction patterns
   - Implement basic sentiment analysis of conversations

### Implementation Priority

1. First, complete the backend implementation and replace mock APIs with real endpoints
2. Then enhance user profiles and implement conversation storage
3. Build the admin dashboard for monitoring
4. Begin integrating AI conversation capabilities
5. Enhance the conversation UI and implement context awareness
6. Finally, develop the initial trust scoring system

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
