# Infrastructure Overview - Production Ready ✅

## System Architecture

The AmIAnAI platform uses a production-only AWS infrastructure with Lambda API integration and hybrid development approach.

### Core Components

**Frontend Infrastructure**
- **Next.js 14**: React-based application with TypeScript and comprehensive test suite (284+ tests)
- **S3 + CloudFront**: Static site hosting with global CDN and automated deployment
- **Route53**: DNS management with custom domain (amianai.com)
- **ACM**: SSL/TLS certificate management with automated validation

**API Infrastructure** ✅ PRODUCTION READY
- **API Gateway**: REST API with custom domain and CORS configuration
- **Lambda Functions**: Node.js 20.x TypeScript functions with VPC connectivity
- **OpenAI Integration**: Real AI response generation via secured API calls
- **Secrets Manager**: OpenAI API key management with encryption

**Database Infrastructure**
- **PostgreSQL RDS**: Production database (`eeyore-postgres`) with real conversation data
- **AWS Secrets Manager**: Database credential management with automatic rotation
- **VPC**: Network isolation with public/private subnets and security groups
- **Connection Pooling**: Optimized database performance for Lambda functions

**Authentication** (Ready for Integration)
- **AWS Cognito**: User pools configured for authentication
- **JWT Tokens**: Session management prepared
- **Protected Routes**: Frontend route protection implemented

### Infrastructure as Code

**Terraform Management**
- All AWS resources defined in Terraform
- Deployment scripts in `/infrastructure/scripts/`
- State management and version control
- Automated resource provisioning

**Deployment Scripts**
```bash
# Deploy infrastructure
DOMAIN_NAME=amianai.com GITHUB_USERNAME=nicolovejoy ./scripts/setup.sh

# Teardown infrastructure  
DOMAIN_NAME=amianai.com ./scripts/destroy.sh
```

### Production-Only Strategy

**Single Environment Approach**
- No separate dev/staging/production environments
- All development happens against production AWS resources
- Local Next.js development server connects to production database
- Simplified deployment and testing workflow

**Benefits**
- Environment parity - no dev/prod differences
- Simplified infrastructure management
- Real data for development and testing
- Faster iteration cycles
- Reduced operational complexity

**Safety Measures**
- Database admin operations require explicit enablement
- Environment variable controls for dangerous operations
- Comprehensive logging and monitoring
- Backup and recovery procedures

### Database Design

**PostgreSQL Schema**
- UUID primary keys for scalability
- JSONB fields for flexible metadata
- Comprehensive indexing for performance
- Foreign key relationships with cascade deletes

**Core Tables**
- `users` - User accounts and preferences
- `personas` - Human and AI personas
- `conversations` - Chat conversations with metadata
- `conversation_participants` - Many-to-many relationships
- `messages` - Individual chat messages

**Connection Management**
- Connection pooling for performance
- AWS Secrets Manager for credentials
- Retry logic and error handling
- Query optimization and monitoring

### Security Model

**Network Security**
- VPC with public/private subnet isolation
- Security groups for access control
- SSL/TLS encryption for all connections
- Private database subnets (temporarily public for setup)

**Application Security**
- AWS Cognito for authentication
- JWT token validation
- Environment-controlled admin operations
- Input validation and sanitization

**Data Security**
- Encrypted database storage
- Secrets Manager for credential storage
- Audit logging for admin operations
- Backup encryption and retention

### Monitoring & Operations

**Logging**
- CloudWatch for infrastructure metrics
- Application logging for debugging
- Database query monitoring
- Error tracking and alerting

**Backup Strategy**
- Automated RDS backups (7-day retention)
- Point-in-time recovery capability
- Cross-region backup replication (planned)
- Disaster recovery procedures

### Development Workflow

**Local Development**
1. Start Next.js development server (`npm run dev`)
2. Connect to production AWS database
3. Use database admin APIs for schema changes
4. Test with real production data

**Deployment Process**
1. Build Next.js application (`npm run build`)
2. Deploy static files to S3
3. Invalidate CloudFront cache
4. Verify deployment health

**Infrastructure Changes**
1. Modify Terraform configuration
2. Plan changes (`terraform plan`)
3. Apply via deployment scripts
4. Verify resource provisioning

### Cost Optimization

**Current Resources**
- RDS db.t3.micro instance
- S3 storage for static assets
- CloudFront data transfer
- Minimal Lambda usage (future)

**Optimization Strategies**
- Right-sized RDS instance
- CloudFront caching optimization
- S3 lifecycle policies
- Reserved capacity for predictable workloads

### Scalability Considerations

**Database Scaling**
- Read replicas for read-heavy workloads
- Connection pooling optimization
- Query performance monitoring
- Vertical scaling as needed

**Frontend Scaling**
- Global CDN distribution
- Static asset optimization
- Caching strategies
- Progressive loading

**Future Enhancements**
- Multi-region deployment
- Auto-scaling groups
- Load balancing
- Microservices architecture