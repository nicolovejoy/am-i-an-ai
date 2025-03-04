# Am I an AI

An interactive space for humans and AIs to converse.

## Project Structure

- `frontend/` - React TypeScript application
- `infrastructure/` - Terraform configuration for AWS infrastructure
  - `bootstrap/` - Initial Terraform state management resources
  - `main.tf` - Main infrastructure configuration
  - `variables.tf` - Variable definitions
  - `outputs.tf` - Output definitions

## Current Infrastructure

- S3 bucket for static website hosting
- CloudFront distribution for content delivery
- SSL/TLS certificate through AWS Certificate Manager
- Route53 DNS configuration
- Terraform state management in S3 with DynamoDB locking

## Getting Started

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:

   ```bash
   npm start
   ```

3. Deploy infrastructure:

   ```bash
   cd infrastructure/bootstrap
   terraform init
   terraform apply

   cd ..
   terraform init
   terraform apply
   ```

## Todo List

- [ ] Set up GitHub Actions for automated deployments
- [ ] Add more features to the React app
  - [ ] Chat interface
  - [ ] User authentication
  - [ ] AI integration
- [ ] Set up monitoring and logging
  - [ ] CloudWatch metrics
  - [ ] Error tracking
  - [ ] Performance monitoring
- [ ] Add environment variable management
- [ ] Set up development, staging, and production environments
- [ ] Add testing infrastructure
- [ ] Implement security best practices
  - [ ] WAF configuration
  - [ ] Security headers
  - [ ] Rate limiting

## Contributing

[To be added]

## License

[To be added]
