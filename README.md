# Am I an AI

An interactive space for humans and AIs to converse.

## Project Structure

```
.
├── frontend/              # React TypeScript application
└── infrastructure/        # Terraform configuration
    ├── bootstrap/        # Initial Terraform state setup
    │   └── main.tf
    ├── scripts/         # Infrastructure management scripts
    │   ├── setup.sh    # Initial setup and deployment
    │   └── destroy.sh  # Clean teardown of resources
    ├── main.tf         # Main infrastructure configuration
    ├── variables.tf    # Variable definitions
    ├── outputs.tf      # Output definitions
    └── backend.tf      # S3 backend configuration
```

## Infrastructure

The project uses AWS infrastructure managed by Terraform:

### Core Components

- **S3**: Hosts the static website content
- **CloudFront**: CDN for global content delivery
- **Route53**: DNS management
- **ACM**: SSL certificate management

### State Management

Terraform state is managed locally for simplicity. All resources are in us-east-1 region.

### Variables

Key variables that can be configured:

- `domain_name`: Website domain (default: amianai.com)
- `environment`: Deployment environment (default: prod)
- `tags`: Resource tags for tracking and management

### Outputs

Important infrastructure information:

- `website_url`: The website's URL
- `cloudfront_distribution_id`: CloudFront distribution identifier
- `s3_bucket_name`: Name of the S3 bucket
- `certificate_arn`: SSL certificate ARN

## Getting Started

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0.0
- Node.js and npm for frontend development
- Domain name configured in Route53 (with NS and SOA records)

### Initial Setup

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

Note: The setup process takes approximately 15-30 minutes due to:

- SSL certificate validation (5-15 minutes)
- CloudFront distribution creation (10-15 minutes)

### Development Workflow

1. Make changes to the React app in `frontend/`
2. Test locally with `npm start`
3. Build and deploy:

```bash
cd frontend
npm run build
aws s3 sync build/ s3://amianai.com
aws cloudfront create-invalidation --distribution-id $(cd ../infrastructure && terraform output -raw cloudfront_distribution_id) --paths "/*"
```

### Infrastructure Management

#### Setup Script (`setup.sh`)

The setup script handles the complete infrastructure deployment:

```bash
cd infrastructure
./scripts/setup.sh
```

Expected duration: 15-30 minutes

#### Teardown Script (`destroy.sh`)

The destroy script handles complete cleanup:

```bash
cd infrastructure
./scripts/destroy.sh
```

Important: Wait for CloudFront to fully disable before running destroy script again.

### Resource Tags

All resources are tagged with:

- Project = "amianai"
- Environment = "prod"
- Terraform = "true"

## Progress Log

### Infrastructure Setup

- ✅ Local Terraform state configuration
- ✅ S3 bucket for website hosting
- ✅ CloudFront distribution
- ✅ SSL certificate and validation
- ✅ DNS configuration
- ✅ Infrastructure management scripts

### Next Steps

- [ ] Set up GitHub Actions for automated deployments
- [ ] Add React app features
- [ ] Configure monitoring and logging
- [ ] Set up development and staging environments

## Troubleshooting

Common issues and solutions:

1. CloudFront taking long to disable

   - Wait 10-15 minutes for the distribution to fully disable
   - Check status in AWS Console or using AWS CLI

2. Certificate validation issues

   - Ensure Route53 NS records are correct
   - Wait up to 15 minutes for DNS propagation

3. S3 bucket issues
   - Check bucket name matches domain name
   - Verify bucket region is us-east-1

## Contributing

[To be added]

## License

[To be added]
