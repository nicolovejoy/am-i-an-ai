# RobotOrchestra - Deployment Guide

## **Terraform-First Deployment Strategy**

This project uses **Terraform for infrastructure** and **simple scripts for application deployment**.

### **Infrastructure Management (Terraform)**

Use Terraform directly for all infrastructure changes:

```bash
cd infrastructure

# Review and apply infrastructure changes
terraform plan
terraform apply

# Destroy infrastructure (if needed)
terraform destroy
```

### **Application Deployment (Scripts)**

Use focused scripts for building and deploying applications:

```bash
cd infrastructure/scripts

# Update frontend environment variables from terraform
./update-env.sh

# Build and deploy frontend
./build-frontend.sh
DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh

# Deploy Lambda function
export TF_VAR_openai_api_key="your-api-key"
./deploy-lambda.sh
```

## **Available Scripts**

| Script | Purpose | Requirements |
|--------|---------|--------------|
| `update-env.sh` | Update frontend environment from terraform outputs | Terraform state |
| `build-frontend.sh` | Build Next.js application for static export | Frontend dependencies |
| `deploy-frontend.sh` | Upload frontend to S3 + invalidate CloudFront | `DOMAIN_NAME` env var |
| `deploy-lambda.sh` | Build and deploy Lambda function | `TF_VAR_openai_api_key` env var |
| `audit-all-resources.sh` | Complete AWS resource audit | AWS CLI access |
| `cleanup-old-resources.sh` | Remove unused expensive resources | AWS CLI access |

## **Complete Deployment Workflow**

### Initial Deployment
```bash
# 1. Deploy all infrastructure
cd infrastructure
terraform init
terraform plan
terraform apply

# 2. Update frontend environment
cd scripts
./update-env.sh

# 3. Build and deploy frontend
./build-frontend.sh
DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh

# 4. Deploy Lambda with OpenAI integration
export TF_VAR_openai_api_key="your-api-key"
./deploy-lambda.sh
```

### Regular Updates
```bash
# Frontend changes
./build-frontend.sh
DOMAIN_NAME=robotorchestra.org ./deploy-frontend.sh

# Lambda changes
./deploy-lambda.sh

# Infrastructure changes
cd ../
terraform plan
terraform apply
```

## **Architecture Overview**

- **S3 + CloudFront**: Static website hosting
- **Route53**: DNS management with custom domain
- **Lambda + API Gateway**: WebSocket API for real-time 2H+2AI sessions
- **DynamoDB**: Session state storage
- **Cognito**: User authentication
- **ACM**: SSL certificates

**Cost**: ~$5-10/month (serverless, pay-per-use)
