# Lambda Implementation Plan - AmIAnAI Serverless API

## 🎯 Overview

Transform the current static-only deployment into a full serverless architecture with API Gateway + Lambda functions to enable real database interactions and AI features.

## 🏗️ Architecture Design

```
User → CloudFront → S3 (Static Frontend)
           ↓
      API Gateway (api.amianai.com)
           ↓
      Lambda Functions
           ↓
    RDS PostgreSQL + Secrets Manager
```

**Benefits:**
- Maintains static frontend performance
- Enables full database functionality
- Serverless scaling and cost efficiency
- Production-ready API endpoints

## 📊 Current State Analysis

### Existing API Endpoints (7 total)
```
Admin Routes:
- GET  /api/admin/database-status
- POST /api/admin/seed-database  
- POST /api/admin/setup-database

Core Application:
- POST /api/ai/generate-response
- GET  /api/conversations
- POST /api/conversations
- GET  /api/personas
- POST /api/personas
- GET  /api/personas/[id]
- PUT  /api/personas/[id]
- DELETE /api/personas/[id]
```

### Dependencies
- PostgreSQL database (AWS RDS)
- OpenAI API integration
- TypeScript/Node.js runtime
- Existing repository pattern

## 🚀 Implementation Phases

### Phase 1: Infrastructure Setup ✅ COMPLETED

#### 1.1 API Gateway Configuration ✅
- [x] Create REST API Gateway in us-east-1
- [x] Configure custom domain (api.amianai.com)
- [x] Set up SSL certificate via AWS Certificate Manager
- [x] Configure CORS policies for frontend domain
- [x] Set up request/response mappings with proxy integration

#### 1.2 Lambda Foundation ✅
- [x] Create Lambda execution role with permissions:
  - RDS access
  - Secrets Manager access
  - VPC networking
  - CloudWatch logging
- [x] Set up VPC configuration for RDS connectivity
- [x] Configure environment variables
- [x] Set up CloudWatch log groups

#### 1.3 Infrastructure as Code ✅
- [x] Update Terraform configuration to include:
  - API Gateway resources
  - Lambda function definitions
  - IAM roles and policies
  - Custom domain and Route53 records

#### 1.4 Lambda Code Structure ✅
- [x] TypeScript Lambda function with proper routing
- [x] Handler structure for conversations, personas, AI, admin
- [x] CORS support for all endpoints
- [x] Error handling and logging
- [x] Package.json with build and deployment scripts

#### 1.5 Script Integration ✅
- [x] Updated setup.sh to build and deploy Lambda
- [x] Updated destroy.sh for Lambda cleanup
- [x] Environment variables include API Gateway URLs
- [x] Terraform outputs for API endpoints

### Phase 2: Core API Implementation (Week 2)

#### 2.1 Lambda Function Structure (Monolithic Approach)
```typescript
src/
├── handlers/
│   ├── conversations.ts
│   ├── personas.ts
│   ├── ai.ts
│   └── admin.ts
├── lib/
│   ├── database.ts
│   ├── secrets.ts
│   └── validation.ts
├── types/
│   └── (shared with frontend)
└── index.ts (main router)
```

#### 2.2 Database Layer
- [ ] Port PostgreSQL connection logic to Lambda
- [ ] Implement RDS Proxy for connection pooling
- [ ] Handle secrets retrieval from AWS Secrets Manager
- [ ] Add connection retry logic
- [ ] Implement transaction handling

#### 2.3 Essential Endpoints (Priority 1 - MVP)
- [ ] GET /api/personas - List all personas
- [ ] GET /api/personas/:id - Get specific persona
- [ ] POST /api/conversations - Create new conversation
- [ ] GET /api/conversations/:id - Get conversation details
- [ ] POST /api/conversations/:id/messages - Add message

#### 2.4 Error Handling & Validation
- [ ] Structured error responses
- [ ] Proper HTTP status codes
- [ ] Request body validation
- [ ] Rate limiting implementation

### Phase 3: AI Integration (Week 3)

#### 3.1 AI Service Implementation
- [ ] POST /api/ai/generate-response
- [ ] OpenAI API integration with retry logic
- [ ] Response streaming support
- [ ] Rate limiting and quotas
- [ ] Cost tracking and monitoring

#### 3.2 Background Processing (Optional)
- [ ] SQS for async AI requests
- [ ] Dead Letter Queue for failed requests
- [ ] CloudWatch metrics for monitoring
- [ ] SNS notifications for alerts

### Phase 4: Advanced Features & Polish (Week 4)

#### 4.1 Complete API Surface
- [ ] POST /api/personas - Create persona
- [ ] PUT /api/personas/:id - Update persona
- [ ] DELETE /api/personas/:id - Delete persona
- [ ] GET /api/conversations - List conversations

#### 4.2 Admin Endpoints (Protected)
- [ ] Database setup/seed (development only)
- [ ] Health checks and status
- [ ] Metrics and monitoring endpoints

#### 4.3 Performance Optimization
- [ ] Lambda layers for shared dependencies
- [ ] Response caching strategies
- [ ] Cold start optimization
- [ ] Memory and timeout tuning

## 💰 Cost Analysis

### Monthly Estimates (Medium Traffic - 10K requests/month)
- **API Gateway**: $15-25
- **Lambda**: $5-10
- **RDS Proxy**: $20
- **CloudWatch**: $5
- **Data Transfer**: $5
- **Total**: ~$50-65/month

### Cost Optimization Strategies
- Use Lambda layers to reduce deployment size
- Implement response caching
- Optimize Lambda memory allocation
- Use reserved capacity for predictable workloads

## 🔒 Security Implementation

### Authentication & Authorization
- [ ] Cognito User Pool integration
- [ ] JWT token validation
- [ ] Role-based access control
- [ ] API key management for rate limiting

### Data Protection
- [ ] VPC configuration for Lambda-RDS communication
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Encryption in transit (TLS)
- [ ] Encryption at rest (RDS)

### CORS Configuration
```json
{
  "allowOrigins": ["https://amianai.com", "http://localhost:3000"],
  "allowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowHeaders": ["Content-Type", "Authorization"],
  "maxAge": 86400
}
```

## 🛠️ Development Tools & Technologies

### Infrastructure
- **AWS SAM** or **CDK**: Infrastructure as Code
- **Terraform**: Existing infrastructure management
- **GitHub Actions**: CI/CD pipeline

### Development
- **TypeScript**: Lambda runtime language
- **Prisma** or **pg**: PostgreSQL client
- **OpenAI SDK**: AI integration
- **Jest**: Unit and integration testing
- **ESLint**: Code quality

### Monitoring
- **CloudWatch**: Logging and metrics
- **X-Ray**: Distributed tracing
- **AWS Cost Explorer**: Cost monitoring

## 🚢 Deployment Strategy

### CI/CD Pipeline
```yaml
# .github/workflows/deploy-lambda.yml
name: Deploy Lambda API
on:
  push:
    branches: [main]
    paths: ['backend/lambda/**', 'infrastructure/**']

jobs:
  deploy:
    - Build Lambda bundle
    - Run tests
    - Deploy to AWS using SAM
    - Update API Gateway
    - Run integration tests
    - Invalidate CloudFront cache
```

### Environment Management
- **Development**: Separate Lambda with test database
- **Production**: Production Lambda with main RDS instance

## 📋 Pre-Implementation Checklist

### AWS Setup
- [ ] Ensure RDS instance is accessible from Lambda VPC
- [ ] Verify Secrets Manager contains database credentials
- [ ] Confirm OpenAI API key is stored securely
- [ ] Set up CloudWatch log retention policies

### Development Environment
- [ ] AWS CLI configured with appropriate permissions
- [ ] SAM CLI installed for local development
- [ ] Node.js 18+ runtime available
- [ ] TypeScript development environment

### Testing Strategy
- [ ] Unit tests for business logic
- [ ] Integration tests with test database
- [ ] Load testing for performance validation
- [ ] Security testing for vulnerabilities

## 🎯 Success Metrics

### Functional
- [ ] All 7 API endpoints working in production
- [ ] Frontend successfully creates real conversations
- [ ] AI responses generated and stored
- [ ] Zero data loss during deployment

### Performance
- [ ] API response time < 500ms (95th percentile)
- [ ] Lambda cold starts < 2 seconds
- [ ] 99.9% uptime
- [ ] Cost within $100/month budget

### Security
- [ ] No exposed credentials
- [ ] All data encrypted in transit and at rest
- [ ] CORS properly configured
- [ ] Rate limiting effective

## 📅 Timeline Summary

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Infrastructure | API Gateway + Lambda foundation |
| 2 | Core APIs | Personas + Conversations working |
| 3 | AI Integration | AI responses in production |
| 4 | Polish | Admin endpoints + optimization |

## 🚨 Risk Mitigation

### Technical Risks
- **RDS Connection Limits**: Use RDS Proxy
- **Lambda Cold Starts**: Implement warming strategy
- **API Gateway Limits**: Monitor usage, implement caching

### Business Risks
- **Cost Overruns**: Set up billing alerts, implement quotas
- **Data Loss**: Comprehensive backup strategy
- **Downtime**: Blue/green deployment strategy

---

**Created**: 2025-06-08
**Status**: Planning Phase
**Next Steps**: Begin Phase 1 implementation