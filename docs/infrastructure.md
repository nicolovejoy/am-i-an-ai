# Infrastructure & Architecture

## System Architecture

The "Am I an AI?" application is built with a modern web architecture featuring a Next.js frontend with serverless backend components:

### Frontend Architecture

- **Next.js Application**: Built with Next.js 15, React 19, and TypeScript
- **App Router**: Using Next.js App Router for file-system based routing
- **State Management**:
  - Zustand for global state management
  - React Query for server state management
  - React hooks for local state
- **Component Structure**: Modular components with clear separation of concerns
- **Design System**: Tailwind CSS for styling with TypeScript interfaces
- **Testing**: Jest and React Testing Library for testing
- **Development Tools**:
  - ESLint for code linting
  - TypeScript for type safety
  - PostCSS and Autoprefixer for CSS processing

### Backend Architecture

The backend follows a serverless architecture pattern:

- **API Gateway**: Routes API requests to Lambda functions
- **Lambda Functions**: Process requests and return responses
- **DynamoDB Tables**:
  - Users table for user management
- **S3**: Hosts static website assets (Next.js static export)
- **CloudFront**: CDN for global content delivery
- **Route53**: DNS management

## AWS Infrastructure

The project uses AWS infrastructure managed by Terraform:

### Core Components

- **S3**: Hosts the static website content

  - Configured for website hosting
  - Restricted access via CloudFront
  - Lifecycle policies for object management
  - Public access block configuration for security

- **CloudFront**: CDN for global content delivery

  - HTTPS enforcement
  - Custom error responses for client-side routing
  - Multiple origin support (S3 and API Gateway)
  - Optimized caching behaviors
  - IPv6 enabled

- **Route53**: DNS management

  - A records pointing to CloudFront distribution
  - DNS validation for SSL certificate

- **ACM**: SSL certificate management

  - Automated renewal
  - DNS validation method
  - TLSv1.2_2021 minimum protocol version
  - US-East-1 region for CloudFront compatibility

- **API Gateway**: REST API management

  - Lambda integration
  - Proxy resource for flexible routing
  - CORS support

- **Lambda**: Serverless compute

  - Node.js runtime
  - IAM roles with least privilege
  - DynamoDB access permissions

- **DynamoDB**: NoSQL database
  - Users table for user management
  - Optimized for read/write performance

### Infrastructure as Code

All infrastructure is defined using Terraform for consistency and reproducibility:

```hcl
# S3 bucket for website hosting
resource "aws_s3_bucket" "website" {
  bucket        = var.domain_name
  force_destroy = true
  tags          = var.tags
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"
  aliases            = ["amianai.com"]

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.website.cloudfront_access_identity_path
    }
  }

  # Additional configuration...
}
```

### Deployment Pipeline

The CI/CD pipeline is implemented with GitHub Actions:

1. Code is pushed to the repository
2. GitHub Actions workflow is triggered
3. Dependencies are installed
4. Tests are run
5. Next.js application is built (`next build`)
6. Static files are exported
7. Built files are deployed to S3
8. CloudFront cache is invalidated

## Security Considerations

The infrastructure includes several security measures:

- **S3 Bucket Policies**: Restricting direct access to website content
- **CloudFront OAI**: Only allowing CloudFront to access S3 content
- **HTTPS Enforcement**: All traffic is encrypted in transit
- **IAM Policies**: Least privilege principle for all service accounts
- **OIDC for GitHub Actions**: No long-lived credentials in CI/CD
- **Public Access Block**: S3 bucket security controls
- **TLSv1.2_2021**: Modern TLS configuration

## Cost Optimization

The serverless architecture provides cost optimization:

- **Pay-per-use model**: Only pay for actual usage
- **No always-on servers**: Reduces baseline costs
- **CloudFront caching**: Reduces origin requests
- **S3 lifecycle policies**: Manages storage costs
- **DynamoDB on-demand**: Pay only for actual database operations

## Monitoring & Logging

Infrastructure monitoring utilizes:

- **CloudWatch**: Metrics and alarms for service health
- **CloudTrail**: Audit logs for all AWS API calls
- **S3 Access Logs**: Detailed logs of website access
- **CloudFront Logs**: Detailed CDN request logs
- **API Gateway Logs**: API request/response logging

## Disaster Recovery

The infrastructure includes disaster recovery measures:

- **S3 Versioning**: Enables point-in-time recovery
- **CloudFront Failover**: Regional resilience
- **Backup Procedures**: Regular backups of configuration and content
- **Recovery Time Objective (RTO)**: Typically minutes for full restoration
- **Recovery Point Objective (RPO)**: Typically seconds to minutes of data loss in worst case
