# Robot Orchestra Deployment Guide

## Prerequisites
- AWS CLI configured with appropriate credentials
- Terraform installed
- Node.js 20.x installed
- Domain configured in Route53 (robotorchestra.org)

## Deployment Steps

### 1. Deploy Infrastructure
```bash
cd infrastructure
terraform init  # Only needed first time
terraform plan  # Review changes
terraform apply # Deploy infrastructure
```

### 2. Deploy Lambda Functions
```bash
cd infrastructure
./scripts/deploy-lambdas.sh
```

This deploys all 4 Lambda functions:
- match-service (includes match history)
- robot-worker
- ai-service  
- admin-service

### 3. Deploy Frontend
```bash
cd infrastructure
./scripts/deploy-frontend.sh
```

## Post-Deployment Cleanup

If you previously had match-history Lambda deployed, remove it from state:
```bash
terraform state rm aws_lambda_function.match_history
terraform state rm aws_iam_role.match_history_lambda
terraform state rm aws_iam_role_policy_attachment.match_history_lambda_basic
terraform state rm aws_iam_role_policy_attachment.match_history_lambda_dynamodb
terraform state rm aws_cloudwatch_log_group.match_history_logs
terraform state rm aws_lambda_permission.match_history_apigateway
```

## Verification

### 1. Test API Endpoints
```bash
# Test match service health
curl https://[api-id].execute-api.us-east-1.amazonaws.com/prod/health

# Test match history
curl https://[api-id].execute-api.us-east-1.amazonaws.com/prod/matches/history
```

### 2. Test Frontend
- Visit https://robotorchestra.org
- Create a new match
- Verify AI-generated prompts (should be unique each time)
- Check polling interval in Network tab (should be 4s)

### 3. Monitor Logs
```bash
# View recent logs
aws logs tail /aws/lambda/robot-orchestra-match-service --since 10m
aws logs tail /aws/lambda/robot-orchestra-robot-worker --since 10m
aws logs tail /aws/lambda/robot-orchestra-ai-service --since 10m
aws logs tail /aws/lambda/robot-orchestra-admin-service --since 10m
```

## Environment Variables

### Lambda Environment Variables
- `DYNAMODB_TABLE_NAME`: robot-orchestra-matches
- `SQS_QUEUE_URL`: Robot response queue URL
- `AI_SERVICE_FUNCTION_NAME`: robot-orchestra-ai-service
- `STATE_UPDATE_QUEUE_URL`: State update queue URL

### Frontend Environment Variables
- `VITE_MATCH_SERVICE_API`: API Gateway endpoint

## Troubleshooting

### AI Prompts Not Working
1. Check AI service logs for errors
2. Verify Bedrock permissions
3. Check AI_SERVICE_FUNCTION_NAME env var in match-service

### Admin Service Issues
1. Verify Authorization header is included
2. Check admin-service CloudWatch logs
3. Ensure IAM permissions for DynamoDB

### Polling Issues
1. Clear browser cache
2. Check Network tab for request frequency
3. Verify frontend deployment completed

## Rollback

To rollback changes:
```bash
# Infrastructure
terraform apply -target=[previous-resource]

# Lambda functions
# Deploy previous version from git
git checkout [previous-commit] lambda/
./scripts/deploy-lambdas.sh

# Frontend
git checkout [previous-commit] frontend/
./scripts/deploy-frontend.sh
```