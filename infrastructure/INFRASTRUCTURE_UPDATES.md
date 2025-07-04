# Infrastructure Updates Summary

## Completed Updates

### 4. **Deployment Strategy Simplification**
- ✅ **Removed complex orchestration scripts** - deploy.sh, components/ directory
- ✅ **Terraform-first approach** - Use terraform directly for infrastructure
- ✅ **Simple focused scripts** - Each script does one thing well
- ✅ **Updated all documentation** - README.md, CLAUDE.md, NEXT_STEPS.md
- ✅ **New script structure**:
  - `build-frontend.sh` - Build Next.js app
  - `deploy-frontend.sh` - Upload to S3 + invalidate CloudFront
  - `deploy-lambda.sh` - Package and deploy Lambda
  - `update-env.sh` - Sync terraform outputs to frontend env
  - `cleanup-old-resources.sh` - Safe cleanup utilities

## Previously Completed Updates

### 1. **Domain Migration**
- ✅ Updated from `amianai.com` to `robotorchestra.org`
- ✅ Route53 hosted zone created for new domain
- ✅ SSL certificates issued for new domain
- ✅ CloudFront distribution configured

### 2. **Documentation Updates**
- ✅ Updated `NEXT_STEPS.md` with current deployment status
- ✅ Updated `frontend.tf` comments to reference robotorchestra.org
- ✅ Updated `main.tf` header to use RobotOrchestra branding
- ✅ Fixed `deploy.sh` to include both infrastructure and app deployment
- ✅ Updated example domain in deploy.sh help text

### 3. **Security Fixes**
- ✅ **CRITICAL**: Removed exposed OpenAI API key from terraform.tfvars
- ✅ Added instructions for using environment variables
- ✅ Confirmed *.tfvars is in .gitignore

## Action Required

### 1. **Revoke Compromised API Key**
```bash
# 1. Go to OpenAI dashboard and revoke the exposed key
# 2. Generate a new API key
# 3. Set it as environment variable:
export TF_VAR_openai_api_key="your-new-api-key"
```

### 2. **Clean Up Old Infrastructure**
- NAT Gateways: `nat-0b92458c4a6d1563e`, `nat-0afc93deea230581c`
- Elastic IPs: `54.90.125.7`, `52.204.27.141`
- Run: `./scripts/destroy-v1-backend.sh` to clean up old VPC resources

### 3. **Verify Deployment**
```bash
# Check DNS propagation
dig robotorchestra.org

# Test the site (once DNS propagates)
curl -I https://robotorchestra.org
```

## Infrastructure State

- **S3 Bucket**: `robotorchestra.org`
- **CloudFront**: Distribution ID `EMQW4G75K2AQW`
- **WebSocket API**: `wss://ip1n2fcaw2.execute-api.us-east-1.amazonaws.com/prod`
- **DynamoDB Table**: `amianai-v2-sessions`
- **Lambda Function**: `amianai-v2-websocket`

## Cost Optimization

Current infrastructure avoids:
- VPC costs (~$90/month saved)
- NAT Gateway costs (~$45/month per gateway saved)
- Using serverless services (DynamoDB, Lambda) for pay-per-use pricing

Estimated monthly cost: ~$5-10